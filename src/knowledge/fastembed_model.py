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
            vec = next(self._model.embed([text]))
            return vec.tolist()

        return await asyncio.to_thread(_run)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""

        def _run() -> list[list[float]]:
            self._ensure_model()
            return [v.tolist() for v in self._model.embed(texts)]

        return await asyncio.to_thread(_run)
