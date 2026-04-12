"""Tests for observability stack."""

from unittest.mock import patch


class TestMetricsEndpoint:
    def test_metrics_returns_prometheus_format(self, client):
        # Make a request first to generate metrics
        client.get("/api/health")

        resp = client.get("/api/metrics")
        assert resp.status_code == 200
        assert "text/plain" in resp.headers["content-type"]
        body = resp.text
        assert "http_requests_total" in body
        assert "http_request_duration_seconds" in body

    def test_metrics_records_requests(self, client):
        from src.api.routes.metrics import _request_count

        _request_count.clear()

        client.get("/api/health")
        client.get("/api/health")

        resp = client.get("/api/metrics")
        assert resp.status_code == 200
        assert "http_requests_total" in resp.text


class TestRequestIdMiddleware:
    def test_response_includes_request_id(self, client):
        resp = client.get("/api/health")
        assert "x-request-id" in resp.headers

    def test_custom_request_id_preserved(self, client):
        resp = client.get("/api/health", headers={"x-request-id": "test-123"})
        assert resp.headers["x-request-id"] == "test-123"


class TestSentrySetup:
    def test_sentry_not_initialized_without_dsn(self):
        from src.core.observability import setup_sentry

        with patch.dict("os.environ", {}, clear=False):
            import os

            os.environ.pop("SENTRY_DSN", None)
            # Should not raise
            setup_sentry()

    def test_sentry_initialized_with_dsn(self):
        from src.core.observability import setup_sentry

        with patch("sentry_sdk.init") as mock_init:
            with patch.dict("os.environ", {"SENTRY_DSN": "https://fake@sentry.io/123"}):
                setup_sentry()
                mock_init.assert_called_once()
