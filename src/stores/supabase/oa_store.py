"""Supabase-backed OA store.

Drop-in replacement for src/stores/oa_store.py.
Uses the same function signatures so API routes work unchanged.

Note on notices: broadcast notices have target_user = NULL and should be
returned for any user. We handle this by fetching broadcasts and user-specific
notices separately then merging.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Notice CRUD
# ---------------------------------------------------------------------------


def list_notices(
    target_user: str | None = None,
    notice_type: str | None = None,
    is_read: bool | None = None,
) -> list[dict]:
    """Return notices with optional filters. Broadcasts (target_user IS NULL) included for all users."""
    sb = get_supabase()

    if target_user is not None:
        # Fetch broadcasts (target_user IS NULL)
        broadcast_q = sb.table("notices").select("*").is_("target_user", "null")
        # Fetch user-specific notices
        user_q = sb.table("notices").select("*").eq("target_user", target_user)

        if notice_type is not None:
            broadcast_q = broadcast_q.eq("type", notice_type)
            user_q = user_q.eq("type", notice_type)
        if is_read is not None:
            broadcast_q = broadcast_q.eq("is_read", is_read)
            user_q = user_q.eq("is_read", is_read)

        broadcasts = broadcast_q.execute().data or []
        user_notices = user_q.execute().data or []

        # Merge and deduplicate by id
        seen: set[str] = set()
        result: list[dict] = []
        for item in broadcasts + user_notices:
            if item["id"] not in seen:
                seen.add(item["id"])
                result.append(item)
    else:
        q = sb.table("notices").select("*")
        if notice_type is not None:
            q = q.eq("type", notice_type)
        if is_read is not None:
            q = q.eq("is_read", is_read)
        result = q.execute().data or []

    # Sort by created_at descending (Python-side to handle merged list)
    result.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return result


def get_notice(notice_id: str) -> dict | None:
    """Return a single notice by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("notices").select("*").eq("id", notice_id).execute()
    return r.data[0] if r.data else None


def create_notice(data: dict) -> dict:
    """Create a new notice from a dict payload and persist it."""
    sb = get_supabase()
    return sb.table("notices").insert(data).execute().data[0]


def update_notice(notice_id: str, data: dict) -> dict | None:
    """Apply partial updates to an existing notice. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("notices").update(data).eq("id", notice_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Vehicle Request CRUD
# ---------------------------------------------------------------------------


def list_vehicle_requests(
    applicant: str | None = None,
    status: str | None = None,
) -> list[dict]:
    """Return vehicle requests with optional filters, sorted by created_at desc."""
    sb = get_supabase()
    q = sb.table("vehicle_requests").select("*")
    if applicant is not None:
        q = q.eq("applicant", applicant)
    if status is not None:
        q = q.eq("status", status)
    return q.order("created_at", desc=True).execute().data or []


def get_vehicle_request(request_id: str) -> dict | None:
    """Return a single vehicle request by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("vehicle_requests").select("*").eq("id", request_id).execute()
    return r.data[0] if r.data else None


def create_vehicle_request(data: dict) -> dict:
    """Create a new vehicle request from a dict payload and persist it."""
    sb = get_supabase()
    return sb.table("vehicle_requests").insert(data).execute().data[0]


def update_vehicle_request(request_id: str, data: dict) -> dict | None:
    """Apply partial updates to an existing vehicle request. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("vehicle_requests").update(data).eq("id", request_id).execute()
    return r.data[0] if r.data else None


def seed_oa() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
