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
