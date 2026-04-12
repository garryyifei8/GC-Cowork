"""PostgreSQL + pgvector implementation of VectorStore."""

from __future__ import annotations

import json
import re
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
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.]*", table):
            raise ValueError(f"Unsafe table name: {table!r}")
        self.dsn = dsn
        self.table = table
        self.dimension = dimension
        self.min_pool_size = min_pool_size
        self.max_pool_size = max_pool_size
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Create connection pool and register pgvector codec."""
        if self._pool is not None:
            raise RuntimeError("Already connected. Call disconnect() first.")

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
            raise ValueError(f"Embedding dimension mismatch: got {len(embedding)}, expected {self.dimension}")

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
