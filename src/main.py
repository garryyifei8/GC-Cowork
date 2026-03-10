"""
AI原生项目协作平台 — FastAPI application entry point.
P0 Foundation: conversational engine + agent skeleton + knowledge base stub.
"""
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.routes import chat, health
from src.core.config import settings
from src.core.exceptions import (
    PlatformError,
    http_exception_handler,
    platform_error_handler,
    unhandled_exception_handler,
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-native project collaboration platform for government bond consulting and EPC projects.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(PlatformError, platform_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError) -> JSONResponse:
    """Return structured 422 errors with field-level detail."""
    errors = []
    for err in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in err["loc"]),
            "message": err["msg"],
            "type": err["type"],
        })
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "detail": {"errors": errors},
        },
    )


app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name} v{settings.app_version}"}
