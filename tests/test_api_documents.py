"""Tests for Document management API endpoints.

Covers:
  - GET /api/documents (list + filters)
  - GET /api/documents/{id} (detail)
  - POST /api/documents (create)
  - PATCH /api/documents/{id} (update)
  - DELETE /api/documents/{id} (delete)
  - POST /api/documents/upload (file upload)
"""

import io
import pytest


# ---------------------------------------------------------------------------
# List documents
# ---------------------------------------------------------------------------


def test_list_documents_returns_seed_data(client):
    """GET /api/documents should return all seeded documents."""
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10  # Many seed documents


def test_list_documents_filter_by_project_id(client):
    """Filter by project_id should return only documents for that project."""
    response = client.get("/api/documents", params={"project_id": "proj-001"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 10  # Many proj-001 documents
    for doc in data:
        assert doc["project_id"] == "proj-001"


def test_list_documents_filter_by_doc_type(client):
    """Filter by doc_type=template should return only templates."""
    response = client.get("/api/documents", params={"doc_type": "template"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    for doc in data:
        assert doc["doc_type"] == "template"


def test_list_documents_filter_by_status(client):
    """Filter by status=final should return only finalized documents."""
    response = client.get("/api/documents", params={"status": "final"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for doc in data:
        assert doc["status"] == "final"


def test_list_documents_filter_by_category(client):
    """Filter by category=design should return only design documents."""
    response = client.get("/api/documents", params={"category": "design"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    for doc in data:
        assert doc["category"] == "design"


def test_list_documents_response_schema(client):
    """Each document should have the required fields."""
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    required_fields = {"id", "title", "doc_type", "project_id", "content_summary", "version", "author", "status", "category"}
    for doc in data:
        for field in required_fields:
            assert field in doc, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# Get single document
# ---------------------------------------------------------------------------


def test_get_document_by_id(client):
    """GET /api/documents/{id} should return the correct document."""
    response = client.get("/api/documents/doc-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "doc-001"
    assert data["project_id"] == "proj-001"
    assert data["doc_type"] == "report"
    assert data["author"] == "王项目"


def test_get_document_not_found(client):
    """GET /api/documents/{id} with unknown id should raise error (not 200)."""
    response = client.get("/api/documents/nonexistent-doc-999")
    assert response.status_code != 200


# ---------------------------------------------------------------------------
# Create document
# ---------------------------------------------------------------------------


def test_create_document_success(client):
    """POST /api/documents should create and return a new document."""
    payload = {
        "title": "测试文档标题",
        "doc_type": "report",
        "project_id": "proj-test",
        "content_summary": "这是测试文档的摘要",
        "version": "1.0",
        "author": "测试作者",
        "category": "general",
    }
    response = client.post("/api/documents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "测试文档标题"
    assert data["doc_type"] == "report"
    assert data["author"] == "测试作者"
    assert data["status"] == "draft"  # Default status on create
    assert "id" in data


def test_create_document_minimal_required(client):
    """POST /api/documents with only title should succeed with defaults."""
    payload = {"title": "最简测试文档"}
    response = client.post("/api/documents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "最简测试文档"
    assert data["doc_type"] == "report"  # Default


def test_create_document_missing_title(client):
    """POST /api/documents without title should return 422."""
    response = client.post("/api/documents", json={})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Update document
# ---------------------------------------------------------------------------


def test_update_document_success(client):
    """PATCH /api/documents/{id} should partially update the document."""
    response = client.patch(
        "/api/documents/doc-001",
        json={"status": "review", "version": "1.3"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "review"
    assert data["version"] == "1.3"
    assert data["id"] == "doc-001"


def test_update_document_not_found(client):
    """PATCH /api/documents/{id} with unknown id should raise error (not 200)."""
    response = client.patch(
        "/api/documents/nonexistent-id",
        json={"status": "final"},
    )
    assert response.status_code != 200


def test_update_document_category(client):
    """PATCH should allow updating category."""
    response = client.patch(
        "/api/documents/doc-002",
        json={"category": "quality"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "quality"


# ---------------------------------------------------------------------------
# Delete document
# ---------------------------------------------------------------------------


def test_delete_document_success(client):
    """DELETE /api/documents/{id} should delete the document."""
    # First confirm it exists
    get_resp = client.get("/api/documents/doc-004")
    assert get_resp.status_code == 200

    # Delete it
    delete_resp = client.delete("/api/documents/doc-004")
    assert delete_resp.status_code == 200
    result = delete_resp.json()
    assert result.get("ok") is True

    # Verify it's gone
    after_resp = client.get("/api/documents/doc-004")
    assert after_resp.status_code != 200


def test_delete_document_not_found(client):
    """DELETE /api/documents/{id} with unknown id should raise error (not 200)."""
    response = client.delete("/api/documents/nonexistent-doc-999")
    assert response.status_code != 200


# ---------------------------------------------------------------------------
# File upload endpoint
# ---------------------------------------------------------------------------


def test_upload_document_success(client):
    """POST /api/documents/upload should accept a multipart file upload."""
    file_content = b"This is a test file content"
    response = client.post(
        "/api/documents/upload",
        data={
            "title": "上传测试文档",
            "doc_type": "report",
            "project_id": "proj-001",
            "author": "上传测试者",
            "category": "general",
        },
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "上传测试文档"
    assert data["status"] == "draft"
    assert "id" in data
    assert "test.txt" in data["content_summary"] or "上传文件" in data["content_summary"]


def test_upload_document_uses_filename_as_title(client):
    """POST /api/documents/upload without title should use filename as title."""
    file_content = b"Another file content"
    response = client.post(
        "/api/documents/upload",
        data={},
        files={"file": ("my_document.pdf", io.BytesIO(file_content), "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "my_document.pdf"
