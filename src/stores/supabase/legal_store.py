"""Supabase-backed legal/contract store.

Drop-in replacement for src/stores/legal_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from datetime import date, timedelta

from pydantic import BaseModel

from src.db.client import get_client as get_supabase


class Contract(BaseModel):
    id: str = ""
    title: str = ""
    contract_type: str = "service"
    party_a: str = ""
    party_b: str = ""
    project_id: str | None = None
    amount: float = 0
    sign_date: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    status: str = "draft"
    risk_level: str = "low"
    key_terms: str = ""
    responsible: str = ""
    created_at: str | None = None
    updated_at: str | None = None


# ---------------------------------------------------------------------------
# Contract CRUD
# ---------------------------------------------------------------------------


def list_contracts(
    status: str | None = None,
    contract_type: str | None = None,
    project_id: str | None = None,
) -> list[dict]:
    """Return contracts, optionally filtered by status, type, or project."""
    sb = get_supabase()
    q = sb.table("contracts").select("*")
    if status is not None:
        q = q.eq("status", status)
    if contract_type is not None:
        q = q.eq("contract_type", contract_type)
    if project_id is not None:
        q = q.eq("project_id", project_id)
    return q.execute().data or []


def get_contract(contract_id: str) -> dict | None:
    """Return a single contract by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("contracts").select("*").eq("id", contract_id).execute()
    return r.data[0] if r.data else None


def create_contract(data: dict) -> dict:
    """Create a new contract and persist it."""
    sb = get_supabase()
    return sb.table("contracts").insert(data).execute().data[0]


def update_contract(contract_id: str, data: dict) -> dict | None:
    """Partially update an existing contract. Returns None if not found."""
    sb = get_supabase()
    # Strip None values to avoid overwriting existing data
    payload = {k: v for k, v in data.items() if v is not None}
    r = sb.table("contracts").update(payload).eq("id", contract_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Summary / analytics
# ---------------------------------------------------------------------------


def get_legal_summary() -> dict:
    """Return aggregate statistics for the legal dashboard."""
    sb = get_supabase()
    all_contracts = sb.table("contracts").select("*").execute().data or []

    today = date.today()
    threshold = today + timedelta(days=30)

    active = [c for c in all_contracts if c.get("status") == "active"]

    expiring_soon = [c for c in active if c.get("end_date") and date.fromisoformat(c["end_date"]) <= threshold]

    total_amount = sum(float(c.get("amount", 0)) for c in all_contracts)

    by_type: dict[str, int] = {}
    for c in all_contracts:
        ct = c.get("contract_type", "unknown")
        by_type[ct] = by_type.get(ct, 0) + 1

    by_status: dict[str, int] = {}
    for c in all_contracts:
        s = c.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1

    high_risk = [c for c in all_contracts if c.get("risk_level") == "high"]

    return {
        "total": len(all_contracts),
        "active": len(active),
        "expiring_soon": len(expiring_soon),
        "total_amount": total_amount,
        "by_type": by_type,
        "by_status": by_status,
        "high_risk_count": len(high_risk),
        "expiring_soon_contracts": [c["id"] for c in expiring_soon],
    }


def seed_contracts() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
