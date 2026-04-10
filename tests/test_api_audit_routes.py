"""Tests for Audit management API endpoints.

Covers:
  - GET /api/audit/reports (list + filters)
  - GET /api/audit/reports/{id} (detail)
  - POST /api/audit/reports (create)
  - PATCH /api/audit/reports/{id} (update)
  - GET /api/audit/summary (aggregate statistics)
"""

import pytest


# ---------------------------------------------------------------------------
# List reports
# ---------------------------------------------------------------------------


def test_list_audit_reports_returns_seed_data(client):
    """GET /api/audit/reports should return all seeded audit reports."""
    response = client.get("/api/audit/reports")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 6  # 6 seed audit reports


def test_list_audit_reports_filter_by_status(client):
    """Filter by status=in_progress should return only in-progress reports."""
    response = client.get("/api/audit/reports", params={"status": "in_progress"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    for report in data:
        assert report["status"] == "in_progress"


def test_list_audit_reports_filter_by_type(client):
    """Filter by audit_type=financial should return only financial audits."""
    response = client.get("/api/audit/reports", params={"audit_type": "financial"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for report in data:
        assert report["audit_type"] == "financial"


def test_list_audit_reports_filter_by_completed(client):
    """Filter by status=completed should return only completed reports."""
    response = client.get("/api/audit/reports", params={"status": "completed"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    for report in data:
        assert report["status"] == "completed"


# ---------------------------------------------------------------------------
# Get single report
# ---------------------------------------------------------------------------


def test_get_audit_report_by_id(client):
    """GET /api/audit/reports/{id} should return the correct audit report."""
    response = client.get("/api/audit/reports/audit-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "audit-001"
    assert data["audit_type"] == "financial"
    assert data["status"] == "completed"
    assert data["auditor"] == "王建国"
    assert isinstance(data["findings_count"], int)
    assert data["findings_count"] >= 0


def test_get_audit_report_not_found(client):
    """GET /api/audit/reports/{id} with unknown id should return 404."""
    response = client.get("/api/audit/reports/nonexistent-audit-999")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Create report
# ---------------------------------------------------------------------------


def test_create_audit_report_success(client):
    """POST /api/audit/reports should create and return a new report with 201."""
    payload = {
        "title": "新测试审计报告",
        "audit_type": "compliance",
        "project_id": "proj-test-001",
        "auditor": "测试审计员",
        "start_date": "2026-04-10",
        "status": "planned",
        "findings_count": 0,
        "risk_level": "low",
        "summary": "这是一份测试审计报告的摘要内容",
    }
    response = client.post("/api/audit/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "新测试审计报告"
    assert data["audit_type"] == "compliance"
    assert data["status"] == "planned"
    assert data["auditor"] == "测试审计员"
    assert "id" in data


def test_create_audit_report_missing_required_fields(client):
    """POST /api/audit/reports without required fields should return 422."""
    response = client.post("/api/audit/reports", json={"title": "Incomplete"})
    assert response.status_code == 422


def test_create_audit_report_with_end_date(client):
    """POST /api/audit/reports with end_date set should persist it."""
    payload = {
        "title": "已完成审计报告",
        "audit_type": "safety",
        "auditor": "安全审计员",
        "start_date": "2026-03-01",
        "end_date": "2026-03-20",
        "status": "completed",
        "findings_count": 3,
        "risk_level": "medium",
        "summary": "安全审计已完成",
    }
    response = client.post("/api/audit/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["end_date"] == "2026-03-20"
    assert data["status"] == "completed"


# ---------------------------------------------------------------------------
# Update report
# ---------------------------------------------------------------------------


def test_update_audit_report_success(client):
    """PATCH /api/audit/reports/{id} should partially update the report."""
    response = client.patch(
        "/api/audit/reports/audit-006",
        json={"status": "in_progress", "findings_count": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"
    assert data["findings_count"] == 2
    assert data["id"] == "audit-006"


def test_update_audit_report_not_found(client):
    """PATCH /api/audit/reports/{id} with unknown id should return 404."""
    response = client.patch(
        "/api/audit/reports/nonexistent-report",
        json={"status": "completed"},
    )
    assert response.status_code == 404


def test_update_audit_report_risk_level(client):
    """PATCH should allow updating risk_level."""
    response = client.patch(
        "/api/audit/reports/audit-004",
        json={"risk_level": "critical"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "critical"


# ---------------------------------------------------------------------------
# Summary endpoint
# ---------------------------------------------------------------------------


def test_get_audit_summary(client):
    """GET /api/audit/summary should return aggregate statistics."""
    response = client.get("/api/audit/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "in_progress" in data
    assert "findings_count" in data
    assert "compliance_rate" in data
    assert data["total"] >= 6
    assert isinstance(data["in_progress"], int)
    assert isinstance(data["findings_count"], int)
    assert 0.0 <= data["compliance_rate"] <= 1.0


def test_audit_summary_total_matches_list(client):
    """Verify summary total matches the list count."""
    summary = client.get("/api/audit/summary").json()
    all_reports = client.get("/api/audit/reports").json()
    assert summary["total"] == len(all_reports)


def test_audit_summary_in_progress_count(client):
    """Verify in_progress count in summary matches filtered list."""
    summary = client.get("/api/audit/summary").json()
    in_progress = client.get("/api/audit/reports", params={"status": "in_progress"}).json()
    assert summary["in_progress"] == len(in_progress)
