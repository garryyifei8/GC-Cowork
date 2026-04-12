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
