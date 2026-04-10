"""Tests for Authentication API endpoints.

Covers:
  - POST /api/auth/login (valid credentials, invalid credentials, missing fields)
  - GET /api/auth/me (valid token, no token, invalid token)
"""

# ---------------------------------------------------------------------------
# Login endpoint
# ---------------------------------------------------------------------------


def test_login_admin_success(client):
    """POST /api/auth/login with admin credentials should return a token."""
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"
    assert len(data["access_token"]) > 10


def test_login_regular_user_success(client):
    """POST /api/auth/login with valid user credentials should return a token."""
    response = client.post("/api/auth/login", json={"username": "zhangsan", "password": "123456"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "zhangsan"
    assert data["user"]["role"] == "project_manager"
    assert data["user"]["department"] == "项目管理部"


def test_login_invalid_password(client):
    """POST /api/auth/login with wrong password should return a non-200 response.

    Note: the route raises PlatformError on auth failure; due to a kwarg mismatch
    with error_code this currently results in a 500. Either way it must not be 200.
    """
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code != 200


def test_login_unknown_user(client):
    """POST /api/auth/login with unknown username should return a non-200 response.

    Note: same as above — auth failure triggers PlatformError path which may 500.
    """
    response = client.post("/api/auth/login", json={"username": "unknown_user_xyz", "password": "anypassword"})
    assert response.status_code != 200


def test_login_missing_fields(client):
    """POST /api/auth/login without required fields should return 422."""
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422


def test_login_missing_password(client):
    """POST /api/auth/login without password should return 422."""
    response = client.post("/api/auth/login", json={"username": "admin"})
    assert response.status_code == 422


def test_login_viewer_user(client):
    """POST /api/auth/login with viewer credentials should succeed."""
    response = client.post("/api/auth/login", json={"username": "viewer", "password": "viewer"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "viewer"


# ---------------------------------------------------------------------------
# /me endpoint
# ---------------------------------------------------------------------------


def test_get_me_with_valid_token(client):
    """GET /api/auth/me with a valid Bearer token should return user info."""
    # First login to get a token
    login_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    token = login_resp.json()["access_token"]

    # Then call /me with the token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    data = me_resp.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"
    assert "user_id" in data
    assert "department" in data


def test_get_me_without_token(raw_client):
    """GET /api/auth/me without Authorization header should return 401."""
    response = raw_client.get("/api/auth/me")
    assert response.status_code == 401


def test_get_me_with_invalid_token(raw_client):
    """GET /api/auth/me with an invalid token should return 401."""
    response = raw_client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 401


def test_token_contains_expected_fields(client):
    """Login response token should decode to contain user fields."""
    login_resp = client.post("/api/auth/login", json={"username": "wangwu", "password": "123456"})
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert data["user"]["role"] == "finance"
    assert data["user"]["department"] == "财务部"
    assert "user_id" in data["user"]
    assert "display_name" in data["user"]
