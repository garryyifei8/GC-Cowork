"""API tests for Settings (LLM providers) endpoints."""
import pytest


class TestListProviders:
    def test_list_providers(self, client):
        resp = client.get("/api/settings/llm/providers")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # deepseek, qwq-32b, qwen3-8b

    def test_provider_schema(self, client):
        resp = client.get("/api/settings/llm/providers")
        item = resp.json()[0]
        for key in ("id", "name", "model", "api_base", "description", "is_local", "is_active"):
            assert key in item

    def test_exactly_one_active(self, client):
        resp = client.get("/api/settings/llm/providers")
        active = [p for p in resp.json() if p["is_active"]]
        assert len(active) == 1


class TestActiveProvider:
    def test_get_active(self, client):
        resp = client.get("/api/settings/llm/active")
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "name" in data
        assert "model" in data


class TestSwitchProvider:
    def test_switch_valid(self, client):
        resp = client.post("/api/settings/llm/switch", json={"provider_id": "deepseek"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["active_provider"] == "deepseek"

    def test_switch_invalid(self, client):
        resp = client.post("/api/settings/llm/switch", json={"provider_id": "nonexistent"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False


class TestAddProvider:
    def test_add_new_provider(self, client):
        resp = client.post(
            "/api/settings/llm/providers",
            json={
                "id": "test-provider",
                "name": "Test Provider",
                "model": "test-model",
                "api_base": "http://localhost:9999",
                "api_key": "test-key",
                "description": "Test",
                "is_local": True,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "test-provider"
        assert data["is_active"] is False

    def test_add_duplicate_updates(self, client):
        # Add first
        client.post(
            "/api/settings/llm/providers",
            json={
                "id": "dup-test",
                "name": "Original",
                "model": "m1",
                "api_base": "http://localhost:1",
            },
        )
        # Add same ID with different name → update
        resp = client.post(
            "/api/settings/llm/providers",
            json={
                "id": "dup-test",
                "name": "Updated",
                "model": "m2",
                "api_base": "http://localhost:2",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"


class TestDeleteProvider:
    def test_delete_non_active(self, client):
        # Add a provider first
        client.post(
            "/api/settings/llm/providers",
            json={
                "id": "to-delete",
                "name": "Delete Me",
                "model": "x",
                "api_base": "http://localhost:1",
            },
        )
        resp = client.delete("/api/settings/llm/providers/to-delete")
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_delete_active_fails(self, client):
        # Get active provider ID
        active = client.get("/api/settings/llm/active").json()["id"]
        resp = client.delete(f"/api/settings/llm/providers/{active}")
        assert resp.status_code == 200
        assert resp.json()["success"] is False
