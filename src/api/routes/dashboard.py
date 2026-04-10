"""Dashboard metrics API — aggregated project health & risk overview."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.core.auth import require_auth
from src.core.models import TaskStatus
from src.db.compat import val
from src.services.ai_suggestions import generate_suggestions
from src.services.risk_engine import calculate_project_risk, generate_ai_insights
from src.stores.project_store import list_projects
from src.stores.task_store import list_tasks
from src.workflow.engine import get_stage_label

router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_auth)])


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class ProjectRiskSummary(BaseModel):
    project_id: str
    project_name: str
    risk_score: float
    risk_level: str
    top_risk: str  # most significant risk factor


class AIInsight(BaseModel):
    title: str
    description: str
    severity: str  # "warning" | "info" | "critical"
    project_id: str | None = None


class SuggestedAction(BaseModel):
    action_type: str
    params: dict = {}


class SuggestionItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    priority: str
    project_id: str | None = None
    suggested_action: SuggestedAction


class BudgetSummaryItem(BaseModel):
    project_id: str
    project_name: str
    budget_amount: float | None = None
    actual_spend: float | None = None


class DashboardMetrics(BaseModel):
    total_projects: int
    active_projects: int
    at_risk_projects: int
    completed_projects: int
    total_tasks: int
    overdue_tasks: int
    completion_rate: float  # 0-100
    stage_distribution: dict[str, int]  # stage_label -> count
    task_status_distribution: dict[str, int]  # status -> count
    budget_summary: list[BudgetSummaryItem]
    project_risks: list[ProjectRiskSummary]
    ai_insights: list[AIInsight]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics() -> DashboardMetrics:
    """Compute and return aggregated dashboard metrics."""
    today = date.today()
    projects = list_projects()

    # Collect tasks per project
    all_tasks: dict[str, list] = {}
    total_task_count = 0
    done_task_count = 0
    overdue_task_count = 0
    task_status_dist: dict[str, int] = {}

    for proj in projects:
        tasks = list_tasks(proj.id)
        all_tasks[proj.id] = tasks
        total_task_count += len(tasks)

        for t in tasks:
            task_status_dist[val(t.status)] = task_status_dist.get(val(t.status), 0) + 1
            if t.status == TaskStatus.DONE:
                done_task_count += 1
            if t.due_date and t.status != TaskStatus.DONE and date.fromisoformat(t.due_date) < today:
                overdue_task_count += 1

    # --- Project-level counts ---
    active_count = sum(1 for p in projects if p.status == "active")
    risk_count = sum(1 for p in projects if p.status == "risk")
    completed_count = sum(1 for p in projects if p.status == "completed")

    # --- Completion rate ---
    completion_rate = round((done_task_count / total_task_count) * 100, 1) if total_task_count > 0 else 0.0

    # --- Stage distribution (Chinese labels) ---
    stage_dist: dict[str, int] = {}
    for proj in projects:
        label = get_stage_label(proj.stage)
        stage_dist[label] = stage_dist.get(label, 0) + 1

    # --- Per-project risk ---
    project_risks: list[ProjectRiskSummary] = []
    for proj in projects:
        risk = calculate_project_risk(proj, all_tasks.get(proj.id, []))
        project_risks.append(
            ProjectRiskSummary(
                project_id=proj.id,
                project_name=proj.name,
                risk_score=risk["risk_score"],
                risk_level=risk["risk_level"],
                top_risk=risk["top_risks"][0] if risk["top_risks"] else "无明显风险",
            )
        )

    # Sort by risk_score descending so highest-risk projects come first
    project_risks.sort(key=lambda r: r.risk_score, reverse=True)

    # --- Budget summary ---
    budget_summary = [
        BudgetSummaryItem(
            project_id=proj.id,
            project_name=proj.name,
            budget_amount=proj.budget,
            actual_spend=proj.actual_spend,
        )
        for proj in projects
    ]

    # --- AI insights ---
    raw_insights = generate_ai_insights(projects, all_tasks)
    ai_insights = [AIInsight(**ins) for ins in raw_insights]

    return DashboardMetrics(
        total_projects=len(projects),
        active_projects=active_count,
        at_risk_projects=risk_count,
        completed_projects=completed_count,
        total_tasks=total_task_count,
        overdue_tasks=overdue_task_count,
        completion_rate=completion_rate,
        stage_distribution=stage_dist,
        task_status_distribution=task_status_dist,
        budget_summary=budget_summary,
        project_risks=project_risks,
        ai_insights=ai_insights,
    )


# ---------------------------------------------------------------------------
# AI Suggestions endpoint
# ---------------------------------------------------------------------------


@router.get("/suggestions", response_model=list[SuggestionItem])
async def get_suggestions() -> list[SuggestionItem]:
    """Generate and return AI-powered task suggestions."""
    projects = list_projects()

    all_tasks: dict[str, list] = {}
    for proj in projects:
        all_tasks[proj.id] = list_tasks(proj.id)

    raw = generate_suggestions(projects, all_tasks)
    return [SuggestionItem(**s) for s in raw]
