"""Knowledge Base with RAG (Retrieval Augmented Generation).

This module provides knowledge management with vector search capabilities.
Supports Milvus (国产开源) as the vector database.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------


class KnowledgeItem(BaseModel):
    """A knowledge item in the knowledge base."""

    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    title: str
    content: str
    category: str = "general"  # project, process, template, policy, etc.
    tags: list[str] = Field(default_factory=list)
    project_id: str | None = None
    department: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


@dataclass
class SearchResult:
    """A search result from the knowledge base."""

    item: KnowledgeItem
    score: float
    highlight: str | None = None


# ---------------------------------------------------------------------------
# Vector Store Interface
# ---------------------------------------------------------------------------


class VectorStore(ABC):
    """Abstract vector store interface."""

    @abstractmethod
    async def connect(self) -> None:
        """Connect to the vector store."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from the vector store."""
        pass

    @abstractmethod
    async def add(self, item: KnowledgeItem, embedding: list[float]) -> None:
        """Add an item with its embedding."""
        pass

    @abstractmethod
    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[tuple[KnowledgeItem, float]]:
        """Search for similar items."""
        pass

    @abstractmethod
    async def delete(self, item_id: str) -> None:
        """Delete an item by ID."""
        pass


# ---------------------------------------------------------------------------
# In-Memory Vector Store (for testing/dev)
# ---------------------------------------------------------------------------


class InMemoryVectorStore(VectorStore):
    """In-memory vector store for development and testing."""

    def __init__(self):
        self._items: dict[str, KnowledgeItem] = {}
        self._embeddings: dict[str, list[float]] = {}

    async def connect(self) -> None:
        """No-op for in-memory store."""
        pass

    async def disconnect(self) -> None:
        """No-op for in-memory store."""
        pass

    async def add(self, item: KnowledgeItem, embedding: list[float]) -> None:
        """Add an item."""
        self._items[item.id] = item
        self._embeddings[item.id] = embedding

    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[tuple[KnowledgeItem, float]]:
        """Simple cosine similarity search."""
        results: list[tuple[KnowledgeItem, float]] = []

        for item_id, embedding in self._embeddings.items():
            # Filter by metadata if provided
            if filters:
                item = self._items[item_id]
                if not self._matches_filters(item, filters):
                    continue

            # Calculate similarity (simplified)
            similarity = self._cosine_similarity(query_embedding, embedding)
            results.append((self._items[item_id], similarity))

        # Sort by similarity and return top k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    async def delete(self, item_id: str) -> None:
        """Delete an item."""
        self._items.pop(item_id, None)
        self._embeddings.pop(item_id, None)

    def _matches_filters(self, item: KnowledgeItem, filters: dict[str, Any]) -> bool:
        """Check if item matches filters."""
        for key, value in filters.items():
            if hasattr(item, key):
                if getattr(item, key) != value:
                    return False
            elif key in item.metadata:
                if item.metadata[key] != value:
                    return False
        return True

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        """Calculate cosine similarity."""
        if not a or not b or len(a) != len(b):
            return 0.0

        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x * x for x in a) ** 0.5
        magnitude_b = sum(x * x for x in b) ** 0.5

        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0

        return dot_product / (magnitude_a * magnitude_b)


# ---------------------------------------------------------------------------
# Milvus Vector Store (Production)
# ---------------------------------------------------------------------------


class MilvusVectorStore(VectorStore):
    """Milvus vector store for production use."""

    def __init__(
        self,
        host: str = "localhost",
        port: str = "19530",
        collection: str = "knowledge",
        dimension: int = 1024,  # BGE-M3 dimension
    ):
        self.host = host
        self.port = port
        self.collection = collection
        self.dimension = dimension
        self._client = None

    async def connect(self) -> None:
        """Connect to Milvus."""
        try:
            from pymilvus import connections

            connections.connect(
                alias="default",
                host=self.host,
                port=self.port,
            )
            self._client = connections
        except ImportError:
            raise ImportError("pymilvus is required. Install with: pip install pymilvus")

    async def disconnect(self) -> None:
        """Disconnect from Milvus."""
        if self._client:
            self._client.disconnect("default")

    async def add(self, item: KnowledgeItem, embedding: list[float]) -> None:
        """Add an item to Milvus."""
        # Implementation would use milvus_client.insert()
        pass

    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[tuple[KnowledgeItem, float]]:
        """Search in Milvus."""
        # Implementation would use milvus_client.search()
        return []

    async def delete(self, item_id: str) -> None:
        """Delete from Milvus."""
        # Implementation would use milvus_client.delete()
        pass


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------


class EmbeddingModel:
    """Embedding model wrapper."""

    def __init__(self, model_name: str | None = None, dimension: int = 1024):
        self.model_name = model_name or os.environ.get(
            "EMBEDDING_MODEL",
            "bge-m3",  # Default to BGE-M3 (国产开源)
        )
        self.name = self.model_name
        self.dimension = dimension

    async def embed(self, text: str) -> list[float]:
        """Get embedding for text."""
        # TODO: Implement actual embedding call
        # This would call BGE-M3 or other embedding model
        import hashlib

        # Simple hash-based mock for testing
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        # Return a fixed-size mock embedding
        return [(hash_val >> i) % 2 for i in range(self.dimension)]


async def get_embedding(text: str) -> list[float]:
    """Get embedding for text using the configured model."""
    model = EmbeddingModel()
    return await model.embed(text)


# ---------------------------------------------------------------------------
# Knowledge RAG
# ---------------------------------------------------------------------------


class KnowledgeRAG:
    """Knowledge Retrieval Augmented Generation system."""

    def __init__(
        self,
        vector_store: VectorStore | None = None,
        embedding_model: EmbeddingModel | None = None,
    ):
        self.vector_store = vector_store or InMemoryVectorStore()
        self.embedding_model = embedding_model or EmbeddingModel()

    async def initialize(self) -> None:
        """Initialize the RAG system."""
        await self.vector_store.connect()

    async def close(self) -> None:
        """Close the RAG system."""
        await self.vector_store.disconnect()

    async def add_knowledge(self, item: KnowledgeItem) -> None:
        """Add a knowledge item."""
        # Get embedding
        embedding = await self.embedding_model.embed(item.content)

        # Store in vector database
        await self.vector_store.add(item, embedding)

    async def delete_knowledge(self, item_id: str) -> None:
        """Delete a knowledge item."""
        await self.vector_store.delete(item_id)

    async def search(
        self,
        query: str,
        top_k: int = 5,
        category: str | None = None,
        project_id: str | None = None,
    ) -> list[SearchResult]:
        """Search knowledge base."""
        # Get query embedding
        query_embedding = await self.embedding_model.embed(query)

        # Build filters
        filters = {}
        if category:
            filters["category"] = category
        if project_id:
            filters["project_id"] = project_id

        # Search
        raw_results = await self.vector_store.search(
            query_embedding,
            top_k=top_k,
            filters=filters if filters else None,
        )

        # Convert tuples to SearchResult objects
        search_results = []
        for item, score in raw_results:
            highlight = self._create_highlight(item.content, query)
            search_results.append(
                SearchResult(
                    item=item,
                    score=score,
                    highlight=highlight,
                )
            )

        return search_results

    async def get_context_for_llm(
        self,
        query: str,
        top_k: int = 3,
    ) -> str:
        """Get context string for LLM."""
        results = await self.search(query, top_k=top_k)

        if not results:
            return "未找到相关知识。"

        context_parts = ["以下是检索到的相关知识：\n"]

        for i, result in enumerate(results, 1):
            context_parts.append(
                f"\n【文档{i}】{result.item.title}\n"
                f"相关度: {result.score:.2%}\n"
                f"内容: {result.highlight or result.item.content[:500]}\n"
            )

        return "\n".join(context_parts)

    @staticmethod
    def _create_highlight(content: str, query: str) -> str:
        """Create highlighted content."""
        # Simple highlight: wrap matching terms in **
        import re

        # Extract keywords from query (simple approach)
        keywords = query.split()[:3]

        highlighted = content
        for keyword in keywords:
            # Wrap keyword in ** (markdown bold)
            highlighted = re.sub(
                f"({keyword})",
                r"**\1**",
                highlighted,
                flags=re.IGNORECASE,
            )

        # Truncate
        if len(highlighted) > 500:
            highlighted = highlighted[:500] + "..."

        return highlighted


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def build_rag() -> KnowledgeRAG:
    """Build a KnowledgeRAG instance based on environment config."""
    backend = os.environ.get("VECTOR_DB_BACKEND", "memory").lower()
    dimension = int(os.environ.get("EMBEDDING_DIMENSION", "512"))

    if backend == "memory":
        embedding_model: EmbeddingModel = EmbeddingModel(dimension=dimension)
    else:
        from src.knowledge.fastembed_model import FastEmbedModel

        embedding_model = FastEmbedModel(dimension=dimension)

    if backend == "memory":
        vector_store: VectorStore = InMemoryVectorStore()
    elif backend == "pgvector":
        from src.db.client import get_db_url
        from src.knowledge.pgvector_store import PgVectorStore

        vector_store = PgVectorStore(dsn=get_db_url(), dimension=dimension)
    else:
        raise ValueError(f"Unknown vector DB backend: {backend!r}")

    return KnowledgeRAG(vector_store=vector_store, embedding_model=embedding_model)
