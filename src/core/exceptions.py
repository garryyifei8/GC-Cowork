"""
Custom exception hierarchy for the AI-native project collaboration platform.
All domain errors inherit from PlatformError so handlers can catch them uniformly.
"""

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class PlatformError(Exception):
    """Base exception for all platform-specific errors."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, detail: dict | None = None):
        self.message = message
        self.detail = detail or {}
        super().__init__(message)


class ValidationError(PlatformError):
    status_code = 422
    error_code = "VALIDATION_ERROR"


class SessionNotFoundError(PlatformError):
    status_code = 404
    error_code = "SESSION_NOT_FOUND"


class AgentRoutingError(PlatformError):
    status_code = 500
    error_code = "AGENT_ROUTING_ERROR"


class LLMError(PlatformError):
    """Base exception for all LLM-related errors."""

    status_code = 503
    error_code = "LLM_SERVICE_ERROR"


class LLMConnectionError(LLMError):
    """Network unreachable or timeout when calling LLM API."""

    error_code = "LLM_CONNECTION_ERROR"


class LLMAuthError(LLMError):
    """Invalid API key or authentication failure (HTTP 401)."""

    status_code = 401
    error_code = "LLM_AUTH_ERROR"


class LLMResponseError(LLMError):
    """LLM returned malformed or unparseable response."""

    error_code = "LLM_RESPONSE_ERROR"


class KnowledgeBaseError(PlatformError):
    status_code = 503
    error_code = "KNOWLEDGE_BASE_ERROR"


class ProjectNotFoundError(PlatformError):
    status_code = 404
    error_code = "PROJECT_NOT_FOUND"


class TaskNotFoundError(PlatformError):
    status_code = 404
    error_code = "TASK_NOT_FOUND"


class PermissionDeniedError(PlatformError):
    status_code = 403
    error_code = "PERMISSION_DENIED"


# ---------------------------------------------------------------------------
# FastAPI exception handlers (register these on the app)
# ---------------------------------------------------------------------------


def _error_body(error_code: str, message: str, detail: dict) -> dict:
    return {"error_code": error_code, "message": message, "detail": detail}


async def platform_error_handler(request: Request, exc: PlatformError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(exc.error_code, exc.message, exc.detail),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(
            f"HTTP_{exc.status_code}",
            str(exc.detail),
            {},
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=_error_body(
            "INTERNAL_ERROR",
            "An unexpected error occurred. Please try again later.",
            {},
        ),
    )
