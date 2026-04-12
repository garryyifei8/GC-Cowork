"""Batch-ingest existing documents into the knowledge RAG vector store.

Usage:
    python -m scripts.ingest_knowledge
"""

from __future__ import annotations

import asyncio
import sys
from typing import Iterable

from src.knowledge.rag import KnowledgeItem, KnowledgeRAG, build_rag


async def ingest_documents(rag: KnowledgeRAG, docs: Iterable) -> int:
    """Ingest a list of documents into the RAG."""
    count = 0
    for doc in docs:
        content = getattr(doc, "content_summary", "") or ""
        if not content.strip():
            continue
        item = KnowledgeItem(
            id=doc.id,
            title=doc.title,
            content=content,
            category=getattr(doc, "doc_type", "general") or "general",
            project_id=getattr(doc, "project_id", None),
            created_by=getattr(doc, "author", None),
        )
        await rag.add_knowledge(item)
        count += 1
    return count


async def main() -> int:
    from src.stores.document_store import list_documents

    rag = build_rag()
    await rag.initialize()
    try:
        docs = list_documents()
        print(f"Found {len(docs)} documents in document_store")
        n = await ingest_documents(rag, docs)
        print(f"Ingested {n} documents into {type(rag.vector_store).__name__}")
        return 0
    finally:
        await rag.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
