"""
AI 风险引擎 — 纯规则计算，无 LLM 调用。
基于任务状态、进度偏差、截止日期等因子评估项目风险并生成洞察。
"""

from __future__ import annotations

from datetime import date

from src.core.models import Project, ProjectTask, TaskStatus

# ---------------------------------------------------------------------------
# Risk level thresholds
# ---------------------------------------------------------------------------


def _risk_level(score: float) -> str:
    """Map a numeric risk score to a human-readable level."""
    if score <= 30:
        return "low"
    if score <= 60:
        return "medium"
    if score <= 80:
        return "high"
    return "critical"


# ---------------------------------------------------------------------------
# Per-project risk calculation
# ---------------------------------------------------------------------------


def calculate_project_risk(
    project: Project,
    tasks: list[ProjectTask],
) -> dict:
    """Evaluate risk for a single project.

    Returns:
        {
            "risk_score": float,
            "risk_level": str,       # low | medium | high | critical
            "top_risks": list[str],  # human-readable risk descriptions
        }
    """
    today = date.today()
    score = 0.0
    top_risks: list[str] = []

    # --- Factor 1: overdue tasks (due_date < today AND status != done) ---
    overdue_count = 0
    for t in tasks:
        if t.due_date and t.status != TaskStatus.DONE and date.fromisoformat(t.due_date) < today:
            overdue_count += 1
    if overdue_count > 0:
        score += 15 * overdue_count
        top_risks.append(f"{overdue_count} 个任务已逾期")

    # --- Factor 2: blocked tasks ---
    blocked_count = sum(1 for t in tasks if t.status == TaskStatus.BLOCKED)
    if blocked_count > 0:
        score += 20 * blocked_count
        top_risks.append(f"{blocked_count} 个任务处于阻塞状态")

    # --- Factor 3: progress vs timeline deviation ---
    if project.due_date:
        try:
            due = date.fromisoformat(project.due_date)
            # Use created_at as project start; fall back to 180 days before due
            _ca = project.created_at
            if _ca:
                if hasattr(_ca, "date"):
                    start = _ca.date()
                elif isinstance(_ca, str):
                    start = date.fromisoformat(_ca[:10])
                else:
                    start = due.replace(year=due.year - 1)
            else:
                start = due.replace(year=due.year - 1)
            total_days = (due - start).days
            elapsed_days = (today - start).days
            if total_days > 0 and elapsed_days > 0:
                expected_pct = min(100.0, (elapsed_days / total_days) * 100)
                gap = expected_pct - project.progress_pct
                if gap > 10:
                    # Points proportional to the gap, capped at 40
                    deviation_points = min(40.0, gap * 0.8)
                    score += deviation_points
                    top_risks.append(
                        f"进度落后于预期 {gap:.0f}% (当前 {project.progress_pct:.0f}%, 预期 {expected_pct:.0f}%)"
                    )
        except (ValueError, TypeError):
            pass  # unparseable due_date — skip

    # --- Factor 4: no in-progress tasks (stalled project) ---
    if project.status == "active":
        has_in_progress = any(t.status == TaskStatus.IN_PROGRESS for t in tasks)
        if not has_in_progress and tasks:
            score += 25
            top_risks.append("项目处于活跃状态但无进行中的任务，可能停滞")

    return {
        "risk_score": round(score, 1),
        "risk_level": _risk_level(score),
        "top_risks": top_risks,
    }


# ---------------------------------------------------------------------------
# AI insights (rule-based, no LLM)
# ---------------------------------------------------------------------------


def generate_ai_insights(
    projects: list[Project],
    all_tasks: dict[str, list[ProjectTask]],
) -> list[dict]:
    """Generate rule-based insights across all projects.

    Each insight:
        {
            "title": str,
            "description": str,
            "severity": "warning" | "info" | "critical",
            "project_id": str | None,
        }
    """
    today = date.today()
    insights: list[dict] = []

    total_overdue = 0

    for proj in projects:
        tasks = all_tasks.get(proj.id, [])

        # --- Blocked tasks → warning ---
        blocked = [t for t in tasks if t.status == TaskStatus.BLOCKED]
        if blocked:
            severity = "critical" if len(blocked) >= 3 else "warning"
            insights.append(
                {
                    "title": f"{proj.name} 存在阻塞任务",
                    "description": (f"{proj.name} 有 {len(blocked)} 个任务阻塞，建议优先处理"),
                    "severity": severity,
                    "project_id": proj.id,
                }
            )

        # --- Nearing deadline (within 30 days) with low completion → warning ---
        if proj.due_date:
            try:
                due = date.fromisoformat(proj.due_date)
                days_left = (due - today).days
                if 0 < days_left <= 30 and proj.progress_pct < 90:
                    insights.append(
                        {
                            "title": f"{proj.name} 即将到期",
                            "description": (
                                f"{proj.name} 即将到期({proj.due_date})，当前进度 {proj.progress_pct:.0f}%，请关注"
                            ),
                            "severity": "warning",
                            "project_id": proj.id,
                        }
                    )
                elif 0 < days_left <= 30 and proj.progress_pct >= 90:
                    insights.append(
                        {
                            "title": f"{proj.name} 即将到期",
                            "description": (
                                f"{proj.name} 即将到期({proj.due_date})，验收进度 {proj.progress_pct:.0f}%"
                            ),
                            "severity": "info",
                            "project_id": proj.id,
                        }
                    )
                elif days_left <= 0 and proj.status != "completed":
                    insights.append(
                        {
                            "title": f"{proj.name} 已超过截止日期",
                            "description": (
                                f"{proj.name} 截止日期为 {proj.due_date}，"
                                f"已逾期 {abs(days_left)} 天，当前进度 {proj.progress_pct:.0f}%"
                            ),
                            "severity": "critical",
                            "project_id": proj.id,
                        }
                    )
            except (ValueError, TypeError):
                pass

        # --- Count overdue tasks across all projects ---
        for t in tasks:
            if t.due_date and t.status != TaskStatus.DONE and date.fromisoformat(t.due_date) < today:
                total_overdue += 1

        # --- All tasks done → suggest stage transition ---
        if tasks and all(t.status == TaskStatus.DONE for t in tasks):
            insights.append(
                {
                    "title": f"{proj.name} 所有任务已完成",
                    "description": (f"{proj.name} 当前阶段所有任务已完成，建议推进至下一阶段"),
                    "severity": "info",
                    "project_id": proj.id,
                }
            )

    # --- High overdue task count across all projects → info ---
    if total_overdue > 0:
        insights.append(
            {
                "title": "全局逾期任务提醒",
                "description": f"当前共有 {total_overdue} 个任务已逾期，请各项目经理及时跟进",
                "severity": "warning" if total_overdue >= 5 else "info",
                "project_id": None,
            }
        )

    return insights
