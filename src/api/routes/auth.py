"""Authentication API routes — login, current user, token refresh."""

from fastapi import APIRouter, Depends

from src.core.auth import (
    LoginRequest,
    LoginResponse,
    UserToken,
    authenticate_user,
    create_token,
    require_auth,
)
from src.core.exceptions import PlatformError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """Authenticate user and return JWT token."""
    user = authenticate_user(req.username, req.password)
    if not user:
        raise PlatformError(
            "用户名或密码错误",
            detail={"username": req.username},
        )
    token = create_token(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
        department=user.get("department", ""),
    )
    return LoginResponse(
        access_token=token,
        user={
            "user_id": user["user_id"],
            "username": user["username"],
            "role": user["role"],
            "department": user.get("department", ""),
            "display_name": user.get("display_name", user["username"]),
        },
    )


@router.get("/me")
async def get_current_user_info(user: UserToken = Depends(require_auth)):
    """Return current authenticated user info."""
    return {
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
        "department": user.department,
    }
