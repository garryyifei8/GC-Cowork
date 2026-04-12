"""Knowledge base API endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.core.auth import require_auth
from src.stores.document_store import get_document, list_documents

router = APIRouter(prefix="/knowledge", tags=["knowledge"], dependencies=[Depends(require_auth)])


class KnowledgeDocResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    project_id: str | None
    content_summary: str
    version: str
    author: str
    status: str


class SearchRequest(BaseModel):
    query: str
    category: str | None = None
    top_k: int = 10


class SearchResultItem(BaseModel):
    id: str
    title: str
    doc_type: str
    content_summary: str
    author: str
    status: str
    score: float


@router.get("/documents", response_model=list[KnowledgeDocResponse])
async def list_knowledge_documents(
    doc_type: str | None = None,
    status: str | None = None,
):
    """List all knowledge documents with optional filters."""
    docs = list_documents(doc_type=doc_type, status=status)
    return [
        KnowledgeDocResponse(
            id=d.id,
            title=d.title,
            doc_type=d.doc_type,
            project_id=d.project_id,
            content_summary=d.content_summary,
            version=d.version,
            author=d.author,
            status=d.status,
        )
        for d in docs
    ]


@router.get("/documents/{doc_id}", response_model=KnowledgeDocResponse)
async def get_knowledge_document(doc_id: str):
    """Get a single knowledge document by ID."""
    from src.core.exceptions import PlatformError

    doc = get_document(doc_id)
    if not doc:
        raise PlatformError("Document not found", detail={"id": doc_id})
    return KnowledgeDocResponse(
        id=doc.id,
        title=doc.title,
        doc_type=doc.doc_type,
        project_id=doc.project_id,
        content_summary=doc.content_summary,
        version=doc.version,
        author=doc.author,
        status=doc.status,
    )


@router.post("/search", response_model=list[SearchResultItem])
async def search_knowledge(req: SearchRequest):
    """Search knowledge base using semantic RAG retrieval."""
    from src.knowledge.dependencies import get_rag

    rag = get_rag()
    results = await rag.search(
        query=req.query,
        top_k=req.top_k,
        category=req.category,
    )

    return [
        SearchResultItem(
            id=r.item.id,
            title=r.item.title,
            doc_type=r.item.category,
            content_summary=r.highlight or r.item.content[:200],
            author=r.item.created_by or "",
            status="published",
            score=round(r.score * 100, 2),
        )
        for r in results
    ]
