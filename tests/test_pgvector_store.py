"""Integration tests for PgVectorStore (requires Postgres + pgvector)."""
import os
import uuid

import pytest

from src.knowledge.pgvector_store import PgVectorStore
from src.knowledge.rag import KnowledgeItem

pytestmark = pytest.mark.integration


@pytest.fixture
async def store():
    dsn = os.environ.get("DATABASE_URL", "postgresql://garyyifei@127.0.0.1:5434/gc_teamwork_dev")
    s = PgVectorStore(dsn=dsn, dimension=512)
    await s.connect()
    yield s
    # cleanup: delete all test rows (id prefix "pgv-test-")
    async with s._pool.acquire() as conn:
        await conn.execute("DELETE FROM knowledge_embeddings WHERE id LIKE 'pgv-test-%'")
    await s.disconnect()


def _make_embedding(seed: float, dim: int = 512) -> list[float]:
    """Deterministic embedding for testing (normalized)."""
    import math
    raw = [(seed + i * 0.001) for i in range(dim)]
    norm = math.sqrt(sum(x * x for x in raw))
    return [x / norm for x in raw]


class TestPgVectorStore:
    async def test_add_and_search_single_item(self, store):
        item = KnowledgeItem(
            id=f"pgv-test-{uuid.uuid4()}",
            title="项目管理规范",
            content="本规范定义了项目立项、执行、验收的标准流程。",
            category="process",
            tags=["管理", "规范"],
            project_id="p-demo",
        )
        embedding = _make_embedding(0.1)
        await store.add(item, embedding)

        results = await store.search(embedding, top_k=5)
        assert len(results) >= 1
        found_item, score = results[0]
        assert found_item.id == item.id
        assert found_item.title == item.title
        assert score > 0.99  # self-search should be near-perfect

    async def test_search_filters_by_category(self, store):
        id1 = f"pgv-test-{uuid.uuid4()}"
        id2 = f"pgv-test-{uuid.uuid4()}"
        await store.add(
            KnowledgeItem(id=id1, title="A", content="a", category="process"),
            _make_embedding(0.2),
        )
        await store.add(
            KnowledgeItem(id=id2, title="B", content="b", category="policy"),
            _make_embedding(0.2),  # same embedding
        )

        results = await store.search(
            _make_embedding(0.2), top_k=10, filters={"category": "policy"}
        )
        ids = [r[0].id for r in results]
        assert id2 in ids
        assert id1 not in ids

    async def test_add_is_upsert(self, store):
        item_id = f"pgv-test-{uuid.uuid4()}"
        item = KnowledgeItem(id=item_id, title="v1", content="c1", category="general")
        await store.add(item, _make_embedding(0.3))
        # re-add with same id, different title
        item.title = "v2"
        await store.add(item, _make_embedding(0.3))

        results = await store.search(_make_embedding(0.3), top_k=1)
        assert results[0][0].title == "v2"

    async def test_delete_removes_item(self, store):
        item_id = f"pgv-test-{uuid.uuid4()}"
        await store.add(
            KnowledgeItem(id=item_id, title="X", content="x", category="general"),
            _make_embedding(0.4),
        )
        await store.delete(item_id)
        results = await store.search(_make_embedding(0.4), top_k=10)
        ids = [r[0].id for r in results]
        assert item_id not in ids

    async def test_search_respects_top_k(self, store):
        for i in range(5):
            await store.add(
                KnowledgeItem(
                    id=f"pgv-test-topk-{i}-{uuid.uuid4()}",
                    title=f"t{i}",
                    content=f"c{i}",
                    category="general",
                ),
                _make_embedding(0.5 + i * 0.001),
            )
        results = await store.search(_make_embedding(0.5), top_k=3)
        assert len(results) == 3
