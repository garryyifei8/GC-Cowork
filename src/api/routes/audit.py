"""FastAPI router for the audit management module."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.core.exceptions import PlatformError
from src.stores.audit_store import (
    AuditReportRecord,
    AuditStatus,
    AuditType,
    RiskLevel,
    create_report,
    get_audit_summary,
    get_report,
    list_reports,
    update_report,
)

router = APIRouter(prefix="/audit", tags=["audit"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class CreateAuditReportRequest(BaseModel):
    title: str
    audit_type: AuditType
    project_id: str | None = None
    auditor: str
    start_date: date
    end_date: date | None = None
    status: AuditStatus = "planned"
    findings_count: int = Field(default=0, ge=0)
    risk_level: RiskLevel = "low"
    summary: str


class UpdateAuditReportRequest(BaseModel):
    title: str | None = None
    audit_type: AuditType | None = None
    project_id: str | None = None
    auditor: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: AuditStatus | None = None
    findings_count: int | None = Field(default=None, ge=0)
    risk_level: RiskLevel | None = None
    summary: str | None = None


class AuditSummaryResponse(BaseModel):
    total: int
    in_progress: int
    findings_count: int
    compliance_rate: float


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/reports", response_model=list[AuditReportRecord])
def list_audit_reports(
    status: AuditStatus | None = Query(default=None, description="Filter by audit status"),
    audit_type: AuditType | None = Query(default=None, description="Filter by audit type"),
) -> list[AuditReportRecord]:
    """Return all audit reports, with optional filters for status and audit type."""
    try:
        return list_reports(status=status, audit_type=audit_type)
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/reports/{report_id}", response_model=AuditReportRecord)
def get_audit_report(report_id: str) -> AuditReportRecord:
    """Return a single audit report by its ID."""
    try:
        record = get_report(report_id)
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if record is None:
        raise HTTPException(status_code=404, detail=f"Audit report '{report_id}' not found.")
    return record


@router.post("/reports", response_model=AuditReportRecord, status_code=201)
def create_audit_report(body: CreateAuditReportRequest) -> AuditReportRecord:
    """Create a new audit report."""
    try:
        return create_report(body.model_dump())
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/reports/{report_id}", response_model=AuditReportRecord)
def partial_update_audit_report(
    report_id: str,
    body: UpdateAuditReportRequest,
) -> AuditReportRecord:
    """Apply a partial update to an existing audit report."""
    try:
        record = update_report(report_id, body.model_dump(exclude_none=True))
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if record is None:
        raise HTTPException(status_code=404, detail=f"Audit report '{report_id}' not found.")
    return record


@router.get("/summary", response_model=AuditSummaryResponse)
def audit_summary() -> AuditSummaryResponse:
    """Return aggregate statistics across all audit reports."""
    try:
        data = get_audit_summary()
        return AuditSummaryResponse(**data)
    except PlatformError:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
