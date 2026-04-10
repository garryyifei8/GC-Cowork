"""
OA REST API endpoints.

GET    /api/oa/notices                   — list notices (?target_user=&type=&is_read=)
POST   /api/oa/notices                   — create notice
PATCH  /api/oa/notices/{id}             — update notice (mark read)

GET    /api/oa/vehicle-requests          — list vehicle requests (?applicant=&status=)
POST   /api/oa/vehicle-requests          — create vehicle request
PATCH  /api/oa/vehicle-requests/{id}    — approve / reject vehicle request
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.core.auth import require_auth
from src.core.models import ApprovalStatus
from src.stores.oa_store import (
    create_notice,
    create_vehicle_request,
    list_notices,
    list_vehicle_requests,
    update_notice,
    update_vehicle_request,
)

router = APIRouter(prefix="/oa", tags=["oa"], dependencies=[Depends(require_auth)])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class NoticeListItem(BaseModel):
    id: str
    title: str
    content: str
    type: str
    target_user: str | None
    is_read: bool
    created_at: str


class CreateNoticeRequest(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    type: str = "system"
    target_user: str | None = None


class UpdateNoticeRequest(BaseModel):
    is_read: bool | None = None
    title: str | None = None
    content: str | None = None


class VehicleRequestListItem(BaseModel):
    id: str
    applicant: str
    date: str
    origin: str
    destination: str
    reason: str
    status: str
    approver: str | None
    created_at: str


class CreateVehicleRequestBody(BaseModel):
    applicant: str = Field(min_length=1)
    date: str = Field(min_length=1)
    origin: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    reason: str = ""


class UpdateVehicleRequestBody(BaseModel):
    status: str | None = None
    approver: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _enum_val(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _to_notice_item(n) -> NoticeListItem:
    return NoticeListItem(
        id=n.id,
        title=n.title,
        content=n.content,
        type=_enum_val(n.type),
        target_user=n.target_user,
        is_read=n.is_read,
        created_at=n.created_at.isoformat() if hasattr(n.created_at, "isoformat") else str(n.created_at),
    )


def _to_vehicle_item(v) -> VehicleRequestListItem:
    return VehicleRequestListItem(
        id=v.id,
        applicant=v.applicant,
        date=v.date,
        origin=v.origin,
        destination=v.destination,
        reason=v.reason,
        status=_enum_val(v.status),
        approver=v.approver,
        created_at=v.created_at.isoformat() if hasattr(v.created_at, "isoformat") else str(v.created_at),
    )


# ---------------------------------------------------------------------------
# Notice endpoints
# ---------------------------------------------------------------------------


@router.get("/notices", response_model=list[NoticeListItem])
async def list_notices_endpoint(
    target_user: str | None = None,
    type: str | None = None,
    is_read: bool | None = None,
):
    notices = list_notices(target_user=target_user, notice_type=type, is_read=is_read)
    return [_to_notice_item(n) for n in notices]


@router.post("/notices", response_model=NoticeListItem, status_code=201)
async def create_notice_endpoint(req: CreateNoticeRequest):
    notice = create_notice(req.model_dump())
    return _to_notice_item(notice)


@router.patch("/notices/{notice_id}", response_model=NoticeListItem)
async def update_notice_endpoint(notice_id: str, req: UpdateNoticeRequest):
    updates = req.model_dump(exclude_none=True)
    updated = update_notice(notice_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Notice {notice_id} not found")
    return _to_notice_item(updated)


# ---------------------------------------------------------------------------
# Vehicle request endpoints
# ---------------------------------------------------------------------------


@router.get("/vehicle-requests", response_model=list[VehicleRequestListItem])
async def list_vehicle_requests_endpoint(
    applicant: str | None = None,
    status: str | None = None,
):
    requests = list_vehicle_requests(applicant=applicant, status=status)
    return [_to_vehicle_item(v) for v in requests]


@router.post("/vehicle-requests", response_model=VehicleRequestListItem, status_code=201)
async def create_vehicle_request_endpoint(req: CreateVehicleRequestBody):
    vr = create_vehicle_request(req.model_dump())
    return _to_vehicle_item(vr)


@router.patch("/vehicle-requests/{request_id}", response_model=VehicleRequestListItem)
async def update_vehicle_request_endpoint(request_id: str, req: UpdateVehicleRequestBody):
    updates = req.model_dump(exclude_none=True)
    if "status" in updates:
        try:
            updates["status"] = ApprovalStatus(updates["status"])
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{updates['status']}'. Valid: {[s.value for s in ApprovalStatus]}",
            )
    updated = update_vehicle_request(request_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Vehicle request {request_id} not found")
    return _to_vehicle_item(updated)
