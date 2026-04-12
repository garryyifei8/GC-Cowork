"""Tests for KnowledgeRAG backend selection."""

import os
from unittest.mock import patch

import pytest

from src.knowledge.rag import InMemoryVectorStore, build_rag


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
        with (
            patch.dict(os.environ, {"VECTOR_DB_BACKEND": "weaviate"}),
            pytest.raises(ValueError, match="Unknown vector DB backend"),
        ):
            build_rag()
