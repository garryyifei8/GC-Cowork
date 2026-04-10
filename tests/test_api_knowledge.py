"""Tests for Knowledge base API endpoints.

Covers:
  - GET /api/knowledge/documents (list + filters)
  - GET /api/knowledge/documents/{id} (detail)
  - POST /api/knowledge/search (keyword search)
"""

import pytest


# ---------------------------------------------------------------------------
# List knowledge documents
# ---------------------------------------------------------------------------


def test_list_knowledge_documents_returns_data(client):
    """GET /api/knowledge/documents should return all knowledge documents."""
    response = client.get("/api/knowledge/documents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10  # Many seed documents


def test_list_knowledge_documents_response_schema(client):
    """Each knowledge document should have the required fields."""
    response = client.get("/api/knowledge/documents")
    assert response.status_code == 200
    data = response.json()
    required_fields = {"id", "title", "doc_type", "project_id", "content_summary", "version", "author", "status"}
    for doc in data:
        for field in required_fields:
            assert field in doc, f"Missing field: {field}"


def test_list_knowledge_documents_filter_by_type(client):
    """Filter by doc_type=template should return only template documents."""
    response = client.get("/api/knowledge/documents", params={"doc_type": "template"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    for doc in data:
        assert doc["doc_type"] == "template"


def test_list_knowledge_documents_filter_by_status(client):
    """Filter by status=final should return only finalized documents."""
    response = client.get("/api/knowledge/documents", params={"status": "final"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for doc in data:
        assert doc["status"] == "final"


def test_list_knowledge_documents_filter_by_draft(client):
    """Filter by status=draft should return only draft documents."""
    response = client.get("/api/knowledge/documents", params={"status": "draft"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for doc in data:
        assert doc["status"] == "draft"


# ---------------------------------------------------------------------------
# Get single knowledge document
# ---------------------------------------------------------------------------


def test_get_knowledge_document_by_id(client):
    """GET /api/knowledge/documents/{id} should return the correct document."""
    response = client.get("/api/knowledge/documents/doc-003")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "doc-003"
    assert data["doc_type"] == "template"
    assert data["status"] == "final"
    assert data["author"] == "李法务"


def test_get_knowledge_document_not_found(client):
    """GET /api/knowledge/documents/{id} with unknown id should raise error."""
    response = client.get("/api/knowledge/documents/nonexistent-doc-999")
    assert response.status_code != 200


# ---------------------------------------------------------------------------
# Knowledge search
# ---------------------------------------------------------------------------


def test_search_knowledge_returns_results(client):
    """POST /api/knowledge/search with valid query should return matching results."""
    payload = {"query": "EPC", "top_k": 10}
    response = client.post("/api/knowledge/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # "EPC" appears in multiple documents
    assert len(data) >= 1


def test_search_knowledge_result_schema(client):
    """Each search result should have the required fields including score."""
    payload = {"query": "合同", "top_k": 5}
    response = client.post("/api/knowledge/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    required_fields = {"id", "title", "doc_type", "content_summary", "author", "status", "score"}
    for item in data:
        for field in required_fields:
            assert field in item, f"Missing field: {field}"
        assert isinstance(item["score"], float)
        assert item["score"] > 0


def test_search_knowledge_top_k_limit(client):
    """top_k parameter should limit the number of results returned."""
    payload = {"query": "项目", "top_k": 3}
    response = client.post("/api/knowledge/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 3


def test_search_knowledge_no_match(client):
    """Search for completely unrelated term should return empty list."""
    payload = {"query": "zzz_totally_nonexistent_term_abc123", "top_k": 10}
    response = client.post("/api/knowledge/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_search_knowledge_missing_query(client):
    """POST /api/knowledge/search without query field should return 422."""
    response = client.post("/api/knowledge/search", json={})
    assert response.status_code == 422


def test_search_knowledge_category_filter(client):
    """Search with category filter should exclude non-matching doc_type."""
    # Search for "合同" but filter to only "proposal" type
    payload = {"query": "合同", "category": "proposal", "top_k": 10}
    response = client.post("/api/knowledge/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    # All returned items must be of type "proposal"
    for item in data:
        assert item["doc_type"] == "proposal"
