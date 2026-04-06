"""Supabase-backed task store.

Drop-in replacement for src/stores/task_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Task CRUD
# ---------------------------------------------------------------------------


def list_all_tasks(
    assignee: str | None = None,
    status: str | None = None,
    priority: str | None = None,
) -> list[dict]:
    """Return all tasks, optionally filtered."""
    sb = get_supabase()
    q = sb.table("tasks").select("*")
    if assignee:
        q = q.eq("assignee", assignee)
    if status:
        q = q.eq("status", status)
    if priority:
        q = q.eq("priority", priority)
    return q.execute().data or []


def list_tasks(project_id: str) -> list[dict]:
    """Return all tasks belonging to a specific project."""
    sb = get_supabase()
    return sb.table("tasks").select("*").eq("project_id", project_id).execute().data or []


def get_task(task_id: str) -> dict | None:
    """Return a single task by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("tasks").select("*").eq("id", task_id).execute()
    return r.data[0] if r.data else None


def create_task(task: dict) -> dict:
    """Insert a new task into the store and return it."""
    sb = get_supabase()
    # Accept both dict and Pydantic model
    data = task if isinstance(task, dict) else task.model_dump()
    return sb.table("tasks").insert(data).execute().data[0]


def update_task(task_id: str, updates: dict) -> dict | None:
    """Apply a dict of updates to an existing task and return it."""
    sb = get_supabase()
    r = sb.table("tasks").update(updates).eq("id", task_id).execute()
    return r.data[0] if r.data else None


def delete_task(task_id: str) -> bool:
    """Remove a task. Returns True if deleted, False otherwise."""
    sb = get_supabase()
    r = sb.table("tasks").delete().eq("id", task_id).execute()
    return bool(r.data)


def seed_tasks() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
