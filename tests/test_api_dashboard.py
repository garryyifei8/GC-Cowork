"""Tests for Dashboard metrics API endpoints.

Covers:
  - GET /api/dashboard/metrics (aggregate project/task metrics)
  - GET /api/dashboard/suggestions (AI-powered suggestions)
"""

import pytest


# ---------------------------------------------------------------------------
# Dashboard metrics
# ---------------------------------------------------------------------------


def test_get_dashboard_metrics_success(client):
    """GET /api/dashboard/metrics should return 200 with expected structure."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_projects" in data
    assert "active_projects" in data
    assert "at_risk_projects" in data
    assert "completed_projects" in data
    assert "total_tasks" in data
    assert "overdue_tasks" in data
    assert "completion_rate" in data
    assert "stage_distribution" in data
    assert "task_status_distribution" in data
    assert "budget_summary" in data
    assert "project_risks" in data
    assert "ai_insights" in data


def test_dashboard_metrics_project_counts(client):
    """Project counts should be non-negative integers summing consistently."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] >= 0
    assert data["active_projects"] >= 0
    assert data["at_risk_projects"] >= 0
    assert data["completed_projects"] >= 0
    # active + at_risk + completed should not exceed total (some may be in other states)
    assert data["active_projects"] + data["at_risk_projects"] + data["completed_projects"] <= data["total_projects"]


def test_dashboard_metrics_completion_rate_range(client):
    """Completion rate should be between 0 and 100."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert 0.0 <= data["completion_rate"] <= 100.0


def test_dashboard_metrics_stage_distribution(client):
    """Stage distribution should be a dict with string keys and int values."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    stage_dist = data["stage_distribution"]
    assert isinstance(stage_dist, dict)
    for key, val in stage_dist.items():
        assert isinstance(key, str)
        assert isinstance(val, int)
        assert val >= 0


def test_dashboard_metrics_project_risks(client):
    """project_risks should be a list with required fields."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    risks = data["project_risks"]
    assert isinstance(risks, list)
    for risk in risks:
        assert "project_id" in risk
        assert "project_name" in risk
        assert "risk_score" in risk
        assert "risk_level" in risk
        assert "top_risk" in risk
        assert isinstance(risk["risk_score"], float)


def test_dashboard_metrics_budget_summary(client):
    """budget_summary should have project_id and project_name fields."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    budget_summary = data["budget_summary"]
    assert isinstance(budget_summary, list)
    for item in budget_summary:
        assert "project_id" in item
        assert "project_name" in item


def test_dashboard_metrics_task_status_distribution(client):
    """task_status_distribution should be a dict with int values."""
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    status_dist = data["task_status_distribution"]
    assert isinstance(status_dist, dict)
    for key, val in status_dist.items():
        assert isinstance(val, int)
        assert val >= 0


# ---------------------------------------------------------------------------
# Suggestions endpoint
# ---------------------------------------------------------------------------


def test_get_suggestions_returns_list(client):
    """GET /api/dashboard/suggestions should return a list."""
    response = client.get("/api/dashboard/suggestions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_suggestions_schema(client):
    """Each suggestion item should have the required fields."""
    response = client.get("/api/dashboard/suggestions")
    assert response.status_code == 200
    data = response.json()
    required_fields = {"id", "type", "title", "description", "priority", "suggested_action"}
    for item in data:
        for field in required_fields:
            assert field in item, f"Missing field in suggestion: {field}"
        assert "action_type" in item["suggested_action"]
