"""Test knowledge ingestion script."""
from unittest.mock import AsyncMock, MagicMock

from scripts.ingest_knowledge import ingest_documents
from src.knowledge.rag import KnowledgeItem


async def test_ingest_calls_rag_add_for_each_doc():
    docs = [
        MagicMock(id="d1", title="T1", content_summary="C1", doc_type="process", project_id=None, author="a"),
        MagicMock(id="d2", title="T2", content_summary="C2", doc_type="policy", project_id="p1", author="b"),
    ]
    rag = MagicMock()
    rag.add_knowledge = AsyncMock()

    count = await ingest_documents(rag, docs)
    assert count == 2
    assert rag.add_knowledge.await_count == 2
    first_item = rag.add_knowledge.await_args_list[0].args[0]
    assert isinstance(first_item, KnowledgeItem)
    assert first_item.id == "d1"
    assert first_item.title == "T1"
    assert first_item.category == "process"


async def test_ingest_skips_empty_content():
    docs = [
        MagicMock(id="d1", title="T1", content_summary="", doc_type="process", project_id=None, author="a"),
        MagicMock(id="d2", title="T2", content_summary="有内容", doc_type="policy", project_id=None, author="b"),
    ]
    rag = MagicMock()
    rag.add_knowledge = AsyncMock()

    count = await ingest_documents(rag, docs)
    assert count == 1
