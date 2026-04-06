"""Supervision (监理) API routes."""

import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.core.exceptions import PlatformError
from src.stores.supervision_store import (
    RecordStatus,
    RecordType,
    SupervisionRecord,
    create_record,
    get_record,
    get_supervision_summary,
    list_records,
    update_record,
)

router = APIRouter(prefix="/supervision", tags=["supervision"])


class CreateRecordRequest(BaseModel):
    project_id: str
    record_type: RecordType
    title: str
    date: datetime.date
    inspector: str
    location: str
    content: str
    status: RecordStatus = "normal"
    issues_found: int = 0
    photos: list[str] = Field(default_factory=list)


class UpdateRecordRequest(BaseModel):
    title: str | None = None
    record_type: RecordType | None = None
    date: datetime.date | None = None
    inspector: str | None = None
    location: str | None = None
    content: str | None = None
    status: RecordStatus | None = None
    issues_found: int | None = None
    photos: list[str] | None = None


class SupervisionRecordResponse(BaseModel):
    id: str
    project_id: str
    record_type: RecordType
    title: str
    date: datetime.date
    inspector: str
    location: str
    content: str
    status: RecordStatus
    issues_found: int
    photos: list[str]


class ListRecordsResponse(BaseModel):
    items: list[SupervisionRecordResponse]
    total: int


class SummaryResponse(BaseModel):
    total: int
    issues_open: int
    issues_resolved: int
    issues_closed: int
    inspections_this_month: int
    total_issues_found: int
    by_type: dict[str, int]


def _to_response(record: SupervisionRecord) -> SupervisionRecordResponse:
    return SupervisionRecordResponse(
        id=record.id,
        project_id=record.project_id,
        record_type=record.record_type,
        title=record.title,
        date=record.date,
        inspector=record.inspector,
        location=record.location,
        content=record.content,
        status=record.status,
        issues_found=record.issues_found,
        photos=record.photos,
    )


@router.get("/records", response_model=ListRecordsResponse)
def get_records(
    project_id: str | None = Query(default=None, description="Filter by project ID"),
    record_type: RecordType | None = Query(default=None, description="Filter by record type"),
    status: RecordStatus | None = Query(default=None, description="Filter by status"),
) -> ListRecordsResponse:
    """List supervision records with optional filters."""
    try:
        records = list_records(
            project_id=project_id,
            record_type=record_type,
            status=status,
        )
        return ListRecordsResponse(
            items=[_to_response(r) for r in records],
            total=len(records),
        )
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/records/{record_id}", response_model=SupervisionRecordResponse)
def get_single_record(record_id: str) -> SupervisionRecordResponse:
    """Retrieve a single supervision record by ID."""
    record = get_record(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Supervision record '{record_id}' not found")
    return _to_response(record)


@router.post("/records", response_model=SupervisionRecordResponse, status_code=201)
def create_supervision_record(body: CreateRecordRequest) -> SupervisionRecordResponse:
    """Create a new supervision record."""
    try:
        record = create_record(body.model_dump())
        return _to_response(record)
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/records/{record_id}", response_model=SupervisionRecordResponse)
def patch_supervision_record(record_id: str, body: UpdateRecordRequest) -> SupervisionRecordResponse:
    """Partially update a supervision record."""
    existing = get_record(record_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Supervision record '{record_id}' not found")
    try:
        updates = {k: v for k, v in body.model_dump().items() if v is not None}
        updated = update_record(record_id, updates)
        if updated is None:
            raise HTTPException(status_code=404, detail=f"Supervision record '{record_id}' not found")
        return _to_response(updated)
    except HTTPException:
        raise
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    project_id: str | None = Query(default=None, description="Scope summary to a specific project"),
) -> SummaryResponse:
    """Get supervision statistics summary."""
    try:
        data = get_supervision_summary(project_id=project_id)
        return SummaryResponse(**data)
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
