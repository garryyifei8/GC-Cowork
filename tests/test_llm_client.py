"""Tests for LLMClient — all LLM calls mocked via httpx."""
import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from src.core.exceptions import LLMAuthError, LLMConnectionError, LLMResponseError
from src.llm.client import LLMClient


@pytest.fixture
def llm_client():
    return LLMClient(
        api_key="test-key",
        api_base="https://api.deepseek.com",
        model="deepseek-chat",
    )


def _make_chat_response(content: str) -> httpx.Response:
    """Build a fake DeepSeek chat/completions response."""
    body = {
        "choices": [{"message": {"content": content}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 20},
    }
    return httpx.Response(200, json=body)


class TestChat:
    @pytest.mark.asyncio
    async def test_chat_success(self, llm_client):
        mock_resp = _make_chat_response("你好，有什么可以帮你的？")
        with patch.object(
            llm_client._http, "post", new_callable=AsyncMock, return_value=mock_resp
        ):
            result = await llm_client.chat(
                messages=[{"role": "user", "content": "你好"}]
            )
        assert result == "你好，有什么可以帮你的？"

    @pytest.mark.asyncio
    async def test_chat_timeout(self, llm_client):
        with patch.object(
            llm_client._http,
            "post",
            new_callable=AsyncMock,
            side_effect=httpx.TimeoutException("timeout"),
        ):
            with pytest.raises(LLMConnectionError):
                await llm_client.chat(
                    messages=[{"role": "user", "content": "hello"}]
                )

    @pytest.mark.asyncio
    async def test_chat_network_error(self, llm_client):
        with patch.object(
            llm_client._http,
            "post",
            new_callable=AsyncMock,
            side_effect=httpx.ConnectError("refused"),
        ):
            with pytest.raises(LLMConnectionError):
                await llm_client.chat(
                    messages=[{"role": "user", "content": "hello"}]
                )

    @pytest.mark.asyncio
    async def test_chat_auth_error(self, llm_client):
        mock_resp = httpx.Response(401, json={"error": {"message": "invalid api key"}})
        with patch.object(
            llm_client._http, "post", new_callable=AsyncMock, return_value=mock_resp
        ):
            with pytest.raises(LLMAuthError):
                await llm_client.chat(
                    messages=[{"role": "user", "content": "hello"}]
                )

    @pytest.mark.asyncio
    async def test_chat_bad_response(self, llm_client):
        mock_resp = httpx.Response(200, json={"unexpected": "format"})
        with patch.object(
            llm_client._http, "post", new_callable=AsyncMock, return_value=mock_resp
        ):
            with pytest.raises(LLMResponseError):
                await llm_client.chat(
                    messages=[{"role": "user", "content": "hello"}]
                )


class TestChatJson:
    @pytest.mark.asyncio
    async def test_chat_json_success(self, llm_client):
        payload = {"primary_agent": "finance", "confidence": 0.9}
        mock_resp = _make_chat_response(json.dumps(payload))
        with patch.object(
            llm_client._http, "post", new_callable=AsyncMock, return_value=mock_resp
        ):
            result = await llm_client.chat_json(
                messages=[{"role": "user", "content": "报销发票"}]
            )
        assert result["primary_agent"] == "finance"
        assert result["confidence"] == 0.9

    @pytest.mark.asyncio
    async def test_chat_json_invalid_json(self, llm_client):
        mock_resp = _make_chat_response("this is not json")
        with patch.object(
            llm_client._http, "post", new_callable=AsyncMock, return_value=mock_resp
        ):
            with pytest.raises(LLMResponseError):
                await llm_client.chat_json(
                    messages=[{"role": "user", "content": "test"}]
                )
