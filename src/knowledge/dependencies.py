"""FastAPI dependencies for the knowledge base."""

from __future__ import annotations

from src.knowledge.rag import KnowledgeRAG, build_rag

_rag_instance: KnowledgeRAG | None = None


def get_rag() -> KnowledgeRAG:
    """Return the process-wide KnowledgeRAG singleton."""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = build_rag()
    return _rag_instance


def reset_rag() -> None:
    """Reset the singleton (used by tests)."""
    global _rag_instance
    _rag_instance = None


async def init_rag() -> KnowledgeRAG:
    """Initialize the RAG singleton during app startup."""
    rag = get_rag()
    await rag.initialize()
    return rag


async def shutdown_rag() -> None:
    """Close the RAG singleton's resources."""
    global _rag_instance
    if _rag_instance is not None:
        await _rag_instance.close()
        _rag_instance = None
