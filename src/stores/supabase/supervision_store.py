"""Supabase-backed supervision store.

Drop-in replacement for src/stores/supervision_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from src.db.client import get_client as get_supabase

RecordType = Literal["patrol", "witness", "issue", "meeting"]
RecordStatus = Literal["normal", "issue", "resolved", "closed"]

from pydantic import BaseModel


class SupervisionRecord(BaseModel):
    id: str = ""
    project_id: str = ""
    record_type: str = "patrol"
    title: str = ""
    date: str = ""
    inspector: str = ""
    location: str = ""
    content: str = ""
    status: str = "normal"
    issues_found: int = 0
    photos: list[str] = []
    created_at: str | None = None
    updated_at: str | None = None


# ---------------------------------------------------------------------------
# Supervision Record CRUD
# ---------------------------------------------------------------------------


def list_records(
    project_id: str | None = None,
    record_type: str | None = None,
    status: str | None = None,
) -> list[dict]:
    """Return supervision records with optional filters, sorted by date desc."""
    sb = get_supabase()
    q = sb.table("supervision_records").select("*")
    if project_id is not None:
        q = q.eq("project_id", project_id)
    if record_type is not None:
        q = q.eq("record_type", record_type)
    if status is not None:
        q = q.eq("status", status)
    return q.order("date", desc=True).execute().data or []


def get_record(record_id: str) -> dict | None:
    """Return a single supervision record by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("supervision_records").select("*").eq("id", record_id).execute()
    return r.data[0] if r.data else None


def create_record(data: dict) -> dict:
    """Create a new supervision record from a dict payload."""
    sb = get_supabase()
    # Strip id/created_at/updated_at if caller passed them as None; the DB handles defaults
    payload = {k: v for k, v in data.items() if k not in ("created_at", "updated_at") or v is not None}
    return sb.table("supervision_records").insert(payload).execute().data[0]


def update_record(record_id: str, updates: dict) -> dict | None:
    """Apply updates to an existing supervision record. Returns None if not found."""
    sb = get_supabase()
    # Strip immutable fields and None values
    payload = {k: v for k, v in updates.items() if k not in ("id", "created_at") and v is not None}
    r = sb.table("supervision_records").update(payload).eq("id", record_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Summary / analytics
# ---------------------------------------------------------------------------


def get_supervision_summary(project_id: str | None = None) -> dict:
    """Return aggregate statistics for supervision records."""
    records = list_records(project_id=project_id)

    today = date.today()
    current_month_records = [r for r in records if r.get("date", "")[:7] == today.strftime("%Y-%m")]

    total = len(records)
    issues_open = sum(1 for r in records if r.get("status") == "issue")
    issues_resolved = sum(1 for r in records if r.get("status") == "resolved")
    issues_closed = sum(1 for r in records if r.get("status") == "closed")
    inspections_this_month = len([r for r in current_month_records if r.get("record_type") in ("patrol", "witness")])
    total_issues_found = sum(int(r.get("issues_found", 0)) for r in records)

    by_type: dict[str, int] = {}
    for r in records:
        rt = r.get("record_type", "unknown")
        by_type[rt] = by_type.get(rt, 0) + 1

    return {
        "total": total,
        "issues_open": issues_open,
        "issues_resolved": issues_resolved,
        "issues_closed": issues_closed,
        "inspections_this_month": inspections_this_month,
        "total_issues_found": total_issues_found,
        "by_type": by_type,
    }


def seed_supervision_records() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
