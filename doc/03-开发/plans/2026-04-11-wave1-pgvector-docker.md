# Wave 1 Implementation Plan · pgvector RAG + Docker/Aliyun 部署

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 pgvector + FastEmbed 替换空壳 MilvusVectorStore 和 MD5 哈希 EmbeddingModel，接入 Supabase 生产库；同时为前后端产出可用于阿里云 ACR/ECS 的 Docker 镜像与 compose 编排。

**Architecture:**
- 向量库：Supabase Postgres 启用 `vector` 扩展，建 `knowledge_embeddings` 表（HNSW 索引 + cosine ops，维度 512）
- Embedding：FastEmbed 包 `bge-small-zh-v1.5` ONNX 模型，asyncio.to_thread 封装以保持 async 接口
- 数据访问：`asyncpg` 连接池 + `pgvector.asyncpg.register_vector` 注册 codec
- Backend：Python 3.11-slim 多阶段构建，模型权重预下载到镜像层
- Frontend：node:20-alpine 构建 + nginx:alpine 运行（反代 /api 到 backend:8000）
- 部署：docker-compose 本地验证后推送到阿里云容器镜像服务 (ACR)，ECS 拉取启动

**Tech Stack:**
- Python 依赖：`asyncpg==0.30.0`、`pgvector==0.3.6`、`fastembed==0.4.2`、`numpy==2.1.3`
- Docker：Dockerfile 1.7 语法，`docker compose` v2
- 阿里云：ACR（container registry）+ ECS（elastic compute）+ Supabase（已部署）

**Worktree：** `.worktrees/launch-sprint/`（branch `feat/launch-sprint`）

---

## 文件结构（创建与修改一览）

**新建：**
- `supabase/migrations/20260411_knowledge_embeddings.sql` — pgvector 扩展 + 表 + 索引
- `src/knowledge/pgvector_store.py` — PgVectorStore 类
- `src/knowledge/fastembed_model.py` — FastEmbedModel 类
- `src/knowledge/dependencies.py` — FastAPI 依赖：`get_rag()` 单例
- `scripts/ingest_knowledge.py` — 批量导入现有文档到向量库的 CLI 脚本
- `tests/test_fastembed_model.py` — FastEmbedModel 单测
- `tests/test_pgvector_store.py` — PgVectorStore 集成测试（integration 标记）
- `tests/test_knowledge_rag_pgvector.py` — RAG + PgVector 端到端
- `Dockerfile` — 后端多阶段构建
- `.dockerignore` — 后端构建忽略
- `frontend/Dockerfile` — 前端构建 + nginx
- `frontend/.dockerignore` — 前端构建忽略
- `frontend/nginx.conf` — nginx 配置（反代 + SPA fallback）
- `docker-compose.yml` — 本地/生产编排
- `.env.production.example` — 生产环境变量模板
- `deploy/aliyun-deploy.md` — 阿里云 ACR + ECS 部署手册

**修改：**
- `requirements.txt` — 新增 asyncpg / pgvector / fastembed / numpy
- `src/core/config.py` — 新增 `vector_db_backend`、`embedding_dimension` 配置
- `src/knowledge/rag.py` — 导出 PgVectorStore / FastEmbedModel；`KnowledgeRAG` 根据 backend 选择 store
- `src/knowledge/__init__.py` — 导出新符号
- `src/api/routes/knowledge.py` L81-118 — `/search` 端点改为调用 `KnowledgeRAG.search()`
- `src/agents/knowledge.py` L37-57 — `_build_knowledge_context()` 增加 RAG 检索分支
- `src/main.py` — startup 时初始化 RAG 单例
- `.env.example` — 补充 Supabase + vector backend 环境变量
- `.github/workflows/ci.yml` — 新增 docker-build job

---

## Part A：pgvector RAG 接入（Day 1-3）

### Task A1：添加 Python 依赖

**Files:**
- Modify: `requirements.txt`

- [ ] **Step 1：追加依赖到 requirements.txt**

在 `requirements.txt` 第 7 行 `python-dotenv==1.0.1` 之后、`# Dev / Testing` 之前插入：

```
# Vector search (pgvector + FastEmbed)
asyncpg==0.30.0
pgvector==0.3.6
fastembed==0.4.2
numpy==2.1.3
```

- [ ] **Step 2：在 worktree 中安装验证**

```bash
cd .worktrees/launch-sprint
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -c "import asyncpg, pgvector, fastembed, numpy; print('ok')"
```

Expected: `ok`，无 ImportError

- [ ] **Step 3：Commit**

```bash
git add requirements.txt
git commit -m "chore(backend): add asyncpg/pgvector/fastembed/numpy for RAG" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A2：创建 pgvector migration

**Files:**
- Create: `supabase/migrations/20260411_knowledge_embeddings.sql`

- [ ] **Step 1：写 migration SQL**

```sql
-- 20260411_knowledge_embeddings.sql
-- 启用 pgvector 扩展并建立知识库向量表
-- 维度 512 对应 FastEmbed bge-small-zh-v1.5

create extension if not exists vector;

create table if not exists knowledge_embeddings (
    id           text primary key,
    title        text not null,
    content      text not null,
    category     text not null default 'general',
    tags         text[] default '{}',
    project_id   text,
    department   text,
    metadata     jsonb default '{}'::jsonb,
    embedding    vector(512) not null,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- HNSW 索引：m=16, ef_construction=64 为 pgvector 官方推荐起点
create index if not exists knowledge_embeddings_embedding_idx
    on knowledge_embeddings
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

-- 常用过滤列的 btree 索引
create index if not exists knowledge_embeddings_category_idx
    on knowledge_embeddings (category);

create index if not exists knowledge_embeddings_project_id_idx
    on knowledge_embeddings (project_id)
    where project_id is not null;

-- updated_at 触发器（复用 init_schema.sql 中已定义的 update_updated_at_column 函数）
create trigger knowledge_embeddings_updated_at
    before update on knowledge_embeddings
    for each row execute function update_updated_at_column();
```

- [ ] **Step 2：在本地 Supabase 应用 migration**

```bash
# 先确认本地 Supabase CLI 已连接到项目
supabase migration up
# 或者用 psql 直连验证
psql "$DATABASE_URL" -c "\dx vector"
```

Expected: `vector` 扩展出现在 `\dx` 输出中，`\d knowledge_embeddings` 显示表结构包含 `embedding vector(512)` 列

- [ ] **Step 3：回滚验证（可选但推荐）**

```bash
psql "$DATABASE_URL" -c "drop table knowledge_embeddings;"
psql "$DATABASE_URL" -f supabase/migrations/20260411_knowledge_embeddings.sql
```

Expected: 两次执行都成功（验证 `create ... if not exists` 幂等）

- [ ] **Step 4：Commit**

```bash
git add supabase/migrations/20260411_knowledge_embeddings.sql
git commit -m "feat(db): add pgvector extension and knowledge_embeddings table" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A3：实现 FastEmbedModel（TDD）

**Files:**
- Create: `src/knowledge/fastembed_model.py`
- Create: `tests/test_fastembed_model.py`

- [ ] **Step 1：写失败的测试**

`tests/test_fastembed_model.py`:

```python
"""Tests for FastEmbedModel."""
import pytest

from src.knowledge.fastembed_model import FastEmbedModel


class TestFastEmbedModel:
    """FastEmbedModel 使用 bge-small-zh-v1.5 的 ONNX 模型生成 512 维向量。"""

    @pytest.fixture(scope="class")
    def model(self):
        return FastEmbedModel()

    async def test_dimension_is_512(self, model):
        assert model.dimension == 512

    async def test_model_name_defaults_to_bge_small_zh(self, model):
        assert "bge-small-zh" in model.model_name

    async def test_embed_returns_vector_of_correct_dimension(self, model):
        vec = await model.embed("这是一段中文测试文本")
        assert isinstance(vec, list)
        assert len(vec) == 512
        assert all(isinstance(x, float) for x in vec)

    async def test_embed_is_deterministic(self, model):
        v1 = await model.embed("同一句话")
        v2 = await model.embed("同一句话")
        # 同一输入应产生相同向量
        assert v1 == v2

    async def test_embed_different_texts_produce_different_vectors(self, model):
        v1 = await model.embed("项目管理规范")
        v2 = await model.embed("财务报销流程")
        assert v1 != v2

    async def test_embed_batch_returns_list_of_vectors(self, model):
        texts = ["文本一", "文本二", "文本三"]
        vecs = await model.embed_batch(texts)
        assert len(vecs) == 3
        assert all(len(v) == 512 for v in vecs)
```

- [ ] **Step 2：Run test — expect failure**

```bash
pytest tests/test_fastembed_model.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'src.knowledge.fastembed_model'`

- [ ] **Step 3：实现 FastEmbedModel**

`src/knowledge/fastembed_model.py`:

```python
"""FastEmbed-based embedding model using BAAI/bge-small-zh-v1.5."""

from __future__ import annotations

import asyncio
from typing import Any

from src.knowledge.rag import EmbeddingModel


class FastEmbedModel(EmbeddingModel):
    """Embedding model powered by FastEmbed (ONNX runtime).

    Uses BAAI/bge-small-zh-v1.5 by default (512 dimensions, Chinese-optimized).
    The underlying fastembed.TextEmbedding is synchronous; we wrap calls in
    asyncio.to_thread to stay compatible with the async EmbeddingModel interface.
    """

    DEFAULT_MODEL = "BAAI/bge-small-zh-v1.5"
    DEFAULT_DIMENSION = 512

    def __init__(
        self,
        model_name: str | None = None,
        dimension: int | None = None,
        cache_dir: str | None = None,
    ):
        name = model_name or self.DEFAULT_MODEL
        dim = dimension or self.DEFAULT_DIMENSION
        super().__init__(model_name=name, dimension=dim)
        self._cache_dir = cache_dir
        self._model: Any = None  # lazy-loaded

    def _ensure_model(self) -> None:
        if self._model is None:
            from fastembed import TextEmbedding

            self._model = TextEmbedding(
                model_name=self.model_name,
                cache_dir=self._cache_dir,
            )

    async def embed(self, text: str) -> list[float]:
        """Generate a single embedding vector."""
        def _run() -> list[float]:
            self._ensure_model()
            # fastembed returns a generator of numpy arrays
            vec = next(self._model.embed([text]))
            return vec.tolist()

        return await asyncio.to_thread(_run)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""
        def _run() -> list[list[float]]:
            self._ensure_model()
            return [v.tolist() for v in self._model.embed(texts)]

        return await asyncio.to_thread(_run)
```

- [ ] **Step 4：Run test — expect pass**

```bash
pytest tests/test_fastembed_model.py -v
```

Expected: 6 passed（首次运行会下载 ~130MB 模型，耗时约 30-60s）

- [ ] **Step 5：Commit**

```bash
git add src/knowledge/fastembed_model.py tests/test_fastembed_model.py
git commit -m "feat(knowledge): add FastEmbedModel with bge-small-zh-v1.5 (512d)" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A4：实现 PgVectorStore（TDD，integration 标记）

**Files:**
- Create: `src/knowledge/pgvector_store.py`
- Create: `tests/test_pgvector_store.py`

> **前置条件：** 本任务的测试需要可用的 Postgres + pgvector。测试运行前必须设置 `DATABASE_URL` 环境变量指向已应用 Task A2 migration 的数据库（Supabase 本地实例或生产实例）。测试会用 `pytest -m integration` 标记显式触发。

- [ ] **Step 1：写失败的测试**

`tests/test_pgvector_store.py`:

```python
"""Integration tests for PgVectorStore (requires Postgres + pgvector)."""
import os
import uuid

import pytest

from src.knowledge.pgvector_store import PgVectorStore
from src.knowledge.rag import KnowledgeItem

pytestmark = pytest.mark.integration


@pytest.fixture
async def store():
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        pytest.skip("DATABASE_URL not set")
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
```

- [ ] **Step 2：Run test — expect failure**

```bash
pytest tests/test_pgvector_store.py -v -m integration
```

Expected: FAIL — `ModuleNotFoundError: No module named 'src.knowledge.pgvector_store'`

- [ ] **Step 3：实现 PgVectorStore**

`src/knowledge/pgvector_store.py`:

```python
"""PostgreSQL + pgvector implementation of VectorStore."""

from __future__ import annotations

import json
from typing import Any

import asyncpg
import numpy as np

from src.knowledge.rag import KnowledgeItem, VectorStore


class PgVectorStore(VectorStore):
    """Vector store backed by Postgres with the pgvector extension.

    Uses HNSW index + cosine distance for similarity search.
    Expects the `knowledge_embeddings` table (see migration 20260411).
    """

    def __init__(
        self,
        dsn: str,
        table: str = "knowledge_embeddings",
        dimension: int = 512,
        min_pool_size: int = 1,
        max_pool_size: int = 10,
    ):
        self.dsn = dsn
        self.table = table
        self.dimension = dimension
        self.min_pool_size = min_pool_size
        self.max_pool_size = max_pool_size
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Create connection pool and register pgvector codec."""
        async def _init_conn(conn: asyncpg.Connection) -> None:
            from pgvector.asyncpg import register_vector
            await register_vector(conn)

        self._pool = await asyncpg.create_pool(
            dsn=self.dsn,
            min_size=self.min_pool_size,
            max_size=self.max_pool_size,
            init=_init_conn,
        )

    async def disconnect(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    async def add(self, item: KnowledgeItem, embedding: list[float]) -> None:
        """Upsert a knowledge item with its embedding."""
        if self._pool is None:
            raise RuntimeError("PgVectorStore not connected. Call connect() first.")
        if len(embedding) != self.dimension:
            raise ValueError(
                f"Embedding dimension mismatch: got {len(embedding)}, expected {self.dimension}"
            )

        emb = np.array(embedding, dtype=np.float32)
        sql = f"""
            INSERT INTO {self.table}
                (id, title, content, category, tags, project_id, department, metadata, embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
            ON CONFLICT (id) DO UPDATE SET
                title      = EXCLUDED.title,
                content    = EXCLUDED.content,
                category   = EXCLUDED.category,
                tags       = EXCLUDED.tags,
                project_id = EXCLUDED.project_id,
                department = EXCLUDED.department,
                metadata   = EXCLUDED.metadata,
                embedding  = EXCLUDED.embedding,
                updated_at = now()
        """
        async with self._pool.acquire() as conn:
            await conn.execute(
                sql,
                item.id,
                item.title,
                item.content,
                item.category,
                list(item.tags),
                item.project_id,
                item.department,
                json.dumps(item.metadata or {}),
                emb,
            )

    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[tuple[KnowledgeItem, float]]:
        """Return top_k items by cosine similarity, optionally filtered."""
        if self._pool is None:
            raise RuntimeError("PgVectorStore not connected. Call connect() first.")

        q = np.array(query_embedding, dtype=np.float32)
        where_clauses: list[str] = []
        params: list[Any] = [q, top_k]
        param_idx = 3
        if filters:
            for key in ("category", "project_id", "department"):
                if key in filters and filters[key] is not None:
                    where_clauses.append(f"{key} = ${param_idx}")
                    params.append(filters[key])
                    param_idx += 1

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        sql = f"""
            SELECT id, title, content, category, tags, project_id, department, metadata,
                   1 - (embedding <=> $1) AS similarity
            FROM {self.table}
            {where_sql}
            ORDER BY embedding <=> $1
            LIMIT $2
        """
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)

        results: list[tuple[KnowledgeItem, float]] = []
        for row in rows:
            metadata = row["metadata"]
            if isinstance(metadata, str):
                metadata = json.loads(metadata)
            item = KnowledgeItem(
                id=row["id"],
                title=row["title"],
                content=row["content"],
                category=row["category"],
                tags=list(row["tags"] or []),
                project_id=row["project_id"],
                department=row["department"],
                metadata=metadata or {},
            )
            results.append((item, float(row["similarity"])))
        return results

    async def delete(self, item_id: str) -> None:
        if self._pool is None:
            raise RuntimeError("PgVectorStore not connected. Call connect() first.")
        async with self._pool.acquire() as conn:
            await conn.execute(f"DELETE FROM {self.table} WHERE id = $1", item_id)
```

- [ ] **Step 4：Run test — expect pass**

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
pytest tests/test_pgvector_store.py -v -m integration
```

Expected: 5 passed

- [ ] **Step 5：Commit**

```bash
git add src/knowledge/pgvector_store.py tests/test_pgvector_store.py
git commit -m "feat(knowledge): add PgVectorStore with HNSW cosine search" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A5：KnowledgeRAG backend 选择 + 配置

**Files:**
- Modify: `src/core/config.py`
- Modify: `src/knowledge/rag.py`
- Modify: `src/knowledge/__init__.py`
- Create: `tests/test_knowledge_rag_backend.py`

- [ ] **Step 1：扩展 Settings**

修改 `src/core/config.py`，在 `embedding_model: str = "BAAI/bge-m3"` 行（当前 L27）之后追加：

```python
    embedding_model: str = Field(default="BAAI/bge-small-zh-v1.5", alias="EMBEDDING_MODEL")
    embedding_dimension: int = Field(default=512, alias="EMBEDDING_DIMENSION")
    vector_db_backend: str = Field(default="memory", alias="VECTOR_DB_BACKEND")  # memory | pgvector
```

**同时删除** L27 原有 `embedding_model: str = "BAAI/bge-m3"` 行（被上面替换）。

- [ ] **Step 2：写失败的测试**

`tests/test_knowledge_rag_backend.py`:

```python
"""Tests for KnowledgeRAG backend selection."""
import os
from unittest.mock import patch

import pytest

from src.knowledge.rag import InMemoryVectorStore, KnowledgeRAG, build_rag


class TestBuildRag:
    def test_default_backend_is_memory(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("VECTOR_DB_BACKEND", None)
            rag = build_rag()
            assert isinstance(rag.vector_store, InMemoryVectorStore)

    def test_memory_backend_explicit(self):
        with patch.dict(os.environ, {"VECTOR_DB_BACKEND": "memory"}):
            rag = build_rag()
            assert isinstance(rag.vector_store, InMemoryVectorStore)

    def test_pgvector_backend_uses_pg_store(self):
        from src.knowledge.pgvector_store import PgVectorStore
        with patch.dict(
            os.environ,
            {
                "VECTOR_DB_BACKEND": "pgvector",
                "DATABASE_URL": "postgresql://fake/fake",
            },
        ):
            rag = build_rag()
            assert isinstance(rag.vector_store, PgVectorStore)

    def test_unknown_backend_raises(self):
        with patch.dict(os.environ, {"VECTOR_DB_BACKEND": "weaviate"}):
            with pytest.raises(ValueError, match="Unknown vector DB backend"):
                build_rag()
```

- [ ] **Step 3：Run test — expect failure**

```bash
pytest tests/test_knowledge_rag_backend.py -v
```

Expected: FAIL — `ImportError: cannot import name 'build_rag'`

- [ ] **Step 4：实现 build_rag factory**

在 `src/knowledge/rag.py` 文件末尾（L383 之后）追加：

```python


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def build_rag() -> KnowledgeRAG:
    """Build a KnowledgeRAG instance based on environment config.

    Env vars:
        VECTOR_DB_BACKEND: "memory" (default) | "pgvector"
        DATABASE_URL: required when backend is "pgvector"
        EMBEDDING_MODEL: FastEmbed model name (default BAAI/bge-small-zh-v1.5)
        EMBEDDING_DIMENSION: vector dimension (default 512)
    """
    backend = os.environ.get("VECTOR_DB_BACKEND", "memory").lower()
    dimension = int(os.environ.get("EMBEDDING_DIMENSION", "512"))

    # Pick embedding model
    if backend == "memory":
        embedding_model: EmbeddingModel = EmbeddingModel(dimension=dimension)
    else:
        from src.knowledge.fastembed_model import FastEmbedModel
        embedding_model = FastEmbedModel(dimension=dimension)

    # Pick vector store
    if backend == "memory":
        vector_store: VectorStore = InMemoryVectorStore()
    elif backend == "pgvector":
        from src.db.client import get_db_url
        from src.knowledge.pgvector_store import PgVectorStore
        vector_store = PgVectorStore(dsn=get_db_url(), dimension=dimension)
    else:
        raise ValueError(f"Unknown vector DB backend: {backend!r}")

    return KnowledgeRAG(vector_store=vector_store, embedding_model=embedding_model)
```

- [ ] **Step 5：更新 `src/knowledge/__init__.py`**

在 `src/knowledge/__init__.py` 末尾追加（如果文件不存在，创建之）：

```python
from src.knowledge.rag import (
    EmbeddingModel,
    InMemoryVectorStore,
    KnowledgeItem,
    KnowledgeRAG,
    SearchResult,
    VectorStore,
    build_rag,
)

__all__ = [
    "EmbeddingModel",
    "InMemoryVectorStore",
    "KnowledgeItem",
    "KnowledgeRAG",
    "SearchResult",
    "VectorStore",
    "build_rag",
]
```

- [ ] **Step 6：Run test — expect pass**

```bash
pytest tests/test_knowledge_rag_backend.py -v
```

Expected: 4 passed

- [ ] **Step 7：Commit**

```bash
git add src/core/config.py src/knowledge/rag.py src/knowledge/__init__.py tests/test_knowledge_rag_backend.py
git commit -m "feat(knowledge): add build_rag factory with backend selection" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A6：RAG 单例依赖（FastAPI）

**Files:**
- Create: `src/knowledge/dependencies.py`
- Modify: `src/main.py`
- Create: `tests/test_knowledge_dependencies.py`

- [ ] **Step 1：写失败的测试**

`tests/test_knowledge_dependencies.py`:

```python
"""Tests for knowledge dependency injection."""
from src.knowledge.dependencies import get_rag, reset_rag
from src.knowledge.rag import KnowledgeRAG


class TestGetRag:
    def test_returns_singleton(self):
        reset_rag()
        rag1 = get_rag()
        rag2 = get_rag()
        assert rag1 is rag2
        assert isinstance(rag1, KnowledgeRAG)

    def test_reset_creates_new_instance(self):
        reset_rag()
        rag1 = get_rag()
        reset_rag()
        rag2 = get_rag()
        assert rag1 is not rag2
```

- [ ] **Step 2：Run test — expect failure**

```bash
pytest tests/test_knowledge_dependencies.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'src.knowledge.dependencies'`

- [ ] **Step 3：实现依赖**

`src/knowledge/dependencies.py`:

```python
"""FastAPI dependencies for the knowledge base."""

from __future__ import annotations

from src.knowledge.rag import KnowledgeRAG, build_rag

_rag_instance: KnowledgeRAG | None = None


def get_rag() -> KnowledgeRAG:
    """Return the process-wide KnowledgeRAG singleton.

    The instance is lazily built on first access using build_rag(),
    which reads env vars for backend/embedding configuration.
    """
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = build_rag()
    return _rag_instance


def reset_rag() -> None:
    """Reset the singleton (used by tests)."""
    global _rag_instance
    _rag_instance = None


async def init_rag() -> KnowledgeRAG:
    """Initialize the RAG singleton during app startup.

    Must be called inside an async context so the vector store can connect.
    """
    rag = get_rag()
    await rag.initialize()
    return rag


async def shutdown_rag() -> None:
    """Close the RAG singleton's resources."""
    global _rag_instance
    if _rag_instance is not None:
        await _rag_instance.close()
        _rag_instance = None
```

- [ ] **Step 4：Run test — expect pass**

```bash
pytest tests/test_knowledge_dependencies.py -v
```

Expected: 2 passed

- [ ] **Step 5：在 main.py 的 startup/shutdown 中接入**

在 `src/main.py` 中找到 `@app.on_event("startup")` 定义的 startup 函数（大约 L110-165），在函数末尾追加：

```python
    # Initialize RAG singleton (pgvector or memory based on VECTOR_DB_BACKEND)
    from src.knowledge.dependencies import init_rag
    try:
        await init_rag()
    except Exception as exc:  # pragma: no cover
        import logging
        logging.getLogger(__name__).warning("RAG init failed: %s", exc)
```

然后在文件中追加 shutdown handler（如果已有 on_event shutdown，追加到其中；如果没有，新建）：

```python
@app.on_event("shutdown")
async def _shutdown_rag() -> None:
    from src.knowledge.dependencies import shutdown_rag
    await shutdown_rag()
```

- [ ] **Step 6：冒烟测试（启动不崩）**

```bash
VECTOR_DB_BACKEND=memory uvicorn src.main:app --port 8001 &
sleep 3
curl -f http://localhost:8001/health
kill %1
```

Expected: `/health` 返回 200，无报错退出

- [ ] **Step 7：Commit**

```bash
git add src/knowledge/dependencies.py src/main.py tests/test_knowledge_dependencies.py
git commit -m "feat(knowledge): add get_rag() singleton and app lifecycle hooks" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A7：改造 /api/knowledge/search 调用 RAG

**Files:**
- Modify: `src/api/routes/knowledge.py`
- Modify: `tests/test_api_knowledge.py`

- [ ] **Step 1：在 test_api_knowledge.py 中新增测试**

在 `tests/test_api_knowledge.py` 文件末尾追加：

```python


class TestSemanticSearch:
    """POST /api/knowledge/search should use RAG when available."""

    def test_search_calls_rag(self, client, monkeypatch):
        """When RAG returns results, endpoint should return them."""
        from src.knowledge.rag import KnowledgeItem, SearchResult
        from src.knowledge import dependencies

        # Build a fake RAG
        class FakeRag:
            async def search(self, query, top_k=5, category=None, project_id=None):
                return [
                    SearchResult(
                        item=KnowledgeItem(
                            id="k-1",
                            title="测试文档",
                            content="测试内容",
                            category="process",
                        ),
                        score=0.87,
                        highlight="**测试**内容",
                    )
                ]

        monkeypatch.setattr(dependencies, "_rag_instance", FakeRag())

        resp = client.post(
            "/api/knowledge/search",
            json={"query": "测试", "top_k": 5},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["id"] == "k-1"
        assert body[0]["title"] == "测试文档"
        assert 0.8 <= body[0]["score"] <= 1.0
```

- [ ] **Step 2：Run — expect failure**

```bash
pytest tests/test_api_knowledge.py::TestSemanticSearch -v
```

Expected: FAIL（端点仍走关键字分支，或字段不匹配）

- [ ] **Step 3：改造 search 端点**

替换 `src/api/routes/knowledge.py` L81-118 整个 `search_knowledge` 函数为：

```python
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
```

**注意**：保留 `SearchRequest` / `SearchResultItem` 的 Pydantic 定义不变（L23-36）。

- [ ] **Step 4：Run — expect pass**

```bash
pytest tests/test_api_knowledge.py -v
```

Expected: 所有原 TestKnowledgeAPI + 新 TestSemanticSearch 全部 passed

- [ ] **Step 5：Commit**

```bash
git add src/api/routes/knowledge.py tests/test_api_knowledge.py
git commit -m "feat(api): switch knowledge search to RAG semantic retrieval" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A8：KnowledgeAgent 调用 RAG

**Files:**
- Modify: `src/agents/knowledge.py`
- Create: `tests/test_knowledge_agent_rag.py`

- [ ] **Step 1：写失败的测试**

`tests/test_knowledge_agent_rag.py`:

```python
"""Test KnowledgeAgent uses RAG to build context."""
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.agents.knowledge import KnowledgeAgent
from src.core.models import AgentRequest, AgentType
from src.knowledge import dependencies
from src.knowledge.rag import KnowledgeItem, SearchResult


class FakeRag:
    def __init__(self, results):
        self._results = results

    async def search(self, query, top_k=5, category=None, project_id=None):
        return self._results

    async def get_context_for_llm(self, query, top_k=3):
        if not self._results:
            return "未找到相关知识。"
        lines = [f"【{r.item.title}】{r.item.content[:100]}" for r in self._results]
        return "\n".join(lines)


async def test_knowledge_agent_injects_rag_context(monkeypatch):
    results = [
        SearchResult(
            item=KnowledgeItem(
                id="k-1",
                title="项目管理规范",
                content="本规范定义了立项流程。",
                category="process",
            ),
            score=0.9,
        )
    ]
    monkeypatch.setattr(dependencies, "_rag_instance", FakeRag(results))

    agent = KnowledgeAgent()
    agent.llm_client = AsyncMock()
    agent.llm_client.chat_json = AsyncMock(return_value={"reply": "已查到", "cards": []})
    agent.llm_client.chat = AsyncMock(return_value="已查到")

    req = AgentRequest(
        session_id=uuid4(),
        agent_type=AgentType.KNOWLEDGE,
        user_message="立项流程是什么？",
    )
    resp = await agent.handle(req)

    # Verify the LLM was called with a message containing RAG context
    called_messages = agent.llm_client.chat_json.call_args[0][0]
    combined = "\n".join(m.get("content", "") for m in called_messages)
    assert "项目管理规范" in combined
    assert "立项流程" in combined
    assert resp.content == "已查到"
```

- [ ] **Step 2：Run — expect failure**

```bash
pytest tests/test_knowledge_agent_rag.py -v
```

Expected: FAIL — agent 目前使用 `list_documents()` 而非 RAG

- [ ] **Step 3：改造 KnowledgeAgent**

替换 `src/agents/knowledge.py` 整个 `KnowledgeAgent` 类为：

```python
"""知识Agent — experience retrieval, case recommendations, knowledge base search."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.knowledge.dependencies import get_rag
from src.llm.prompts import KNOWLEDGE_SYSTEM_PROMPT


class KnowledgeAgent(BaseAgent):
    agent_type = AgentType.KNOWLEDGE
    system_prompt = KNOWLEDGE_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = await self._build_knowledge_context(request.user_message)
        messages = self._build_messages(request)
        messages.insert(
            1,
            {"role": "system", "content": f"以下是 RAG 检索到的相关知识：\n\n{context}"},
        )

        try:
            result = await self.llm_client.chat_json(messages, max_tokens=2048)
            content = result.get("reply", "")
            cards = self._parse_cards(result.get("cards", []))
        except Exception:
            content = await self.llm_client.chat(messages)
            cards = []

        response = self._base_response(request, content)
        response.cards = cards
        return response

    async def abuild_stream_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Async variant used when RAG context must be awaited before streaming.

        The sync `build_stream_messages()` in BaseAgent remains unchanged for
        compatibility; chat streaming routes should prefer this async variant
        when available (see src/api/routes/chat.py).
        """
        messages = super().build_stream_messages(request)
        context = await self._build_knowledge_context(request.user_message)
        messages.insert(
            1,
            {"role": "system", "content": f"以下是 RAG 检索到的相关知识：\n\n{context}"},
        )
        return messages

    async def _build_knowledge_context(self, query: str) -> str:
        """Use RAG to retrieve top-k relevant chunks for the query."""
        rag = get_rag()
        return await rag.get_context_for_llm(query, top_k=3)
```

**注意**：`BaseAgent.build_stream_messages` 已验证为 **sync** 签名（`src/agents/base.py:44`），且被 8 个子类继承。为避免破坏兼容性：
- **不修改** `BaseAgent.build_stream_messages` 签名
- **保留** `KnowledgeAgent.build_stream_messages` sync 版本（从基类继承默认实现即可，本次替换中已删除覆写）
- **新增** `abuild_stream_messages()` async 方法作为流式路由的首选入口
- 更新 `src/api/routes/chat.py` 流式分支调用前先检测：

```python
# 在 stream 路由中，agent 实例拿到后：
if hasattr(agent, "abuild_stream_messages"):
    messages = await agent.abuild_stream_messages(req)
else:
    messages = agent.build_stream_messages(req)
```

**定位 chat 流式调用点：**
```bash
grep -n "build_stream_messages" src/api/routes/chat.py
```
若该路由不存在或未使用 build_stream_messages（例如流式直接复用 `handle()`），本步骤跳过 chat.py 修改，流式路径由 Wave 2 工作流 D 统一处理。

- [ ] **Step 4：Run — expect pass**

```bash
pytest tests/test_knowledge_agent_rag.py -v
```

Expected: passed

- [ ] **Step 5：Commit**

```bash
git add src/agents/knowledge.py tests/test_knowledge_agent_rag.py
# 如修改了 base.py 或 chat.py 路由，一并添加
git commit -m "feat(agents): KnowledgeAgent uses RAG for context retrieval" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A9：批量导入脚本

**Files:**
- Create: `scripts/ingest_knowledge.py`
- Create: `tests/test_ingest_knowledge.py`

- [ ] **Step 1：写测试（mock RAG）**

`tests/test_ingest_knowledge.py`:

```python
"""Test knowledge ingestion script."""
from unittest.mock import AsyncMock, MagicMock

import pytest

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
```

- [ ] **Step 2：Run — expect failure**

```bash
pytest tests/test_ingest_knowledge.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3：实现脚本**

`scripts/ingest_knowledge.py`:

```python
"""Batch-ingest existing documents into the knowledge RAG vector store.

Usage:
    python -m scripts.ingest_knowledge

Reads all documents from src.stores.document_store.list_documents() and
populates them into the configured KnowledgeRAG backend.
"""

from __future__ import annotations

import asyncio
import sys
from typing import Iterable

from src.knowledge.rag import KnowledgeItem, KnowledgeRAG, build_rag


async def ingest_documents(rag: KnowledgeRAG, docs: Iterable) -> int:
    """Ingest a list of documents into the RAG.

    Args:
        rag: Initialized KnowledgeRAG instance.
        docs: Iterable of document-like objects (expecting
              id/title/content_summary/doc_type/project_id/author attrs).

    Returns:
        Number of successfully ingested items.
    """
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
```

- [ ] **Step 4：Run — expect pass**

```bash
pytest tests/test_ingest_knowledge.py -v
```

Expected: 2 passed

- [ ] **Step 5：Commit**

```bash
git add scripts/ingest_knowledge.py tests/test_ingest_knowledge.py
git commit -m "feat(scripts): add ingest_knowledge CLI for batch RAG population" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task A10：端到端集成测试

**Files:**
- Create: `tests/test_knowledge_rag_pgvector.py`

- [ ] **Step 1：写测试**

`tests/test_knowledge_rag_pgvector.py`:

```python
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
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        pytest.skip("DATABASE_URL not set")
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
```

- [ ] **Step 2：Run — expect pass**

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
pytest tests/test_knowledge_rag_pgvector.py -v -m integration
```

Expected: 2 passed（首次运行会下载 FastEmbed 模型）

- [ ] **Step 3：Commit**

```bash
git add tests/test_knowledge_rag_pgvector.py
git commit -m "test(knowledge): e2e integration test for RAG + pgvector + FastEmbed" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Part B：Docker + 阿里云部署（Day 4-5）

### Task B1：.dockerignore

**Files:**
- Create: `.dockerignore`
- Create: `frontend/.dockerignore`

- [ ] **Step 1：写后端 .dockerignore**

`.dockerignore`:

```
# VCS
.git
.gitignore
.github

# Worktrees
.worktrees

# Python
__pycache__
*.pyc
*.pyo
*.pyd
.pytest_cache
.ruff_cache
.coverage
htmlcov
.venv
venv
env

# Node / frontend (built separately)
node_modules
frontend/node_modules
frontend/dist
frontend/.vite

# Docs & test artifacts
doc
tests
*.md
!README.md

# IDE / OS
.vscode
.idea
.DS_Store
*.swp

# Secrets
.env
.env.*
!.env.example
!.env.production.example

# Ralph / Claude
.ralph
.claude

# Supabase local state
supabase/.branches
supabase/.temp
```

- [ ] **Step 2：写前端 .dockerignore**

`frontend/.dockerignore`:

```
node_modules
dist
.vite
coverage
.env
.env.*
!.env.example
*.log
.DS_Store
```

- [ ] **Step 3：Commit**

```bash
git add .dockerignore frontend/.dockerignore
git commit -m "chore(infra): add .dockerignore for backend and frontend" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B2：后端 Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1：写 Dockerfile**

`Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1.7
# Backend multi-stage build for GC_TeamWork FastAPI app.
# Stage 1: install deps + preload FastEmbed model.
# Stage 2: slim runtime.

FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --prefix=/install --no-warn-script-location -r requirements.txt

# Preload FastEmbed model into builder layer (cached)
ENV FASTEMBED_CACHE=/opt/fastembed_cache
RUN PYTHONPATH=/install/lib/python3.11/site-packages \
    python -c "from fastembed import TextEmbedding; \
               TextEmbedding(model_name='BAAI/bge-small-zh-v1.5', cache_dir='${FASTEMBED_CACHE}')"

# ---------- Runtime stage ----------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    FASTEMBED_CACHE=/opt/fastembed_cache \
    VECTOR_DB_BACKEND=pgvector

RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
        libpq5 \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

WORKDIR /app

# Copy Python deps + FastEmbed cache from builder
COPY --from=builder /install /usr/local
COPY --from=builder /opt/fastembed_cache /opt/fastembed_cache

# Copy source
COPY --chown=app:app src/ ./src/
COPY --chown=app:app supabase/ ./supabase/
COPY --chown=app:app scripts/ ./scripts/

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

- [ ] **Step 2：构建验证**

```bash
cd .worktrees/launch-sprint
DOCKER_BUILDKIT=1 docker build -t gc-teamwork-backend:wave1 .
docker images gc-teamwork-backend:wave1
```

Expected: 构建成功；镜像大小 < 1.5GB（含 FastEmbed 模型 ~130MB + numpy/asyncpg 等）。如超出 1.5GB，检查是否意外拷贝了 tests/doc。

- [ ] **Step 3：本地运行冒烟**

```bash
docker run --rm -d --name gc-be-test \
    -e VECTOR_DB_BACKEND=memory \
    -e LLM_API_KEY=dummy \
    -p 8888:8000 \
    gc-teamwork-backend:wave1
sleep 5
curl -f http://localhost:8888/health && echo OK
docker logs gc-be-test | tail -20
docker stop gc-be-test
```

Expected: `/health` 返回 200；logs 显示 FastAPI 启动成功；**无 FastEmbed 下载日志**（说明已走缓存）

- [ ] **Step 4：Commit**

```bash
git add Dockerfile
git commit -m "feat(infra): multi-stage Dockerfile with preloaded FastEmbed model" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B3：前端 Dockerfile + nginx

**Files:**
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

- [ ] **Step 1：写 nginx.conf**

`frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml
               application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1024;

    # Long cache for hashed assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API reverse proxy to backend service
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # SSE / streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Health check endpoint (used by ECS SLB)
    location = /healthz {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2：写前端 Dockerfile**

`frontend/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1.7
# Frontend: node 20 build → nginx serve
# Build context is repo root (to allow `COPY frontend/ ...`)

FROM node:20-alpine AS builder

WORKDIR /app

# Leverage layer cache: install deps first
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./

# Type check + production build
RUN npm run build

# ---------- Runtime ----------
FROM nginx:alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3：构建验证**

```bash
DOCKER_BUILDKIT=1 docker build -t gc-teamwork-frontend:wave1 -f frontend/Dockerfile .
docker images gc-teamwork-frontend:wave1
```

Expected: 构建成功；镜像大小 < 80MB

- [ ] **Step 4：本地运行冒烟**

```bash
docker run --rm -d --name gc-fe-test -p 9000:80 gc-teamwork-frontend:wave1
sleep 2
curl -f http://localhost:9000/healthz
curl -sI http://localhost:9000/ | head -1  # expect: HTTP/1.1 200 OK
docker stop gc-fe-test
```

Expected: `/healthz` 返回 `ok`；`/` 返回 200 HTML

- [ ] **Step 5：Commit**

```bash
git add frontend/Dockerfile frontend/nginx.conf
git commit -m "feat(infra): add frontend Dockerfile and nginx reverse proxy" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B4：docker-compose.yml

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.production.example`

- [ ] **Step 1：写 .env.production.example**

`.env.production.example`:

```bash
# Production environment template.
# Copy to .env.production and fill in real values before `docker compose up`.

# ---- App ----
DEBUG=false

# ---- LLM (DeepSeek) ----
LLM_API_KEY=sk-xxx
LLM_API_BASE=https://api.deepseek.com
LLM_MODEL=deepseek-chat

# ---- Supabase (production project) ----
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# ---- Vector search ----
VECTOR_DB_BACKEND=pgvector
EMBEDDING_MODEL=BAAI/bge-small-zh-v1.5
EMBEDDING_DIMENSION=512

# ---- Observability (filled in Wave 2) ----
# SENTRY_DSN=
# LOG_LEVEL=info
```

- [ ] **Step 2：写 docker-compose.yml**

`docker-compose.yml`:

```yaml
# Local / production docker-compose for GC_TeamWork.
# Usage:
#   cp .env.production.example .env.production
#   vim .env.production   # fill in secrets
#   docker compose --env-file .env.production up -d

name: gc-teamwork

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    image: gc-teamwork-backend:latest
    container_name: gc-backend
    restart: unless-stopped
    environment:
      DEBUG: ${DEBUG:-false}
      LLM_API_KEY: ${LLM_API_KEY}
      LLM_API_BASE: ${LLM_API_BASE:-https://api.deepseek.com}
      LLM_MODEL: ${LLM_MODEL:-deepseek-chat}
      USE_SUPABASE: ${USE_SUPABASE:-true}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      DATABASE_URL: ${DATABASE_URL}
      VECTOR_DB_BACKEND: ${VECTOR_DB_BACKEND:-pgvector}
      EMBEDDING_MODEL: ${EMBEDDING_MODEL:-BAAI/bge-small-zh-v1.5}
      EMBEDDING_DIMENSION: ${EMBEDDING_DIMENSION:-512}
    expose:
      - "8000"
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - gc-net

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    image: gc-teamwork-frontend:latest
    container_name: gc-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - gc-net

networks:
  gc-net:
    driver: bridge
```

- [ ] **Step 3：本地 compose 冒烟**

```bash
# Use a test env file with mock values for the smoke test
cat > .env.smoke <<EOF
DEBUG=true
LLM_API_KEY=dummy
VECTOR_DB_BACKEND=memory
USE_SUPABASE=false
EOF

docker compose --env-file .env.smoke up -d --build
sleep 15
curl -fsS http://localhost:8000/health && echo "backend OK"
curl -fsS http://localhost/healthz && echo "frontend OK"
curl -fsS http://localhost/api/health && echo "proxy OK"
docker compose down
rm .env.smoke
```

Expected: 三个 curl 都成功；`docker compose ps` 两个服务都 `healthy`

- [ ] **Step 4：Commit**

```bash
git add docker-compose.yml .env.production.example
git commit -m "feat(infra): add docker-compose for backend+frontend orchestration" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B5：更新 .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1：重写 .env.example**

替换 `.env.example` 全部内容为：

```bash
# AI-native project collaboration platform — environment configuration example
# Copy to .env and fill in real values for local development.

# ---- App ----
DEBUG=true

# ---- LLM (DeepSeek, OpenAI-compatible) ----
LLM_API_KEY=your_deepseek_api_key
LLM_API_BASE=https://api.deepseek.com
LLM_MODEL=deepseek-chat

# ---- Vector search (pgvector via Supabase / FastEmbed) ----
VECTOR_DB_BACKEND=memory      # memory | pgvector
EMBEDDING_MODEL=BAAI/bge-small-zh-v1.5
EMBEDDING_DIMENSION=512

# ---- Supabase (set USE_SUPABASE=true to enable) ----
USE_SUPABASE=false
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

- [ ] **Step 2：Commit**

```bash
git add .env.example
git commit -m "docs(infra): expand .env.example with Supabase and vector backend vars" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B6：阿里云部署文档

**Files:**
- Create: `deploy/aliyun-deploy.md`

- [ ] **Step 1：写部署手册**

`deploy/aliyun-deploy.md`:

````markdown
# 阿里云部署手册（GC_TeamWork Wave 1）

## 架构

```
用户 → 阿里云 SLB (负载均衡)
        ├─ :80  → frontend (nginx)  →  backend:8000 (uvicorn)
        └─ :443 → frontend (nginx, 域名证书)
                         │
                         └─→ Supabase（外部，RAG 数据 via pgvector）
                         └─→ DeepSeek API（外部）
```

## 前置条件

- 阿里云账号 + 已开通 **容器镜像服务 ACR**（企业版或个人版）
- **ECS 实例**：规格建议 ecs.c7.large 或以上（2 vCPU / 4GB RAM），Ubuntu 22.04
- 已部署的 **Supabase 项目**（或自托管 Postgres 15 + pgvector）
- **DeepSeek API Key**
- 本地已安装 docker + aliyun-cli

## Step 1：ACR 仓库准备

在阿里云控制台创建命名空间和仓库：

- 命名空间：`gc-teamwork`
- 仓库：`gc-teamwork/backend`、`gc-teamwork/frontend`
- 地域：推荐 `cn-hangzhou`（与后续 ECS 同地域以走内网）

获取登录凭证后本地登录：

```bash
docker login --username=<阿里云账号> registry.cn-hangzhou.aliyuncs.com
```

## Step 2：构建并推送镜像

在 worktree 根目录执行：

```bash
REGISTRY=registry.cn-hangzhou.aliyuncs.com/gc-teamwork
TAG=$(git rev-parse --short HEAD)

# Backend
docker build -t $REGISTRY/backend:$TAG -t $REGISTRY/backend:latest .
docker push $REGISTRY/backend:$TAG
docker push $REGISTRY/backend:latest

# Frontend
docker build -t $REGISTRY/frontend:$TAG -t $REGISTRY/frontend:latest -f frontend/Dockerfile .
docker push $REGISTRY/frontend:$TAG
docker push $REGISTRY/frontend:latest
```

## Step 3：ECS 首次准备

SSH 进入 ECS 后：

```bash
# 安装 docker + compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt-get install -y docker-compose-plugin

# 拉取阿里云内网镜像地址（省流量费）
docker login --username=<阿里云账号> registry-vpc.cn-hangzhou.aliyuncs.com

# 创建工作目录
mkdir -p ~/gc-teamwork && cd ~/gc-teamwork
```

## Step 4：生产 compose 文件

在 ECS `~/gc-teamwork/docker-compose.yml`：

```yaml
name: gc-teamwork

services:
  backend:
    image: registry-vpc.cn-hangzhou.aliyuncs.com/gc-teamwork/backend:latest
    container_name: gc-backend
    restart: unless-stopped
    env_file: .env.production
    expose:
      - "8000"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    networks:
      - gc-net

  frontend:
    image: registry-vpc.cn-hangzhou.aliyuncs.com/gc-teamwork/frontend:latest
    container_name: gc-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - gc-net

networks:
  gc-net:
    driver: bridge
```

## Step 5：配置 .env.production

复制 `.env.production.example` 到 ECS 的 `~/gc-teamwork/.env.production` 并填入真实值（DeepSeek key、Supabase URL/key、DATABASE_URL 等）。

**权限锁定：**

```bash
chmod 600 .env.production
```

## Step 6：首次启动与 migration

```bash
# 拉镜像
docker compose pull

# 启动
docker compose --env-file .env.production up -d

# 等待健康检查
docker compose ps

# 在 Supabase 生产数据库上执行 Wave 1 migration
psql "$DATABASE_URL" -f /path/to/supabase/migrations/20260411_knowledge_embeddings.sql

# 批量导入现有知识（可选，一次性）
docker compose exec backend python -m scripts.ingest_knowledge
```

## Step 7：安全组与 SLB

- **ECS 安全组**：仅放行 80/443（来自 SLB）与 22（来自跳板机）
- **SLB 监听**：HTTP 80 转发到 ECS 80，HTTPS 443 需上传证书或用阿里云托管证书
- **Supabase 白名单**：将 ECS 公网 IP 加入 Supabase 项目的 IP allowlist

## Step 8：验证

```bash
# 从外网
curl -fsS http://<ECS-公网IP>/healthz
curl -fsS http://<ECS-公网IP>/api/health

# 检查 RAG
curl -X POST http://<ECS-公网IP>/api/knowledge/search \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"query":"项目立项","top_k":3}'
```

## Step 9：滚动更新

```bash
# 本地 push 新镜像
docker build -t $REGISTRY/backend:$NEW_TAG .
docker push $REGISTRY/backend:$NEW_TAG

# ECS 上
docker compose pull
docker compose up -d  # 只重启有变化的服务
```

## 回滚

```bash
# 在 compose 中改为具体 tag（不用 latest）
sed -i "s|backend:latest|backend:$OLD_TAG|" docker-compose.yml
docker compose up -d
```

## 监控检查清单（Wave 2 对接前）

- [ ] ECS 监控：CPU < 80%、内存 < 80%、磁盘 < 70%
- [ ] 容器健康：`docker compose ps` 全部 `healthy`
- [ ] 日志轮转：`/var/lib/docker/containers/*/` 定期清理
- [ ] 备份：Supabase 自动快照已开启

## 故障排查

- **镜像拉取慢/失败**：确认使用 `registry-vpc.*` 内网地址且 ECS 在同地域
- **backend 启动失败**：`docker compose logs backend | tail -50`，常见原因：`DATABASE_URL` 错误或 Supabase IP 未白名单
- **FastEmbed 模型加载慢**：预期启动耗时 10-30s；若超过 60s 检查磁盘 I/O
- **pgvector 查询报错 `extension vector does not exist`**：检查 Supabase 数据库是否执行了 Wave 1 migration
````

- [ ] **Step 2：Commit**

```bash
mkdir -p deploy
git add deploy/aliyun-deploy.md
git commit -m "docs(infra): add Aliyun ACR+ECS deployment handbook" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B7：CI 新增 docker-build job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1：追加 docker-build job**

在 `.github/workflows/ci.yml` 末尾（最后一个 job 之后）追加：

```yaml

  docker-build:
    name: Docker build smoke test
    needs: [frontend, backend]  # 调整为实际的 job 名
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build backend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: false
          tags: gc-teamwork-backend:ci
          cache-from: type=gha,scope=backend
          cache-to: type=gha,mode=max,scope=backend

      - name: Build frontend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./frontend/Dockerfile
          push: false
          tags: gc-teamwork-frontend:ci
          cache-from: type=gha,scope=frontend
          cache-to: type=gha,mode=max,scope=frontend

      - name: Smoke test compose
        run: |
          cat > .env.ci <<EOF
          DEBUG=true
          LLM_API_KEY=dummy
          VECTOR_DB_BACKEND=memory
          USE_SUPABASE=false
          EOF
          docker compose --env-file .env.ci up -d
          sleep 20
          curl -fsS http://localhost:8000/health
          curl -fsS http://localhost/healthz
          docker compose down
```

**注意**：`needs: [frontend, backend]` 的 job 名必须与现有 ci.yml 中的实际 job id 一致。执行前用 `grep -n "^  [a-z].*:" .github/workflows/ci.yml` 确认。

- [ ] **Step 2：本地语法校验（可选）**

```bash
# 如已安装 act
act -n -j docker-build || echo "act 未装，跳过"
```

- [ ] **Step 3：Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add docker build + compose smoke test job" -m "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task B8：Wave 1 总验收与 PR

**Files:**
- Update: `doc/03-开发/plans/progress.md`

- [ ] **Step 1：创建/更新 progress.md**

`doc/03-开发/plans/progress.md`:

```markdown
# Launch Sprint Progress

## Wave 1 · pgvector + Docker（2026-04-11 ~ 2026-04-15）

| Task | 状态 | 备注 |
|---|---|---|
| A1 依赖 | ✅ | asyncpg/pgvector/fastembed/numpy 已装 |
| A2 migration | ✅ | pgvector 扩展与 knowledge_embeddings 表已上 |
| A3 FastEmbedModel | ✅ | 6 单测通过 |
| A4 PgVectorStore | ✅ | 5 集成测试通过（integration 标记） |
| A5 build_rag factory | ✅ | 4 单测通过 |
| A6 get_rag() 依赖 | ✅ | 2 单测通过，main.py 已接 |
| A7 /api/search RAG | ✅ | 原有+新增测试通过 |
| A8 KnowledgeAgent RAG | ✅ | agent 测试通过 |
| A9 ingest 脚本 | ✅ | 2 单测通过 |
| A10 E2E 集成 | ✅ | 2 integration 测试通过 |
| B1 .dockerignore | ✅ | - |
| B2 后端 Dockerfile | ✅ | 镜像 < 1.5GB，冒烟通过 |
| B3 前端 Dockerfile | ✅ | 镜像 < 80MB，冒烟通过 |
| B4 docker-compose | ✅ | 本地 compose 冒烟通过 |
| B5 .env.example | ✅ | - |
| B6 阿里云手册 | ✅ | deploy/aliyun-deploy.md |
| B7 CI docker job | ✅ | GH Actions 绿 |
| B8 PR 合并 | ⏳ | 本 task |

## 验收结果

- [ ] `pytest tests/ -v` 全绿（含新增）
- [ ] `pytest tests/ -v -m integration`（需 DATABASE_URL）全绿
- [ ] `docker compose up` 本地冒烟通过
- [ ] Supabase 生产库 migration 已执行
- [ ] 知识库 semantic search 返回相关度 > 0.5 的结果
```

- [ ] **Step 2：运行完整测试套件**

```bash
cd .worktrees/launch-sprint

# 单测
pytest tests/ -v

# 集成测试
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
pytest tests/ -v -m integration

# Docker 冒烟
DOCKER_BUILDKIT=1 docker compose --env-file .env.smoke up -d --build
sleep 20
curl -fsS http://localhost:8000/health
curl -fsS http://localhost/healthz
docker compose down
```

Expected: 全部通过

- [ ] **Step 3：调用 code-reviewer skill**

```
使用 superpowers:requesting-code-review skill 对本 worktree 的改动做独立 review
```

对 reviewer 反馈做出处理（修复或记录理由）。

- [ ] **Step 4：创建 PR**

```bash
git push -u origin feat/launch-sprint

gh pr create --title "feat: Wave 1 — pgvector RAG + Docker/Aliyun deployment" --body "$(cat <<'EOF'
## Summary

Wave 1 of the 2-week launch sprint. Closes the two P0 launch blockers:
- Replaces empty MilvusVectorStore stub and MD5-hash EmbeddingModel with
  production-grade PgVectorStore (Supabase pgvector) + FastEmbedModel
  (bge-small-zh-v1.5, 512d).
- Adds containerization (Dockerfile + frontend/Dockerfile + compose) and
  Aliyun ACR/ECS deployment handbook.

## Changes

### RAG (Part A)
- `supabase/migrations/20260411_knowledge_embeddings.sql` — pgvector + HNSW
- `src/knowledge/fastembed_model.py` — async wrapper around FastEmbed ONNX
- `src/knowledge/pgvector_store.py` — asyncpg + pgvector cosine search
- `src/knowledge/dependencies.py` — `get_rag()` singleton
- `src/knowledge/rag.py` — `build_rag()` factory with backend selection
- `src/api/routes/knowledge.py` — `/search` now calls RAG
- `src/agents/knowledge.py` — injects RAG context into LLM messages
- `scripts/ingest_knowledge.py` — batch ingestion CLI

### Infra (Part B)
- `Dockerfile` — multi-stage Python 3.11-slim, FastEmbed model preloaded
- `frontend/Dockerfile` — node 20 builder → nginx:alpine runtime
- `frontend/nginx.conf` — SPA + `/api` reverse proxy + `/healthz`
- `docker-compose.yml` — backend+frontend orchestration
- `.env.production.example` — production env template
- `deploy/aliyun-deploy.md` — ACR+ECS deployment handbook
- `.github/workflows/ci.yml` — docker build + compose smoke test

## Test plan
- [x] `pytest tests/ -v` — all passing (unit)
- [x] `pytest tests/ -v -m integration` — 7 integration tests passing against local Supabase
- [x] `docker build .` + frontend build — images under size targets
- [x] `docker compose up` — local smoke: /health, /healthz, /api/health all 200
- [ ] Aliyun ACR push + ECS pull smoke (to be done on Day 5 during merge)
- [ ] Supabase production migration applied (coordinated with ops)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5：等待 CI 绿 + 合并**

CI 全绿后执行 `gh pr merge --squash --delete-branch=false`（保留分支供 Wave 2 参考）。

- [ ] **Step 6：更新 progress.md 的 B8 为 ✅，commit 到 master**

---

## 与 Master Plan 的对照（Wave 1 覆盖度自检）

| Master Plan Wave 1 工作流 | 本计划 Task | 状态 |
|---|---|---|
| 添加 asyncpg / pgvector / fastembed 依赖 | A1 | ✅ |
| Supabase migration: 扩展 + 表 | A2 | ✅ |
| `PgVectorStore(VectorStore)` | A4 | ✅ |
| `FastEmbedModel(EmbeddingModel)` | A3 | ✅ |
| `KnowledgeRAG.initialize()` 选 backend | A5 | ✅（`build_rag()` 工厂） |
| `get_rag()` FastAPI 依赖 | A6 | ✅ |
| `/api/knowledge/search` 调 RAG | A7 | ✅ |
| `KnowledgeAgent` 调 RAG | A8 | ✅ |
| `scripts/ingest_knowledge.py` | A9 | ✅ |
| 端到端集成测试 | A10 | ✅ |
| 根 Dockerfile 多阶段 | B2 | ✅ |
| `frontend/Dockerfile` + nginx | B3 | ✅ |
| `.dockerignore` × 2 | B1 | ✅ |
| `docker-compose.yml` | B4 | ✅ |
| `.env.production.example` | B4 + B5 | ✅ |
| `deploy/aliyun-deploy.md` | B6 | ✅ |
| CI docker-build job | B7 | ✅ |

**全部覆盖。**

---

## 风险与联动

- **Task A8 中 `build_stream_messages` 可能需要 async 签名变更**：如遇阻塞，降级方案是在 `handle()` 中直接构建 RAG 上下文并跳过 stream 优化（Wave 2 工作流 D 会全面处理 streaming，可届时回补）
- **Task A4/A10 integration 测试依赖真实 Postgres + pgvector**：CI 中默认跳过（`addopts = -m "not integration"`），开发者本地或 staging 跑
- **Task B2 镜像体积**：若 FastEmbed 模型 + numpy 导致镜像超 1.5GB，考虑将模型放到 volume 而非镜像层（取舍：首启速度 vs 镜像大小）
- **Supabase 直连 DATABASE_URL**：Supabase 默认 5432 端口需使用连接串中的完整凭证，若使用 connection pooler 走 6543 端口请同步更新部署手册 Step 5

---

## 下一步（Wave 1 完成后）

1. Wave 1 PR 合并到 master
2. 主会话根据 Wave 1 实际代码状态产出 Wave 2 详细计划（`2026-04-16-wave2-observability-streaming-e2e.md`）
3. 三个 subagent 并行启动 Wave 2
