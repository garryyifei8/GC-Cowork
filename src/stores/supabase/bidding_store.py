"""Supabase-backed bidding store.

Drop-in replacement for src/stores/bidding_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Bidding Opportunity CRUD
# ---------------------------------------------------------------------------


def list_opportunities(
    category: str | None = None,
    status: str | None = None,
) -> list[dict]:
    """Return all bidding opportunities, optionally filtered by category or status."""
    sb = get_supabase()
    q = sb.table("bidding_opportunities").select("*")
    if category is not None:
        q = q.eq("category", category)
    if status is not None:
        q = q.eq("status", status)
    return q.execute().data or []


def get_opportunity(opportunity_id: str) -> dict | None:
    """Return a single opportunity by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("bidding_opportunities").select("*").eq("id", opportunity_id).execute()
    return r.data[0] if r.data else None


def create_opportunity(opportunity: dict) -> dict:
    """Insert a new opportunity into the store and return it."""
    sb = get_supabase()
    data = opportunity if isinstance(opportunity, dict) else opportunity.model_dump()
    return sb.table("bidding_opportunities").insert(data).execute().data[0]


def update_opportunity(opportunity_id: str, updates: dict) -> dict | None:
    """Apply a dict of updates to an existing opportunity and return it."""
    sb = get_supabase()
    r = sb.table("bidding_opportunities").update(updates).eq("id", opportunity_id).execute()
    return r.data[0] if r.data else None


def seed_bidding() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
