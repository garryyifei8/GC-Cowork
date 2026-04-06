"""Supabase-backed process record store.

Drop-in replacement for src/stores/process_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Process Record CRUD
# ---------------------------------------------------------------------------


def list_by_project(
    project_id: str,
    record_type: str | None = None,
) -> list[dict]:
    """Return all process records for a project, optionally filtered by type."""
    sb = get_supabase()
    q = sb.table("process_records").select("*").eq("project_id", project_id)
    if record_type is not None:
        q = q.eq("record_type", record_type)
    return q.order("date", desc=True).execute().data or []


def get(record_id: str) -> dict | None:
    """Return a single process record by ID."""
    sb = get_supabase()
    r = sb.table("process_records").select("*").eq("id", record_id).execute()
    return r.data[0] if r.data else None


def create(project_id: str, data: dict) -> dict:
    """Create a new process record linked to the given project."""
    sb = get_supabase()
    payload = {**data, "project_id": project_id}
    return sb.table("process_records").insert(payload).execute().data[0]


def update(record_id: str, updates: dict) -> dict | None:
    """Apply updates to an existing process record. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("process_records").update(updates).eq("id", record_id).execute()
    return r.data[0] if r.data else None


def seed_processes() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
