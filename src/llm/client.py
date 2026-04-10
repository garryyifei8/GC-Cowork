"""
Unified LLM client wrapping the DeepSeek API (OpenAI-compatible chat/completions).
Uses httpx async for HTTP calls. No external SDK dependency.
"""

import json
import logging
from collections.abc import AsyncIterator

import httpx

from src.core.exceptions import LLMAuthError, LLMConnectionError, LLMResponseError

logger = logging.getLogger(__name__)

_STREAM_TIMEOUT = 120.0  # longer timeout for streaming connections


class LLMClient:
    """Async client for the DeepSeek chat/completions API."""

    def __init__(
        self,
        api_key: str,
        api_base: str = "https://api.deepseek.com",
        model: str = "deepseek-chat",
        timeout: float = 60.0,
    ):
        self._api_key = api_key
        self._api_base = api_base.rstrip("/")
        self._model = model
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        self._http = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            headers=self._headers,
        )

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Send a chat completion request and return the assistant content string."""
        payload = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        data = await self._post(payload)
        return self._extract_content(data)

    async def chat_json(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> dict:
        """Send a chat request expecting JSON output. Returns parsed dict."""
        payload = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        # Only add response_format for APIs that support it (not LM Studio)
        if "deepseek" in self._api_base or "openai" in self._api_base:
            payload["response_format"] = {"type": "json_object"}
        data = await self._post(payload)
        content = self._extract_content(data)
        # Try to extract JSON from the response (may be wrapped in markdown)
        try:
            return json.loads(content)
        except (json.JSONDecodeError, TypeError):
            # Try extracting JSON from ```json ... ``` blocks
            import re

            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
            if json_match:
                try:
                    return json.loads(json_match.group(1).strip())
                except json.JSONDecodeError:
                    pass
            # Try finding JSON object in text
            brace_start = content.find("{")
            if brace_start >= 0:
                # Find matching closing brace
                depth = 0
                for i in range(brace_start, len(content)):
                    if content[i] == "{":
                        depth += 1
                    elif content[i] == "}":
                        depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(content[brace_start : i + 1])
                        except json.JSONDecodeError:
                            break
            raise LLMResponseError(
                f"LLM returned invalid JSON: {content[:200]}",
                detail={"raw_content": content[:500]},
            )

    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Yield content tokens from a streaming chat completion.

        Uses httpx streaming to parse DeepSeek/OpenAI-compatible SSE events.
        Each yielded value is a content string fragment (delta).
        """
        url = f"{self._api_base}/chat/completions"
        payload = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        try:
            stream_client = httpx.AsyncClient(
                timeout=httpx.Timeout(
                    connect=10.0,
                    read=_STREAM_TIMEOUT,
                    write=10.0,
                    pool=10.0,
                ),
                headers=self._headers,
            )
            async with stream_client.stream("POST", url, json=payload) as resp:
                if resp.status_code == 401:
                    await stream_client.aclose()
                    raise LLMAuthError("Invalid LLM API key")
                if resp.status_code != 200:
                    body = ""
                    async for chunk in resp.aiter_text():
                        body += chunk
                        if len(body) > 500:
                            break
                    await stream_client.aclose()
                    raise LLMResponseError(
                        f"LLM API returned HTTP {resp.status_code}",
                        detail={"status": resp.status_code, "body": body[:500]},
                    )

                buffer = ""
                in_think = False  # Track <think> blocks for reasoning models
                async for raw_chunk in resp.aiter_text():
                    buffer += raw_chunk
                    # SSE events are separated by double newlines
                    while "\n\n" in buffer:
                        event_str, buffer = buffer.split("\n\n", 1)
                        for line in event_str.strip().splitlines():
                            if not line.startswith("data: "):
                                continue
                            data_str = line[len("data: ") :]
                            if data_str.strip() == "[DONE]":
                                await stream_client.aclose()
                                return
                            try:
                                data = json.loads(data_str)
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content")
                                if content:
                                    # Filter <think>...</think> blocks (qwq/reasoning models)
                                    if "<think>" in content:
                                        in_think = True
                                        content = content.split("<think>")[0]
                                    if "</think>" in content:
                                        in_think = False
                                        content = content.split("</think>")[-1]
                                    if not in_think and content:
                                        yield content
                            except (json.JSONDecodeError, KeyError, IndexError):
                                logger.debug("Skipping unparseable SSE chunk: %s", data_str[:200])
                                continue

            await stream_client.aclose()

        except httpx.TimeoutException as exc:
            raise LLMConnectionError("LLM streaming request timed out", detail={"url": url}) from exc
        except httpx.ConnectError as exc:
            raise LLMConnectionError("Failed to connect to LLM API for streaming", detail={"url": url}) from exc

    async def _post(self, payload: dict) -> dict:
        """POST to chat/completions endpoint with error handling."""
        url = f"{self._api_base}/chat/completions"
        try:
            resp = await self._http.post(url, json=payload)
        except httpx.TimeoutException as exc:
            raise LLMConnectionError("LLM request timed out", detail={"url": url}) from exc
        except httpx.ConnectError as exc:
            raise LLMConnectionError("Failed to connect to LLM API", detail={"url": url}) from exc

        if resp.status_code == 401:
            raise LLMAuthError("Invalid LLM API key")
        if resp.status_code != 200:
            raise LLMResponseError(
                f"LLM API returned HTTP {resp.status_code}",
                detail={"status": resp.status_code, "body": resp.text[:500]},
            )
        return resp.json()

    @staticmethod
    def _extract_content(data: dict) -> str:
        """Pull assistant content from a chat/completions response.

        Strips <think>...</think> blocks from reasoning models (qwq, o1, etc).
        """
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMResponseError(
                "Unexpected response structure from LLM",
                detail={"keys": list(data.keys()) if isinstance(data, dict) else str(type(data))},
            ) from exc
        # Strip reasoning/thinking blocks
        import re

        content = re.sub(r"<think>[\s\S]*?</think>", "", content).strip()
        return content

    async def close(self):
        await self._http.aclose()
