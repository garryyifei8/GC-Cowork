"""Tests for OA (Office Automation) API endpoints.

Covers:
  - GET /api/oa/notices (list + filters)
  - POST /api/oa/notices (create)
  - PATCH /api/oa/notices/{id} (update)
  - GET /api/oa/vehicle-requests (list + filters)
  - POST /api/oa/vehicle-requests (create)
  - PATCH /api/oa/vehicle-requests/{id} (update / status transition)
"""

import pytest


# ---------------------------------------------------------------------------
# Notice tests
# ---------------------------------------------------------------------------


def test_list_notices_returns_all_seed_data(client):
    """GET /api/oa/notices should return all seeded notices."""
    response = client.get("/api/oa/notices")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 7  # 7 seed notices


def test_list_notices_filter_by_target_user(client):
    """Filter notices by target_user should include broadcasts + targeted."""
    response = client.get("/api/oa/notices", params={"target_user": "emp-001"})
    assert response.status_code == 200
    data = response.json()
    # Each notice should be either a broadcast (target_user is None) or targeted at emp-001
    for notice in data:
        assert notice["target_user"] is None or notice["target_user"] == "emp-001"


def test_list_notices_filter_by_type(client):
    """Filter notices by type should only return matching type."""
    response = client.get("/api/oa/notices", params={"type": "system"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for notice in data:
        assert notice["type"] == "system"


def test_list_notices_filter_by_is_read(client):
    """Filter by is_read=true should return only read notices."""
    response = client.get("/api/oa/notices", params={"is_read": "true"})
    assert response.status_code == 200
    data = response.json()
    for notice in data:
        assert notice["is_read"] is True


def test_create_notice_success(client):
    """POST /api/oa/notices should create a new notice and return 201."""
    payload = {
        "title": "测试公告",
        "content": "这是一条测试公告内容",
        "type": "announcement",
        "target_user": "emp-099",
    }
    response = client.post("/api/oa/notices", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "测试公告"
    assert data["type"] == "announcement"
    assert data["target_user"] == "emp-099"
    assert data["is_read"] is False
    assert "id" in data


def test_create_notice_missing_required_fields(client):
    """POST /api/oa/notices without required fields should return 422."""
    response = client.post("/api/oa/notices", json={})
    assert response.status_code == 422


def test_update_notice_mark_as_read(client):
    """PATCH /api/oa/notices/{id} should update is_read flag."""
    response = client.patch("/api/oa/notices/notice-004", json={"is_read": True})
    assert response.status_code == 200
    data = response.json()
    assert data["is_read"] is True
    assert data["id"] == "notice-004"


def test_update_notice_not_found(client):
    """PATCH /api/oa/notices/{id} with unknown id should return 404."""
    response = client.patch("/api/oa/notices/nonexistent-id", json={"is_read": True})
    assert response.status_code == 404


def test_update_notice_title(client):
    """PATCH /api/oa/notices/{id} should allow updating title and content."""
    response = client.patch(
        "/api/oa/notices/notice-001",
        json={"title": "更新后的标题", "content": "更新后的内容"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "更新后的标题"
    assert data["content"] == "更新后的内容"


# ---------------------------------------------------------------------------
# Vehicle request tests
# ---------------------------------------------------------------------------


def test_list_vehicle_requests_returns_all(client):
    """GET /api/oa/vehicle-requests should return all seeded requests."""
    response = client.get("/api/oa/vehicle-requests")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # 3 seed vehicle requests


def test_list_vehicle_requests_filter_by_applicant(client):
    """Filter by applicant should only return matching records."""
    response = client.get("/api/oa/vehicle-requests", params={"applicant": "emp-001"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for vr in data:
        assert vr["applicant"] == "emp-001"


def test_list_vehicle_requests_filter_by_status(client):
    """Filter by status=pending should return only pending requests."""
    response = client.get("/api/oa/vehicle-requests", params={"status": "pending"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for vr in data:
        assert vr["status"] == "pending"


def test_create_vehicle_request_success(client):
    """POST /api/oa/vehicle-requests should create a new request and return 201."""
    payload = {
        "applicant": "emp-010",
        "date": "2026-04-20",
        "origin": "公司总部",
        "destination": "客户现场",
        "reason": "项目对接会议",
    }
    response = client.post("/api/oa/vehicle-requests", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["applicant"] == "emp-010"
    assert data["date"] == "2026-04-20"
    assert data["status"] == "pending"
    assert "id" in data


def test_create_vehicle_request_missing_fields(client):
    """POST /api/oa/vehicle-requests without required fields should return 422."""
    response = client.post("/api/oa/vehicle-requests", json={"applicant": "emp-010"})
    assert response.status_code == 422


def test_update_vehicle_request_approve(client):
    """PATCH /api/oa/vehicle-requests/{id} should allow approving a request."""
    response = client.patch(
        "/api/oa/vehicle-requests/veh-002",
        json={"status": "approved", "approver": "主任领导"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["approver"] == "主任领导"


def test_update_vehicle_request_invalid_status(client):
    """PATCH with invalid status value should return 400."""
    response = client.patch(
        "/api/oa/vehicle-requests/veh-002",
        json={"status": "invalid_status"},
    )
    assert response.status_code == 400


def test_update_vehicle_request_not_found(client):
    """PATCH with unknown id should return 404."""
    response = client.patch(
        "/api/oa/vehicle-requests/nonexistent-veh",
        json={"status": "approved"},
    )
    assert response.status_code == 404
