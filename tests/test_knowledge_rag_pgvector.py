"""End-to-end integration test: FastEmbed + PgVectorStore + KnowledgeRAG."""
import os
import uuid

import pytest

from src.knowledge.fastembed_model import FastEmbedModel
from src.knowledge.pgvector_store import PgVectorStore
from src.knowledge.rag import KnowledgeItem, KnowledgeRAG

pytestmark = pytest.mark.integration


@pytest.fixture
async def rag():
    dsn = os.environ.get("DATABASE_URL", "postgresql://garyyifei@127.0.0.1:5434/gc_teamwork_dev")
    store = PgVectorStore(dsn=dsn, dimension=512)
    model = FastEmbedModel()
    rag = KnowledgeRAG(vector_store=store, embedding_model=model)
    await rag.initialize()
    yield rag
    # cleanup
    async with store._pool.acquire() as conn:
        await conn.execute("DELETE FROM knowledge_embeddings WHERE id LIKE 'e2e-test-%'")
    await rag.close()


async def test_semantic_search_finds_relevant_doc(rag):
    docs = [
        KnowledgeItem(
            id=f"e2e-test-{uuid.uuid4()}",
            title="项目立项流程",
            content="项目立项需要提交立项申请书、可行性分析报告、预算估算三份文档。",
            category="process",
        ),
        KnowledgeItem(
            id=f"e2e-test-{uuid.uuid4()}",
            title="员工报销规定",
            content="差旅费报销需附机票和酒店发票原件，金额超过500元需部门经理签字。",
            category="policy",
        ),
        KnowledgeItem(
            id=f"e2e-test-{uuid.uuid4()}",
            title="采购管理办法",
            content="单笔采购金额超过10万元的物资必须经过招投标程序。",
            category="process",
        ),
    ]
    for doc in docs:
        await rag.add_knowledge(doc)

    # Query 1: should match 立项
    results = await rag.search("新项目怎么立项", top_k=3)
    assert len(results) >= 1
    top_titles = [r.item.title for r in results[:2]]
    assert "项目立项流程" in top_titles

    # Query 2: should match 报销
    results = await rag.search("出差发票能报多少", top_k=3)
    assert len(results) >= 1
    top_titles = [r.item.title for r in results[:2]]
    assert "员工报销规定" in top_titles


async def test_get_context_for_llm_returns_string(rag):
    doc = KnowledgeItem(
        id=f"e2e-test-{uuid.uuid4()}",
        title="测试文档",
        content="这是一份用于测试 RAG 上下文构建的示例文档。",
        category="general",
    )
    await rag.add_knowledge(doc)

    ctx = await rag.get_context_for_llm("测试", top_k=1)
    assert isinstance(ctx, str)
    assert "测试文档" in ctx
