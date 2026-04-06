"""Settings API — manage LLM provider configuration at runtime."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["settings"])

# ---------------------------------------------------------------------------
# In-memory LLM config registry (survives until server restart)
# ---------------------------------------------------------------------------

_LLM_PROVIDERS: list[dict] = [
    {
        "id": "deepseek",
        "name": "DeepSeek (云端)",
        "model": "deepseek-chat",
        "api_base": "https://api.deepseek.com",
        "api_key": "sk-55c4287ca6f946e78e3a5b451251455d",
        "description": "DeepSeek大模型云端API，速度快，支持JSON输出",
        "is_local": False,
    },
    {
        "id": "qwq-32b",
        "name": "Qwen QWQ-32B (本地)",
        "model": "qwen/qwq-32b",
        "api_base": "http://127.0.0.1:1234/v1",
        "api_key": "lm-studio",
        "description": "通义千问QWQ-32B推理模型，通过LM Studio本地运行",
        "is_local": True,
    },
    {
        "id": "qwen3-8b",
        "name": "Qwen3 8B (本地)",
        "model": "qwen/qwen3-8b",
        "api_base": "http://127.0.0.1:1234/v1",
        "api_key": "lm-studio",
        "description": "通义千问3 8B轻量模型，响应更快",
        "is_local": True,
    },
]

_active_provider_id: str = "qwq-32b"  # Default to local


def get_active_provider_config() -> dict | None:
    """Return the currently active provider config dict. Called by chat.py."""
    return next((p for p in _LLM_PROVIDERS if p["id"] == _active_provider_id), None)


def _init_from_env():
    """Initialize provider list with env vars on first load."""
    global _active_provider_id
    from src.core.config import settings

    # Fill DeepSeek key from env only if it looks like a real key (starts with sk-)
    if settings.llm_api_key and settings.llm_api_key.startswith("sk-"):
        for p in _LLM_PROVIDERS:
            if p["id"] == "deepseek":
                p["api_key"] = settings.llm_api_key

    # Detect active provider from current config
    if "localhost" in settings.llm_api_base or "127.0.0.1" in settings.llm_api_base:
        if "qwq" in settings.llm_model:
            _active_provider_id = "qwq-32b"
        else:
            _active_provider_id = "qwen3-8b"
    else:
        _active_provider_id = "deepseek"


_init_from_env()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class LLMProviderInfo(BaseModel):
    id: str
    name: str
    model: str
    api_base: str
    description: str
    is_local: bool
    is_active: bool


class AddProviderRequest(BaseModel):
    id: str
    name: str
    model: str
    api_base: str
    api_key: str = ""
    description: str = ""
    is_local: bool = False


class SwitchProviderRequest(BaseModel):
    provider_id: str


class SwitchResult(BaseModel):
    success: bool
    active_provider: str
    message: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/llm/providers", response_model=list[LLMProviderInfo])
def list_providers():
    """List all configured LLM providers."""
    return [
        LLMProviderInfo(
            id=p["id"],
            name=p["name"],
            model=p["model"],
            api_base=p["api_base"],
            description=p["description"],
            is_local=p["is_local"],
            is_active=(p["id"] == _active_provider_id),
        )
        for p in _LLM_PROVIDERS
    ]


@router.get("/llm/active")
def get_active_provider():
    """Get the currently active LLM provider."""
    for p in _LLM_PROVIDERS:
        if p["id"] == _active_provider_id:
            return {
                "id": p["id"],
                "name": p["name"],
                "model": p["model"],
                "api_base": p["api_base"],
                "is_local": p["is_local"],
            }
    return {"id": _active_provider_id, "name": "Unknown"}


@router.post("/llm/switch", response_model=SwitchResult)
def switch_provider(req: SwitchProviderRequest):
    """Switch the active LLM provider at runtime."""
    global _active_provider_id

    provider = next((p for p in _LLM_PROVIDERS if p["id"] == req.provider_id), None)
    if not provider:
        return SwitchResult(
            success=False,
            active_provider=_active_provider_id,
            message=f"未找到提供商: {req.provider_id}",
        )

    # Update the active provider and force LLM client re-creation
    try:
        _active_provider_id = req.provider_id

        # Update os.environ so new LLMClient reads correct values
        import os

        os.environ["LLM_API_KEY"] = provider["api_key"]
        os.environ["LLM_API_BASE"] = provider["api_base"]
        os.environ["LLM_MODEL"] = provider["model"]

        # Also update the Settings singleton via __dict__ (bypasses Pydantic frozen)
        from src.core.config import settings

        settings.__dict__["llm_api_key"] = provider["api_key"]
        settings.__dict__["llm_api_base"] = provider["api_base"]
        settings.__dict__["llm_model"] = provider["model"]

        # Clear the LLM client cache
        from src.api.routes.chat import _llm_client_cache

        _llm_client_cache.clear()

        return SwitchResult(
            success=True,
            active_provider=_active_provider_id,
            message=f"已切换到 {provider['name']} ({provider['model']})",
        )
    except Exception as e:
        return SwitchResult(
            success=False,
            active_provider=_active_provider_id,
            message=f"切换失败: {str(e)}",
        )


@router.post("/llm/providers", response_model=LLMProviderInfo)
def add_provider(req: AddProviderRequest):
    """Add a new LLM provider configuration."""
    # Check duplicate
    if any(p["id"] == req.id for p in _LLM_PROVIDERS):
        # Update existing
        for p in _LLM_PROVIDERS:
            if p["id"] == req.id:
                p.update(req.model_dump())
                return LLMProviderInfo(**p, is_active=(p["id"] == _active_provider_id))

    new_provider = req.model_dump()
    _LLM_PROVIDERS.append(new_provider)
    return LLMProviderInfo(**new_provider, is_active=False)


@router.delete("/llm/providers/{provider_id}")
def delete_provider(provider_id: str):
    """Delete a LLM provider configuration."""
    global _LLM_PROVIDERS
    if provider_id == _active_provider_id:
        return {"success": False, "message": "不能删除当前激活的提供商"}
    _LLM_PROVIDERS = [p for p in _LLM_PROVIDERS if p["id"] != provider_id]
    return {"success": True}
