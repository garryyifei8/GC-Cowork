"""Supabase-backed finance store.

Drop-in replacement for src/stores/finance_store.py.
Uses the same function signatures so API routes work unchanged.
Enum coercion is removed — Supabase stores plain strings.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Expense CRUD
# ---------------------------------------------------------------------------


def list_expenses(
    status: str | None = None,
    project_id: str | None = None,
    submitter: str | None = None,
) -> list[dict]:
    """Return all expenses, optionally filtered by status, project_id, or submitter."""
    sb = get_supabase()
    q = sb.table("expense_reports").select("*")
    if status is not None:
        q = q.eq("status", status)
    if project_id is not None:
        q = q.eq("project_id", project_id)
    if submitter is not None:
        q = q.eq("submitter", submitter)
    return q.execute().data or []


def get_expense(expense_id: str) -> dict | None:
    """Return a single expense report by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("expense_reports").select("*").eq("id", expense_id).execute()
    return r.data[0] if r.data else None


def create_expense(data: dict) -> dict:
    """Create a new expense report from a dict and persist it."""
    sb = get_supabase()
    return sb.table("expense_reports").insert(data).execute().data[0]


def update_expense(expense_id: str, data: dict) -> dict | None:
    """Apply a partial update to an existing expense report. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("expense_reports").update(data).eq("id", expense_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Budget CRUD
# ---------------------------------------------------------------------------


def list_budgets(
    project_id: str | None = None,
    fiscal_year: int | None = None,
) -> list[dict]:
    """Return all budget lines, optionally filtered by project_id or fiscal_year."""
    sb = get_supabase()
    q = sb.table("budget_lines").select("*")
    if project_id is not None:
        q = q.eq("project_id", project_id)
    if fiscal_year is not None:
        q = q.eq("fiscal_year", fiscal_year)
    return q.execute().data or []


def get_budget(budget_id: str) -> dict | None:
    """Return a single budget line by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("budget_lines").select("*").eq("id", budget_id).execute()
    return r.data[0] if r.data else None


def create_budget(data: dict) -> dict:
    """Create a new budget line from a dict and persist it."""
    sb = get_supabase()
    return sb.table("budget_lines").insert(data).execute().data[0]


def update_budget(budget_id: str, data: dict) -> dict | None:
    """Apply a partial update to an existing budget line. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("budget_lines").update(data).eq("id", budget_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Invoice CRUD
# ---------------------------------------------------------------------------


def list_invoices(
    status: str | None = None,
    project_id: str | None = None,
) -> list[dict]:
    """Return all invoices, optionally filtered by status or project_id."""
    sb = get_supabase()
    q = sb.table("invoices").select("*")
    if status is not None:
        q = q.eq("status", status)
    if project_id is not None:
        q = q.eq("project_id", project_id)
    return q.execute().data or []


def get_invoice(invoice_id: str) -> dict | None:
    """Return a single invoice by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("invoices").select("*").eq("id", invoice_id).execute()
    return r.data[0] if r.data else None


def create_invoice(data: dict) -> dict:
    """Create a new invoice from a dict and persist it."""
    sb = get_supabase()
    return sb.table("invoices").insert(data).execute().data[0]


def update_invoice(invoice_id: str, data: dict) -> dict | None:
    """Apply a partial update to an existing invoice. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("invoices").update(data).eq("id", invoice_id).execute()
    return r.data[0] if r.data else None


def seed_finance() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
