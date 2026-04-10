"""Integration tests for FastAPI endpoints — LLM calls mocked."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_ok(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "app_name" in data


class TestChatSessionEndpoints:
    def test_create_session(self):
        resp = client.post("/api/chat/sessions", json={"user_id": "user_001", "title": "测试会话"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == "user_001"
        assert "session_id" in data

    def test_list_sessions(self):
        client.post("/api/chat/sessions", json={"user_id": "user_list_test"})
        resp = client.get("/api/chat/sessions", params={"user_id": "user_list_test"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1


def _mock_dispatch_intent(primary: str = "dispatch", reply: str = "你好！"):
    return {
        "primary_agent": primary,
        "secondary_agents": [],
        "complexity": "simple",
        "workflow_pattern": "serial",
        "confidence": 0.9,
        "reply": reply,
    }


class TestChatMessage:
    @patch("src.api.routes.chat._get_llm_client")
    def test_send_message_creates_session(self, mock_get_client):
        mock_client = AsyncMock()
        mock_client.chat_json = AsyncMock(
            return_value=_mock_dispatch_intent("dispatch", "你好！有什么可以帮你的？")
        )
        mock_get_client.return_value = mock_client

        resp = client.post(
            "/api/chat/message",
            json={"user_id": "user_002", "message": "你好"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "session_id" in data
        assert "content" in data

    @patch("src.api.routes.chat._get_llm_client")
    def test_send_message_routes_to_agent(self, mock_get_client):
        mock_client = AsyncMock()
        # First chat_json call: DispatchAgent routes to "project"
        # Second chat_json call: ProjectAgent returns structured response
        mock_client.chat_json = AsyncMock(
            side_effect=[
                _mock_dispatch_intent("project"),
                {"reply": "项目进度一切正常。", "cards": []},
            ]
        )
        mock_client.chat = AsyncMock(return_value="项目进度一切正常。")
        mock_get_client.return_value = mock_client

        resp = client.post(
            "/api/chat/message",
            json={"user_id": "user_003", "message": "查看项目进度"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["agent_type"] == "project"
        assert "项目" in data["content"]

    @patch("src.api.routes.chat._get_llm_client")
    def test_send_message_reuses_existing_session(self, mock_get_client):
        mock_client = AsyncMock()
        mock_client.chat_json = AsyncMock(
            return_value=_mock_dispatch_intent("dispatch", "收到。")
        )
        mock_get_client.return_value = mock_client

        sess_resp = client.post("/api/chat/sessions", json={"user_id": "user_005"})
        session_id = sess_resp.json()["session_id"]

        resp1 = client.post(
            "/api/chat/message",
            json={"user_id": "user_005", "session_id": session_id, "message": "第一条"},
        )
        resp2 = client.post(
            "/api/chat/message",
            json={"user_id": "user_005", "session_id": session_id, "message": "第二条"},
        )
        assert resp1.json()["session_id"] == session_id
        assert resp2.json()["session_id"] == session_id


class TestChatValidation:
    """API-012/014: Chat input validation."""

    def test_empty_message_returns_422(self):
        resp = client.post(
            "/api/chat/message",
            json={"user_id": "user_v1", "message": ""},
        )
        assert resp.status_code == 422

    def test_blank_message_returns_422(self):
        resp = client.post(
            "/api/chat/message",
            json={"user_id": "user_v2", "message": "   "},
        )
        assert resp.status_code == 422

    def test_missing_user_id_returns_422(self):
        resp = client.post(
            "/api/chat/message",
            json={"message": "hello"},
        )
        assert resp.status_code == 422

    def test_overlong_message_returns_422(self):
        resp = client.post(
            "/api/chat/message",
            json={"user_id": "user_v3", "message": "a" * 5000},
        )
        assert resp.status_code == 422

    def test_simple_chat_empty_message_422(self):
        resp = client.post("/api/chat", json={"message": ""})
        assert resp.status_code == 422

    def test_simple_chat_overlong_422(self):
        resp = client.post("/api/chat", json={"message": "x" * 5000})
        assert resp.status_code == 422


class TestChatHealth:
    """Chat health endpoint."""

    def test_chat_health(self):
        resp = client.get("/api/chat/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "provider" in data
