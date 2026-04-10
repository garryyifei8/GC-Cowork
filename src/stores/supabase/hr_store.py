"""Supabase-backed HR store.

Drop-in replacement for src/stores/hr_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Employee CRUD
# ---------------------------------------------------------------------------


def list_employees(
    department: str | None = None,
    status: str | None = None,
) -> list[dict]:
    """Return employees, optionally filtered by department and/or status."""
    sb = get_supabase()
    q = sb.table("employees").select("*")
    if department is not None:
        q = q.eq("department", department)
    if status is not None:
        q = q.eq("status", status)
    return q.execute().data or []


def get_employee(employee_id: str) -> dict | None:
    """Return a single employee by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("employees").select("*").eq("id", employee_id).execute()
    return r.data[0] if r.data else None


def create_employee(data: dict) -> dict:
    """Create a new employee from a dict payload and persist it."""
    sb = get_supabase()
    return sb.table("employees").insert(data).execute().data[0]


def update_employee(employee_id: str, data: dict) -> dict | None:
    """Apply partial updates to an existing employee. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("employees").update(data).eq("id", employee_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Attendance CRUD
# ---------------------------------------------------------------------------


def list_attendance(
    employee_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    """Return attendance records with optional filters."""
    sb = get_supabase()
    q = sb.table("attendance_records").select("*")
    if employee_id is not None:
        q = q.eq("employee_id", employee_id)
    if date_from is not None:
        q = q.gte("date", date_from)
    if date_to is not None:
        q = q.lte("date", date_to)
    return q.order("date").order("employee_id").execute().data or []


def create_attendance(data: dict) -> dict:
    """Create a new attendance record from a dict payload."""
    sb = get_supabase()
    return sb.table("attendance_records").insert(data).execute().data[0]


# ---------------------------------------------------------------------------
# Leave Request CRUD
# ---------------------------------------------------------------------------


def list_leave_requests(
    employee_id: str | None = None,
    status: str | None = None,
) -> list[dict]:
    """Return leave requests with optional filters."""
    sb = get_supabase()
    q = sb.table("leave_requests").select("*")
    if employee_id is not None:
        q = q.eq("employee_id", employee_id)
    if status is not None:
        q = q.eq("status", status)
    return q.execute().data or []


def create_leave_request(data: dict) -> dict:
    """Create a new leave request from a dict payload."""
    sb = get_supabase()
    return sb.table("leave_requests").insert(data).execute().data[0]


def update_leave_request(leave_id: str, data: dict) -> dict | None:
    """Apply partial updates to a leave request. Returns None if not found."""
    sb = get_supabase()
    r = sb.table("leave_requests").update(data).eq("id", leave_id).execute()
    return r.data[0] if r.data else None


# ---------------------------------------------------------------------------
# Salary Record CRUD
# ---------------------------------------------------------------------------


def list_salary_records(
    employee_id: str | None = None,
    month: str | None = None,
) -> list[dict]:
    """Return salary records with optional filters."""
    sb = get_supabase()
    q = sb.table("salary_records").select("*")
    if employee_id is not None:
        q = q.eq("employee_id", employee_id)
    if month is not None:
        q = q.eq("month", month)
    return q.order("month").order("employee_id").execute().data or []


def create_salary_record(data: dict) -> dict:
    """Create a new salary record from a dict payload."""
    sb = get_supabase()
    # Compute net_salary if not provided
    if "net_salary" not in data or not data.get("net_salary"):
        data = dict(data)
        data["net_salary"] = round(
            float(data.get("base_salary", 0))
            + float(data.get("overtime_pay", 0))
            + float(data.get("bonus", 0))
            - float(data.get("deductions", 0))
            - float(data.get("social_insurance", 0))
            - float(data.get("tax", 0)),
            2,
        )
    return sb.table("salary_records").insert(data).execute().data[0]


def seed_hr() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
