"""Tests for LLM exception hierarchy."""
from src.core.exceptions import (
    LLMError,
    LLMConnectionError,
    LLMAuthError,
    LLMResponseError,
    PlatformError,
)


class TestLLMExceptions:
    def test_llm_error_is_platform_error(self):
        err = LLMError("fail")
        assert isinstance(err, PlatformError)
        assert err.status_code == 503
        assert err.error_code == "LLM_SERVICE_ERROR"

    def test_llm_connection_error(self):
        err = LLMConnectionError("timeout")
        assert isinstance(err, LLMError)
        assert err.status_code == 503
        assert err.error_code == "LLM_CONNECTION_ERROR"

    def test_llm_auth_error(self):
        err = LLMAuthError("invalid key")
        assert isinstance(err, LLMError)
        assert err.status_code == 401
        assert err.error_code == "LLM_AUTH_ERROR"

    def test_llm_response_error(self):
        err = LLMResponseError("bad json")
        assert isinstance(err, LLMError)
        assert err.status_code == 503
        assert err.error_code == "LLM_RESPONSE_ERROR"

    def test_llm_error_with_detail(self):
        err = LLMError("fail", detail={"provider": "deepseek"})
        assert err.detail == {"provider": "deepseek"}
