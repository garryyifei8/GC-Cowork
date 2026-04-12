"""FastAPI middleware for structured logging and metrics collection."""

from __future__ import annotations

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware that adds request_id, structured access logs, and metrics."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        start = time.perf_counter()

        # Bind request context for all log calls during this request
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        log = structlog.get_logger("access")

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start

            response.headers["x-request-id"] = request_id

            # Record metrics
            from src.api.routes.metrics import record_request

            record_request(request.method, request.url.path, response.status_code, duration)

            log.info(
                "request_complete",
                status=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )
            return response
        except Exception as exc:
            duration = time.perf_counter() - start
            log.error(
                "request_failed",
                error=str(exc),
                duration_ms=round(duration * 1000, 2),
            )
            raise
