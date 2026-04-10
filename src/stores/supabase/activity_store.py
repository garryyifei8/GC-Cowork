"""Supabase-backed activity store.

Drop-in replacement for src/stores/activity_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Activity CRUD
# ---------------------------------------------------------------------------


def list_activities(project_id: str) -> list[dict]:
    """Return all activities for a specific project, sorted by created_at desc."""
    sb = get_supabase()
    r = sb.table("activity_events").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
    return r.data or []


def list_recent_activities(limit: int = 10) -> list[dict]:
    """Return the most recent activities across all projects."""
    sb = get_supabase()
    r = sb.table("activity_events").select("*").order("created_at", desc=True).limit(limit).execute()
    return r.data or []


def create_activity(activity: dict) -> dict:
    """Insert a new activity into the store and return it."""
    sb = get_supabase()
    data = activity if isinstance(activity, dict) else activity.model_dump()
    return sb.table("activity_events").insert(data).execute().data[0]


def get_activity(activity_id: str) -> dict | None:
    """Return a single activity by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("activity_events").select("*").eq("id", activity_id).execute()
    return r.data[0] if r.data else None


def list_task_comments(task_id: str) -> list[dict]:
    """Return all comment-type activities for a specific task, sorted by created_at asc."""
    sb = get_supabase()
    r = sb.table("activity_events").select("*").eq("event_type", "task_comment").order("created_at").execute()
    # Filter by task_id in the detail JSONB field (PostgREST doesn't easily support JSONB filters)
    return [a for a in (r.data or []) if (a.get("detail") or {}).get("task_id") == task_id]


def seed_activities() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
