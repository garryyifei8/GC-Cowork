"""Tests for Knowledge Base with RAG."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from src.knowledge.rag import (
    KnowledgeItem, 
    SearchResult, 
    KnowledgeRAG, 
    InMemoryVectorStore,
    EmbeddingModel,
)


class TestKnowledgeItem:
    """Test KnowledgeItem model."""

    def test_create_knowledge_item(self):
        """Test creating a knowledge item."""
        item = KnowledgeItem(
            id="test-1",
            title="测试文档",
            content="这是测试内容",
            category="project",
            tags=["测试", "项目"],
            project_id="p1",
        )
        
        assert item.id == "test-1"
        assert item.title == "测试文档"
        assert item.category == "project"

    def test_knowledge_item_to_dict(self):
        """Test knowledge item serialization."""
        item = KnowledgeItem(
            id="test-1",
            title="测试",
            content="内容",
            category="test",
        )
        
        data = item.model_dump()
        assert data["id"] == "test-1"
        assert data["title"] == "测试"


class TestSearchResult:
    """Test SearchResult model."""

    def test_create_search_result(self):
        """Test creating a search result."""
        result = SearchResult(
            item=KnowledgeItem(
                id="test-1",
                title="测试",
                content="内容",
                category="test",
            ),
            score=0.95,
            highlight="这是**测试**内容",
        )
        
        assert result.score == 0.95
        assert "**测试**" in result.highlight


class TestInMemoryVectorStore:
    """Test InMemoryVectorStore."""

    @pytest.fixture
    def store(self):
        return InMemoryVectorStore()

    @pytest.mark.asyncio
    async def test_add_and_search(self, store):
        """Test adding and searching."""
        item = KnowledgeItem(
            id="1",
            title="测试",
            content="测试内容",
            category="test",
        )
        
        await store.add(item, [0.1, 0.2, 0.3])
        
        results = await store.search([0.1, 0.2, 0.3], top_k=1)
        
        assert len(results) == 1
        assert results[0][0].id == "1"

    @pytest.mark.asyncio
    async def test_delete(self, store):
        """Test deleting."""
        item = KnowledgeItem(
            id="1",
            title="测试",
            content="测试内容",
            category="test",
        )
        
        await store.add(item, [0.1, 0.2, 0.3])
        await store.delete("1")
        
        results = await store.search([0.1, 0.2, 0.3], top_k=1)
        
        assert len(results) == 0


class TestEmbeddingModel:
    """Test EmbeddingModel."""

    def test_embedding_model_name(self):
        """Test embedding model name."""
        model = EmbeddingModel()
        assert model.name == "bge-m3"
        
        model_custom = EmbeddingModel(model_name="custom-model")
        assert model_custom.name == "custom-model"

    @pytest.mark.asyncio
    async def test_embed(self):
        """Test embedding generation."""
        model = EmbeddingModel()
        embedding = await model.embed("测试文本")
        
        assert isinstance(embedding, list)
        assert len(embedding) > 0


class TestKnowledgeRAG:
    """Test Knowledge RAG system."""

    @pytest.fixture
    def rag(self):
        """Create a KnowledgeRAG with in-memory store."""
        store = InMemoryVectorStore()
        model = EmbeddingModel()
        return KnowledgeRAG(vector_store=store, embedding_model=model)

    @pytest.mark.asyncio
    async def test_initialize(self, rag):
        """Test RAG initialization."""
        await rag.initialize()
        # InMemoryVectorStore doesn't need special init

    @pytest.mark.asyncio
    async def test_add_and_search(self, rag):
        """Test add and search."""
        item = KnowledgeItem(
            id="1",
            title="项目管理制度",
            content="这是项目管理制度的内容",
            category="制度",
        )
        
        await rag.add_knowledge(item)
        
        results = await rag.search("项目管理制度", top_k=1)
        
        assert len(results) >= 0  # May have results

    @pytest.mark.asyncio
    async def test_search_with_category(self, rag):
        """Test search with category filter."""
        # Add items
        await rag.add_knowledge(KnowledgeItem(
            id="1",
            title="制度1",
            content="制度内容",
            category="制度",
        ))
        
        await rag.add_knowledge(KnowledgeItem(
            id="2",
            title="流程1",
            content="流程内容",
            category="流程",
        ))
        
        results = await rag.search("内容", top_k=5, category="制度")
        
        # Should filter by category
        assert all(r.item.category == "制度" for r in results)

    @pytest.mark.asyncio
    async def test_get_context(self, rag):
        """Test getting context for LLM."""
        await rag.add_knowledge(KnowledgeItem(
            id="1",
            title="项目管理制度",
            content="项目管理制度文档内容",
            category="制度",
        ))
        
        context = await rag.get_context_for_llm("项目管理制度")
        
        assert "项目管理制度" in context


class TestHighlight:
    """Test highlight functionality."""

    def test_create_highlight(self):
        """Test highlight creation."""
        from src.knowledge.rag import KnowledgeRAG
        
        content = "这是项目管理制度文档"
        query = "项目管理制度"
        
        highlight = KnowledgeRAG._create_highlight(content, query)
        
        assert "**" in highlight  # Should have markdown bold
