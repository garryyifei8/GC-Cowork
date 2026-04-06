"""Document management API endpoints."""

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from src.core.exceptions import PlatformError
from src.core.models import DocumentItem
from src.stores.document_store import (
    create_document,
    delete_document,
    get_document,
    list_documents,
    update_document,
)

router = APIRouter(prefix="/documents", tags=["documents"])


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


def _to_response(doc: DocumentItem) -> DocumentResponse:
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
    from uuid import uuid4

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
    """Upload a document file. Currently stores metadata only."""
    from uuid import uuid4

    file_title = title or file.filename or "未命名文档"
    content = await file.read()
    size_kb = len(content) / 1024

    doc = DocumentItem(
        id=f"doc-{uuid4().hex[:8]}",
        title=file_title,
        doc_type=doc_type,
        project_id=project_id if project_id else None,
        content_summary=f"上传文件: {file.filename} ({size_kb:.1f} KB)",
        version="1.0",
        author=author or "当前用户",
        category=category,
        status="draft",
    )
    created = create_document(doc)
    return _to_response(created)
