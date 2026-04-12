"""Exponential backoff retry for LLM API calls."""

from __future__ import annotations

import asyncio
import logging
import random
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

import httpx

logger = logging.getLogger(__name__)

# HTTP status codes that warrant a retry
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

F = TypeVar("F", bound=Callable[..., Any])


def retry_llm(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    jitter: bool = True,
) -> Callable[[F], F]:
    """Decorator that retries async functions on transient LLM API failures.

    Retries on:
    - httpx.TimeoutException
    - httpx.ConnectError
    - LLMConnectionError (wraps the above)
    - HTTP 429 (rate limit) / 5xx (server errors)

    Uses exponential backoff: delay = base_delay * 2^attempt (+ jitter).
    """

    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except httpx.TimeoutException as exc:
                    last_exc = exc
                    _log_retry(func.__name__, attempt, max_attempts, exc)
                except httpx.ConnectError as exc:
                    last_exc = exc
                    _log_retry(func.__name__, attempt, max_attempts, exc)
                except Exception as exc:
                    # Check if it's a retryable LLM error
                    from src.core.exceptions import LLMConnectionError, LLMResponseError

                    if isinstance(exc, LLMConnectionError):
                        last_exc = exc
                        _log_retry(func.__name__, attempt, max_attempts, exc)
                    elif isinstance(exc, LLMResponseError):
                        status = (
                            exc.detail.get("status", 0)
                            if hasattr(exc, "detail") and isinstance(exc.detail, dict)
                            else 0
                        )
                        if status in RETRYABLE_STATUS_CODES:
                            last_exc = exc
                            _log_retry(func.__name__, attempt, max_attempts, exc)
                        else:
                            raise  # Non-retryable (e.g. 400, 401)
                    else:
                        raise  # Unknown exception, don't retry

                # Don't sleep after the last attempt
                if attempt < max_attempts - 1:
                    delay = min(base_delay * (2**attempt), max_delay)
                    if jitter:
                        delay = delay * (0.5 + random.random())
                    logger.info(
                        "Retrying %s in %.1fs (attempt %d/%d)",
                        func.__name__,
                        delay,
                        attempt + 2,
                        max_attempts,
                    )
                    await asyncio.sleep(delay)

            # All attempts exhausted
            raise last_exc  # type: ignore[misc]

        return wrapper  # type: ignore[return-value]

    return decorator


def _log_retry(func_name: str, attempt: int, max_attempts: int, exc: Exception) -> None:
    logger.warning(
        "LLM call %s failed (attempt %d/%d): %s",
        func_name,
        attempt + 1,
        max_attempts,
        str(exc)[:200],
    )
