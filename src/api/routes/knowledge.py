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
    """Search knowledge base using keyword matching (RAG integration ready)."""
    docs = list_documents()
    query_lower = req.query.lower()

    results: list[tuple[float, any]] = []
    for doc in docs:
        score = 0.0
        searchable = f"{doc.title} {doc.content_summary} {doc.author}".lower()
        # Simple keyword scoring
        for keyword in query_lower.split():
            if keyword in searchable:
                score += 30.0
            if keyword in doc.title.lower():
                score += 20.0
        if score > 0:
            # Normalize to 0-100
            score = min(score, 100.0)
            if req.category and doc.doc_type != req.category:
                continue
            results.append((score, doc))

    results.sort(key=lambda x: x[0], reverse=True)
    results = results[: req.top_k]

    return [
        SearchResultItem(
            id=doc.id,
            title=doc.title,
            doc_type=doc.doc_type,
            content_summary=doc.content_summary,
            author=doc.author,
            status=doc.status,
            score=score,
        )
        for score, doc in results
    ]
