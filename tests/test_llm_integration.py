"""
Integration tests that call the real DeepSeek API.
Run manually: pytest tests/test_llm_integration.py -v -m integration
Requires LLM_API_KEY in .env
"""
import pytest

from src.core.config import settings
from src.llm.client import LLMClient

pytestmark = pytest.mark.integration


@pytest.fixture
async def live_client():
    client = LLMClient(
        api_key=settings.llm_api_key,
        api_base=settings.llm_api_base,
        model=settings.llm_model,
    )
    yield client
    await client.close()


class TestLiveChat:
    @pytest.mark.asyncio
    async def test_simple_greeting(self, live_client):
        result = await live_client.chat(
            messages=[{"role": "user", "content": "你好，请用一句话介绍自己"}]
        )
        assert len(result) > 0
        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_json_intent(self, live_client):
        messages = [
            {"role": "system", "content": "输出JSON: {\"intent\": \"greeting\"}"},
            {"role": "user", "content": "你好"},
        ]
        result = await live_client.chat_json(messages)
        assert isinstance(result, dict)
