"""Tests for Legal/Contract management API endpoints.

Covers:
  - GET /api/legal/contracts (list + filters)
  - GET /api/legal/contracts/{id} (detail)
  - POST /api/legal/contracts (create)
  - PATCH /api/legal/contracts/{id} (update)
  - GET /api/legal/summary (aggregate statistics)
"""

import pytest


# ---------------------------------------------------------------------------
# List contracts
# ---------------------------------------------------------------------------


def test_list_contracts_returns_seed_data(client):
    """GET /api/legal/contracts should return all seeded contracts."""
    response = client.get("/api/legal/contracts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 8  # 8 seed contracts


def test_list_contracts_filter_by_status(client):
    """Filter by status=active should return only active contracts."""
    response = client.get("/api/legal/contracts", params={"status": "active"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for contract in data:
        assert contract["status"] == "active"


def test_list_contracts_filter_by_type(client):
    """Filter by contract_type=construction should return only construction contracts."""
    response = client.get("/api/legal/contracts", params={"contract_type": "construction"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for contract in data:
        assert contract["contract_type"] == "construction"


def test_list_contracts_filter_by_project_id(client):
    """Filter by project_id should return only contracts linked to that project."""
    response = client.get("/api/legal/contracts", params={"project_id": "PRJ-2024-001"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for contract in data:
        assert contract["project_id"] == "PRJ-2024-001"


# ---------------------------------------------------------------------------
# Get single contract
# ---------------------------------------------------------------------------


def test_get_contract_by_id(client):
    """GET /api/legal/contracts/{id} should return the correct contract."""
    response = client.get("/api/legal/contracts/CTR-2024-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "CTR-2024-001"
    assert data["contract_type"] == "construction"
    assert data["status"] == "active"
    assert data["risk_level"] == "high"
    assert isinstance(data["amount"], float)


def test_get_contract_not_found(client):
    """GET /api/legal/contracts/{id} with unknown id should return 404."""
    response = client.get("/api/legal/contracts/NONEXISTENT-999")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Create contract
# ---------------------------------------------------------------------------


def test_create_contract_success(client):
    """POST /api/legal/contracts should create and return a new contract with 201."""
    payload = {
        "title": "测试服务合同",
        "contract_type": "service",
        "party_a": "国债建设咨询有限公司",
        "party_b": "外部服务商",
        "project_id": "PRJ-TEST-001",
        "amount": 500000.0,
        "sign_date": "2026-04-01",
        "start_date": "2026-04-15",
        "end_date": "2027-04-14",
        "status": "draft",
        "risk_level": "low",
        "key_terms": "测试条款内容",
        "responsible": "测试负责人",
    }
    response = client.post("/api/legal/contracts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "测试服务合同"
    assert data["contract_type"] == "service"
    assert data["amount"] == 500000.0
    assert data["status"] == "draft"
    assert "id" in data


def test_create_contract_missing_required_fields(client):
    """POST /api/legal/contracts without required fields should return 422."""
    response = client.post("/api/legal/contracts", json={"title": "Incomplete Contract"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Update contract
# ---------------------------------------------------------------------------


def test_update_contract_success(client):
    """PATCH /api/legal/contracts/{id} should partially update a contract."""
    response = client.patch(
        "/api/legal/contracts/CTR-2024-002",
        json={"status": "completed", "risk_level": "medium"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["risk_level"] == "medium"
    assert data["id"] == "CTR-2024-002"


def test_update_contract_not_found(client):
    """PATCH /api/legal/contracts/{id} with unknown id should return 404."""
    response = client.patch(
        "/api/legal/contracts/NONEXISTENT-ID",
        json={"status": "terminated"},
    )
    assert response.status_code == 404


def test_update_contract_partial_fields(client):
    """PATCH should only change the provided fields, leaving others intact."""
    # First get the original
    original = client.get("/api/legal/contracts/CTR-2024-003").json()
    original_title = original["title"]
    original_party_b = original["party_b"]

    # Update only responsible
    response = client.patch(
        "/api/legal/contracts/CTR-2024-003",
        json={"responsible": "新负责人"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["responsible"] == "新负责人"
    assert data["title"] == original_title
    assert data["party_b"] == original_party_b


# ---------------------------------------------------------------------------
# Summary endpoint
# ---------------------------------------------------------------------------


def test_get_legal_summary(client):
    """GET /api/legal/summary should return aggregate statistics."""
    response = client.get("/api/legal/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "active" in data
    assert "expiring_soon" in data
    assert "total_amount" in data
    assert "by_type" in data
    assert "by_status" in data
    assert "high_risk_count" in data
    assert "expiring_soon_contracts" in data
    assert data["total"] >= 8
    assert data["total_amount"] > 0
    assert isinstance(data["by_type"], dict)
    assert isinstance(data["by_status"], dict)
    assert isinstance(data["high_risk_count"], int)
    assert isinstance(data["expiring_soon_contracts"], list)


def test_legal_summary_counts_consistency(client):
    """Verify summary counts are consistent with list results."""
    summary = client.get("/api/legal/summary").json()
    all_contracts = client.get("/api/legal/contracts").json()
    assert summary["total"] == len(all_contracts)

    active_contracts = client.get("/api/legal/contracts", params={"status": "active"}).json()
    assert summary["active"] == len(active_contracts)
