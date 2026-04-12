"""Tests for LLM retry decorator."""
import asyncio

import httpx
import pytest

from src.llm.retry import retry_llm


class TestRetryLLM:
    async def test_succeeds_on_first_try(self):
        call_count = 0

        @retry_llm(max_attempts=3, base_delay=0.01)
        async def good_call():
            nonlocal call_count
            call_count += 1
            return "ok"

        result = await good_call()
        assert result == "ok"
        assert call_count == 1

    async def test_retries_on_timeout(self):
        call_count = 0

        @retry_llm(max_attempts=3, base_delay=0.01)
        async def flaky_call():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise httpx.TimeoutException("timeout")
            return "ok"

        result = await flaky_call()
        assert result == "ok"
        assert call_count == 3

    async def test_retries_on_connect_error(self):
        call_count = 0

        @retry_llm(max_attempts=2, base_delay=0.01)
        async def fail_connect():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise httpx.ConnectError("refused")
            return "connected"

        result = await fail_connect()
        assert result == "connected"
        assert call_count == 2

    async def test_exhausts_retries_and_raises(self):
        @retry_llm(max_attempts=2, base_delay=0.01)
        async def always_fail():
            raise httpx.TimeoutException("always timeout")

        with pytest.raises(httpx.TimeoutException, match="always timeout"):
            await always_fail()

    async def test_does_not_retry_non_retryable_errors(self):
        call_count = 0

        @retry_llm(max_attempts=3, base_delay=0.01)
        async def auth_error():
            nonlocal call_count
            call_count += 1
            raise ValueError("bad input")

        with pytest.raises(ValueError, match="bad input"):
            await auth_error()
        assert call_count == 1  # No retry for ValueError

    async def test_exponential_backoff_timing(self):
        """Verify that retry delays increase exponentially."""
        call_times = []

        @retry_llm(max_attempts=3, base_delay=0.05, jitter=False)
        async def timed_fail():
            call_times.append(asyncio.get_event_loop().time())
            raise httpx.TimeoutException("timeout")

        with pytest.raises(httpx.TimeoutException):
            await timed_fail()

        assert len(call_times) == 3
        # First retry delay ~ 0.05s, second ~ 0.10s
        delay1 = call_times[1] - call_times[0]
        delay2 = call_times[2] - call_times[1]
        assert delay1 >= 0.04  # base_delay with tolerance
        assert delay2 >= 0.08  # 2x base_delay with tolerance
        assert delay2 > delay1  # exponential growth
