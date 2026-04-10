"""Tests for Supervision (监理) API endpoints.

Covers:
  - GET /api/supervision/records (list + filters)
  - GET /api/supervision/records/{id} (detail)
  - POST /api/supervision/records (create)
  - PATCH /api/supervision/records/{id} (update)
  - GET /api/supervision/summary (aggregate statistics)
"""

import pytest


# ---------------------------------------------------------------------------
# List records
# ---------------------------------------------------------------------------


def test_list_supervision_records_returns_seed_data(client):
    """GET /api/supervision/records should return all seeded records."""
    response = client.get("/api/supervision/records")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 8  # 8 seed records
    assert len(data["items"]) == data["total"]


def test_list_records_filter_by_project_id(client):
    """Filter by project_id should return only records for that project."""
    response = client.get("/api/supervision/records", params={"project_id": "proj-001"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 4  # 4 seed records for proj-001
    for item in data["items"]:
        assert item["project_id"] == "proj-001"


def test_list_records_filter_by_record_type(client):
    """Filter by record_type=patrol should return only patrol records."""
    response = client.get("/api/supervision/records", params={"record_type": "patrol"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 3
    for item in data["items"]:
        assert item["record_type"] == "patrol"


def test_list_records_filter_by_status(client):
    """Filter by status=issue should return only records with issues."""
    response = client.get("/api/supervision/records", params={"status": "issue"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    for item in data["items"]:
        assert item["status"] == "issue"


# ---------------------------------------------------------------------------
# Get single record
# ---------------------------------------------------------------------------


def test_get_supervision_record_by_id(client):
    """GET /api/supervision/records/{id} should return the correct record."""
    response = client.get("/api/supervision/records/sup-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "sup-001"
    assert data["project_id"] == "proj-001"
    assert data["record_type"] == "patrol"
    assert data["inspector"] == "王建国"
    assert isinstance(data["issues_found"], int)
    assert isinstance(data["photos"], list)


def test_get_supervision_record_not_found(client):
    """GET /api/supervision/records/{id} with unknown id should return 404."""
    response = client.get("/api/supervision/records/nonexistent-sup-999")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Create record
# ---------------------------------------------------------------------------


def test_create_supervision_record_success(client):
    """POST /api/supervision/records should create and return a new record with 201."""
    payload = {
        "project_id": "proj-004",
        "record_type": "witness",
        "title": "新测试旁站记录",
        "date": "2026-04-06",
        "inspector": "测试监理员",
        "location": "测试施工现场",
        "content": "对测试施工工序进行旁站监督，施工质量合格",
        "status": "normal",
        "issues_found": 0,
        "photos": [],
    }
    response = client.post("/api/supervision/records", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == "proj-004"
    assert data["record_type"] == "witness"
    assert data["title"] == "新测试旁站记录"
    assert data["inspector"] == "测试监理员"
    assert "id" in data


def test_create_supervision_record_missing_required(client):
    """POST /api/supervision/records without required fields should return 422."""
    response = client.post("/api/supervision/records", json={"title": "Incomplete"})
    assert response.status_code == 422


def test_create_supervision_record_with_issues(client):
    """POST should persist issues_found and photos correctly."""
    payload = {
        "project_id": "proj-002",
        "record_type": "issue",
        "title": "发现质量问题记录",
        "date": "2026-04-05",
        "inspector": "质量检查员",
        "location": "施工区域B",
        "content": "发现若干质量隐患",
        "status": "issue",
        "issues_found": 5,
        "photos": ["photo1.jpg", "photo2.jpg"],
    }
    response = client.post("/api/supervision/records", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "issue"
    assert data["issues_found"] == 5
    assert len(data["photos"]) == 2


# ---------------------------------------------------------------------------
# Update record
# ---------------------------------------------------------------------------


def test_update_supervision_record_success(client):
    """PATCH /api/supervision/records/{id} should partially update the record."""
    response = client.patch(
        "/api/supervision/records/sup-003",
        json={"status": "resolved"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "resolved"
    assert data["id"] == "sup-003"


def test_update_supervision_record_not_found(client):
    """PATCH /api/supervision/records/{id} with unknown id should return 404."""
    response = client.patch(
        "/api/supervision/records/nonexistent-id",
        json={"status": "resolved"},
    )
    assert response.status_code == 404


def test_update_supervision_record_multiple_fields(client):
    """PATCH should update multiple fields simultaneously."""
    response = client.patch(
        "/api/supervision/records/sup-005",
        json={"status": "resolved", "issues_found": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "resolved"
    assert data["issues_found"] == 0


# ---------------------------------------------------------------------------
# Summary endpoint
# ---------------------------------------------------------------------------


def test_get_supervision_summary(client):
    """GET /api/supervision/summary should return aggregate statistics."""
    response = client.get("/api/supervision/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "issues_open" in data
    assert "issues_resolved" in data
    assert "issues_closed" in data
    assert "inspections_this_month" in data
    assert "total_issues_found" in data
    assert "by_type" in data
    assert data["total"] >= 8
    assert isinstance(data["by_type"], dict)


def test_supervision_summary_project_scoped(client):
    """GET /api/supervision/summary?project_id= should scope to that project."""
    response = client.get("/api/supervision/summary", params={"project_id": "proj-001"})
    assert response.status_code == 200
    data = response.json()
    # proj-001 has 4 seed records
    assert data["total"] == 4


def test_supervision_summary_total_matches_list(client):
    """Verify summary total matches the full list count."""
    summary = client.get("/api/supervision/summary").json()
    all_records = client.get("/api/supervision/records").json()
    assert summary["total"] == all_records["total"]
