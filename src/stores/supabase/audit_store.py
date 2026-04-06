"""Supabase-backed audit store.

Drop-in replacement for src/stores/audit_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

# Re-export types that API routes import from this module
from typing import Literal

from src.db.client import get_client as get_supabase

AuditType = Literal["financial", "compliance", "project", "safety"]
AuditStatus = Literal["planned", "in_progress", "completed", "follow_up"]
RiskLevel = Literal["low", "medium", "high", "critical"]

from pydantic import BaseModel


class AuditReportRecord(BaseModel):
    id: str = ""
    title: str = ""
    audit_type: str = "financial"
    project_id: str | None = None
    auditor: str = ""
    start_date: str | None = None
    end_date: str | None = None
    status: str = "planned"
    findings_count: int = 0
    risk_level: str = "low"
    summary: str = ""
    created_at: str | None = None
    updated_at: str | None = None


# ---------------------------------------------------------------------------
# Audit Report CRUD
# ---------------------------------------------------------------------------


def list_reports(
    status: str | None = None,
    audit_type: str | None = None,
) -> list[dict]:
    """Return all audit reports, optionally filtered by status and/or audit_type."""
    sb = get_supabase()
    q = sb.table("audit_reports").select("*")
    if status is not None:
        q = q.eq("status", status)
    if audit_type is not None:
        q = q.eq("audit_type", audit_type)
    return q.execute().data or []


def get_report(report_id: str) -> dict | None:
    """Return a single audit report by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("audit_reports").select("*").eq("id", report_id).execute()
    return r.data[0] if r.data else None


def create_report(data: dict) -> dict:
    """Create a new audit report and add it to the store."""
    sb = get_supabase()
    return sb.table("audit_reports").insert(data).execute().data[0]


def update_report(report_id: str, updates: dict) -> dict | None:
    """Apply a partial update to an existing audit report. Returns None if not found."""
    sb = get_supabase()
    # Strip None values consistent with memory store behaviour
    payload = {k: v for k, v in updates.items() if v is not None}
    r = sb.table("audit_reports").update(payload).eq("id", report_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Summary / analytics
# ---------------------------------------------------------------------------


def get_audit_summary() -> dict:
    """Return aggregate statistics across all audit reports."""
    sb = get_supabase()
    all_reports = sb.table("audit_reports").select("*").execute().data or []

    total = len(all_reports)
    in_progress_count = sum(1 for r in all_reports if r.get("status") == "in_progress")
    total_findings = sum(int(r.get("findings_count", 0)) for r in all_reports)
    completed_count = sum(1 for r in all_reports if r.get("status") == "completed")
    compliance_rate = round(completed_count / total, 4) if total > 0 else 0.0

    return {
        "total": total,
        "in_progress": in_progress_count,
        "findings_count": total_findings,
        "compliance_rate": compliance_rate,
    }


def seed_audit_reports() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
