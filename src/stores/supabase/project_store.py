"""Supabase-backed project store.

Drop-in replacement for src/stores/project_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Projects CRUD
# ---------------------------------------------------------------------------


def list_projects(status: str | None = None) -> list[dict]:
    sb = get_supabase()
    q = sb.table("projects").select("*")
    if status:
        q = q.eq("status", status)
    result = q.order("created_at", desc=True).execute()
    # Enrich with team_members list
    projects = result.data or []
    for p in projects:
        members_res = sb.table("project_members").select("member_name").eq("project_id", p["id"]).execute()
        p["team_members"] = [m["member_name"] for m in (members_res.data or [])]
        p["team_size"] = len(p["team_members"])
        p["budget_amount"] = p.get("budget")
    return projects


def get_project(project_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).execute()
    if not result.data:
        return None
    p = result.data[0]

    # Load related data
    risks_res = sb.table("project_risks").select("*").eq("project_id", project_id).execute()
    milestones_res = sb.table("project_milestones").select("*").eq("project_id", project_id).order("date").execute()
    members_res = sb.table("project_members").select("member_name").eq("project_id", project_id).execute()
    tasks_res = sb.table("tasks").select("*").eq("project_id", project_id).execute()

    p["risks"] = risks_res.data or []
    p["milestones"] = milestones_res.data or []
    p["team_members"] = [m["member_name"] for m in (members_res.data or [])]
    p["team_size"] = len(p["team_members"])
    p["tasks"] = tasks_res.data or []
    # budget is numeric (万元) in DB, budget_display is the human string ("1.2亿")
    p["budget_amount"] = p.get("budget")  # numeric for calculations
    # Route layer expects p.budget_display for display, p.budget for numeric
    return p


def create_project(data: dict) -> dict:
    sb = get_supabase()
    team_members = data.pop("team_members", [])
    result = sb.table("projects").insert(data).execute()
    project = result.data[0]

    # Insert team members
    if team_members:
        sb.table("project_members").insert(
            [{"project_id": project["id"], "member_name": m} for m in team_members]
        ).execute()

    project["team_members"] = team_members
    return project


def update_project(project_id: str, updates: dict) -> dict | None:
    sb = get_supabase()
    team_members = updates.pop("team_members", None)

    if updates:
        result = sb.table("projects").update(updates).eq("id", project_id).execute()
        if not result.data:
            return None

    if team_members is not None:
        # Replace all members
        sb.table("project_members").delete().eq("project_id", project_id).execute()
        if team_members:
            sb.table("project_members").insert(
                [{"project_id": project_id, "member_name": m} for m in team_members]
            ).execute()

    return get_project(project_id)


def delete_project(project_id: str) -> bool:
    sb = get_supabase()
    result = sb.table("projects").delete().eq("id", project_id).execute()
    return bool(result.data)


# ---------------------------------------------------------------------------
# Seed — no-op for Supabase (seed data comes from seed.sql)
# ---------------------------------------------------------------------------


def seed_projects() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
