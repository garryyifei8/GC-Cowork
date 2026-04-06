"""Authentication middleware with JWT tokens.

Integrates with the existing PermissionEngine from permissions.py.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

JWT_SECRET = os.environ.get("JWT_SECRET", "avocado-cowork-dev-secret-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "24"))

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class UserToken(BaseModel):
    """Decoded JWT payload."""

    user_id: str
    username: str
    role: str  # admin | project_manager | engineer | finance | hr | legal | viewer
    department: str = ""
    exp: float = 0


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


# ---------------------------------------------------------------------------
# Built-in users (dev/demo only — replace with DB in production)
# ---------------------------------------------------------------------------

_DEMO_USERS: dict[str, dict[str, Any]] = {
    "admin": {
        "user_id": "user-001",
        "username": "admin",
        "password": "admin123",
        "role": "admin",
        "department": "管理层",
        "display_name": "系统管理员",
    },
    "zhangsan": {
        "user_id": "user-002",
        "username": "zhangsan",
        "password": "123456",
        "role": "project_manager",
        "department": "项目管理部",
        "display_name": "张工",
    },
    "lisi": {
        "user_id": "user-003",
        "username": "lisi",
        "password": "123456",
        "role": "engineer",
        "department": "技术部",
        "display_name": "李设计",
    },
    "wangwu": {
        "user_id": "user-004",
        "username": "wangwu",
        "password": "123456",
        "role": "finance",
        "department": "财务部",
        "display_name": "王财务",
    },
    "viewer": {
        "user_id": "user-005",
        "username": "viewer",
        "password": "viewer",
        "role": "viewer",
        "department": "",
        "display_name": "访客",
    },
}

# ---------------------------------------------------------------------------
# Token generation / verification
# ---------------------------------------------------------------------------


def create_token(user_id: str, username: str, role: str, department: str = "") -> str:
    """Create a JWT access token."""
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "department": department,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> UserToken:
    """Decode and validate a JWT token. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return UserToken(**payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的Token")


# ---------------------------------------------------------------------------
# Authentication function
# ---------------------------------------------------------------------------


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    """Authenticate a user and return their info, or None if invalid."""
    user = _DEMO_USERS.get(username)
    if user and user["password"] == password:
        return {k: v for k, v in user.items() if k != "password"}
    return None


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> UserToken | None:
    """Extract and validate user from Authorization header.

    Returns None if no token is provided (allows anonymous access for
    endpoints that don't require auth). Endpoints that require auth
    should use `require_auth` instead.
    """
    if credentials is None:
        return None
    return decode_token(credentials.credentials)


async def require_auth(
    user: UserToken | None = Depends(get_current_user),
) -> UserToken:
    """Dependency that requires authentication."""
    if user is None:
        raise HTTPException(status_code=401, detail="请先登录")
    return user


def require_role(*roles: str):
    """Dependency factory that requires specific roles."""

    async def _check(user: UserToken = Depends(require_auth)) -> UserToken:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="权限不足")
        return user

    return _check
