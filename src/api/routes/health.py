"""Health check endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from src.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str
    app_name: str


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        app_name=settings.app_name,
    )
