"""Document management API endpoints."""

import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from src.core.auth import require_auth
from src.core.exceptions import PlatformError
from src.core.models import DocumentItem
from src.stores.document_store import (
    create_document,
    delete_document,
    get_document,
    list_documents,
    update_document,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"], dependencies=[Depends(require_auth)])


class DocumentResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    project_id: str | None
    content_summary: str
    version: str
    author: str
    status: str
    category: str
    storage_path: str | None = None
    file_name: str | None = None
    file_size: int | None = None
    mime_type: str | None = None
    file_url: str | None = None


class CreateDocumentRequest(BaseModel):
    title: str
    doc_type: str = "report"
    project_id: str | None = None
    content_summary: str = ""
    version: str = "1.0"
    author: str = ""
    category: str = "general"


class UpdateDocumentRequest(BaseModel):
    title: str | None = None
    doc_type: str | None = None
    content_summary: str | None = None
    version: str | None = None
    status: str | None = None
    category: str | None = None


def _to_response(doc) -> DocumentResponse:
    """Convert a DocumentItem (Pydantic model or DotDict) to DocumentResponse."""
    if isinstance(doc, dict):
        return DocumentResponse(**{k: doc.get(k) for k in DocumentResponse.model_fields})
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        doc_type=doc.doc_type,
        project_id=doc.project_id,
        content_summary=doc.content_summary,
        version=doc.version,
        author=doc.author,
        status=doc.status,
        category=doc.category,
        storage_path=getattr(doc, "storage_path", None),
        file_name=getattr(doc, "file_name", None),
        file_size=getattr(doc, "file_size", None),
        mime_type=getattr(doc, "mime_type", None),
        file_url=getattr(doc, "file_url", None),
    )


@router.get("", response_model=list[DocumentResponse])
async def list_documents_endpoint(
    project_id: str | None = None,
    doc_type: str | None = None,
    status: str | None = None,
    category: str | None = None,
):
    docs = list_documents(project_id=project_id, doc_type=doc_type, status=status, category=category)
    return [_to_response(d) for d in docs]


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document_endpoint(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise PlatformError("Document not found", detail={"id": doc_id})
    return _to_response(doc)


@router.post("", response_model=DocumentResponse)
async def create_document_endpoint(req: CreateDocumentRequest):
    doc = DocumentItem(
        id=f"doc-{uuid4().hex[:8]}",
        title=req.title,
        doc_type=req.doc_type,
        project_id=req.project_id,
        content_summary=req.content_summary,
        version=req.version,
        author=req.author,
        category=req.category,
        status="draft",
    )
    created = create_document(doc)
    return _to_response(created)


@router.patch("/{doc_id}", response_model=DocumentResponse)
async def update_document_endpoint(doc_id: str, req: UpdateDocumentRequest):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = update_document(doc_id, updates)
    if not updated:
        raise PlatformError("Document not found", detail={"id": doc_id})
    return _to_response(updated)


@router.delete("/{doc_id}")
async def delete_document_endpoint(doc_id: str):
    # Try to clean up storage file
    doc = get_document(doc_id)
    if not doc:
        raise PlatformError("Document not found", detail={"id": doc_id})

    storage_path = (
        doc.storage_path if hasattr(doc, "storage_path") else doc.get("storage_path") if isinstance(doc, dict) else None
    )
    if storage_path:
        try:
            from src.services.storage import get_storage

            parts = storage_path.split("/", 1)
            if len(parts) == 2:
                get_storage().delete(parts[0], [parts[1]])
        except Exception:
            logger.warning("Failed to delete storage file: %s", storage_path, exc_info=True)

    if not delete_document(doc_id):
        raise PlatformError("Document not found", detail={"id": doc_id})
    return {"ok": True}


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    doc_type: str = Form("report"),
    project_id: str = Form(""),
    author: str = Form(""),
    category: str = Form("general"),
):
    """Upload a document file to Supabase Storage."""
    from src.services.storage import resolve_bucket, validate_file

    file_title = title or file.filename or "未命名文档"
    content = await file.read()
    mime = file.content_type or "application/octet-stream"

    validate_file(content, mime, file.filename)

    doc_id = f"doc-{uuid4().hex[:8]}"
    size_kb = len(content) / 1024
    storage_path = None
    file_url = None

    # Try to upload to Supabase Storage; fall back to metadata-only if unavailable
    try:
        from src.services.storage import get_storage

        bucket = resolve_bucket(mime)
        safe_name = (file.filename or "file").replace(" ", "_")
        object_path = f"{project_id or 'general'}/{doc_id}/{safe_name}"

        storage = get_storage()
        storage_path = storage.upload(bucket, content, object_path, mime)
        file_url = f"/api/documents/file/{storage_path}"
    except Exception:
        logger.warning("Storage unavailable, saving metadata only", exc_info=True)

    doc = DocumentItem(
        id=doc_id,
        title=file_title,
        doc_type=doc_type,
        project_id=project_id if project_id else None,
        content_summary=f"上传文件: {file.filename} ({size_kb:.1f} KB)",
        version="1.0",
        author=author or "当前用户",
        category=category,
        status="draft",
        storage_path=storage_path,
        file_name=file.filename,
        file_size=len(content),
        mime_type=mime,
        file_url=file_url,
    )
    created = create_document(doc)
    return _to_response(created)


@router.get("/file/{bucket_id}/{path:path}")
async def proxy_file_download(bucket_id: str, path: str):
    """Proxy file download from Supabase Storage — avoids exposing credentials to frontend."""
    from src.services.storage import get_storage

    storage = get_storage()
    try:
        data = storage.download(bucket_id, path)
    except RuntimeError as e:
        raise PlatformError("File not found", detail={"path": f"{bucket_id}/{path}"}) from e

    # Guess content type from extension
    import mimetypes

    content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
    filename = path.rsplit("/", 1)[-1] if "/" in path else path

    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/{doc_id}/download")
async def download_document(doc_id: str):
    """Download a document by its ID — redirects to the proxy endpoint."""
    doc = get_document(doc_id)
    if not doc:
        raise PlatformError("Document not found", detail={"id": doc_id})

    storage_path = (
        doc.storage_path if hasattr(doc, "storage_path") else doc.get("storage_path") if isinstance(doc, dict) else None
    )
    if not storage_path:
        raise PlatformError("此文档无关联文件", detail={"id": doc_id})

    from src.services.storage import get_storage

    parts = storage_path.split("/", 1)
    if len(parts) != 2:
        raise PlatformError("Invalid storage path", detail={"path": storage_path})

    bucket_id, path = parts
    storage = get_storage()
    data = storage.download(bucket_id, path)

    file_name = doc.file_name if hasattr(doc, "file_name") else doc.get("file_name") if isinstance(doc, dict) else None
    mime_type = doc.mime_type if hasattr(doc, "mime_type") else doc.get("mime_type") if isinstance(doc, dict) else None

    return Response(
        content=data,
        media_type=mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{file_name or "download"}"'},
    )
