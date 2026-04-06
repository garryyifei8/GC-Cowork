"""Supabase-backed procurement store.

Drop-in replacement for src/stores/procurement_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Procurement Package CRUD
# ---------------------------------------------------------------------------


def list_by_project(project_id: str) -> list[dict]:
    """Return all procurement packages for a given project."""
    sb = get_supabase()
    return sb.table("procurement_packages").select("*").eq("project_id", project_id).execute().data or []


def get(package_id: str) -> dict | None:
    """Return a single procurement package by ID."""
    sb = get_supabase()
    r = sb.table("procurement_packages").select("*").eq("id", package_id).execute()
    return r.data[0] if r.data else None


def create(package: dict) -> dict:
    """Insert a new procurement package and return it."""
    sb = get_supabase()
    data = package if isinstance(package, dict) else package.model_dump()
    return sb.table("procurement_packages").insert(data).execute().data[0]


def update(package_id: str, updates: dict) -> dict | None:
    """Apply updates to an existing procurement package. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("procurement_packages").update(updates).eq("id", package_id).execute()
    return r.data[0] if r.data else None


def seed_procurement() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
