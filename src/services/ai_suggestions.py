"""
AI 任务建议引擎 — 纯规则计算，无 LLM 调用。
基于项目状态、任务分布、截止日期等因子生成可操作的智能建议。
"""
from __future__ import annotations

from collections import Counter
from datetime import date
from uuid import uuid4

from src.core.models import Project, ProjectStage, ProjectTask, TaskStatus
from src.workflow.engine import TRANSITIONS, get_stage_label


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_suggestions(
    projects: list[Project],
    all_tasks: dict[str, list[ProjectTask]],
) -> list[dict]:
    """Generate AI task suggestions based on project and task analysis.

    Each suggestion:
        {
            "id": str (uuid),
            "type": "task_suggestion" | "risk_alert" | "optimization",
            "title": str (Chinese),
            "description": str (Chinese, 1-2 sentences),
            "priority": "high" | "medium" | "low",
            "project_id": str | None,
            "suggested_action": {
                "action_type": "create_task" | "reassign" | "escalate" | "transition",
                "params": dict
            }
        }
    """
    today = date.today()
    suggestions: list[dict] = []

    # Collect global assignee workload for rule 5
    global_assignee_counts: Counter[str] = Counter()
    for tasks in all_tasks.values():
        for t in tasks:
            if t.assignee and t.status not in (TaskStatus.DONE,):
                global_assignee_counts[t.assignee] += 1

    for proj in projects:
        tasks = all_tasks.get(proj.id, [])

        # --- Rule 1: 阻塞任务升级 ---
        suggestions.extend(_rule_blocked_tasks(proj, tasks))

        # --- Rule 2: 逾期任务跟进 ---
        suggestions.extend(_rule_overdue_tasks(proj, tasks, today))

        # --- Rule 3: 未指派任务 ---
        suggestions.extend(_rule_unassigned_tasks(proj, tasks))

        # --- Rule 4: 阶段转换就绪 ---
        suggestions.extend(_rule_stage_transition_ready(proj, tasks))

        # --- Rule 6: 缺少截止日期 ---
        suggestions.extend(_rule_missing_due_dates(proj, tasks))

        # --- Rule 7: 停滞项目 ---
        suggestions.extend(_rule_stalled_projects(proj, tasks))

    # --- Rule 5: 工作量失衡（全局分析） ---
    suggestions.extend(_rule_workload_imbalance(projects, all_tasks, global_assignee_counts))

    return suggestions


# ---------------------------------------------------------------------------
# Rule implementations
# ---------------------------------------------------------------------------

def _make_suggestion(
    type_: str,
    title: str,
    description: str,
    priority: str,
    project_id: str | None,
    action_type: str,
    params: dict,
) -> dict:
    """Helper to build a suggestion dict with consistent structure."""
    return {
        "id": str(uuid4()),
        "type": type_,
        "title": title,
        "description": description,
        "priority": priority,
        "project_id": project_id,
        "suggested_action": {
            "action_type": action_type,
            "params": params,
        },
    }


def _rule_blocked_tasks(
    project: Project,
    tasks: list[ProjectTask],
) -> list[dict]:
    """Rule 1: 如果任务处于阻塞状态，建议创建解除阻塞的任务或升级处理。"""
    results: list[dict] = []
    blocked = [t for t in tasks if t.status == TaskStatus.BLOCKED]
    for t in blocked:
        results.append(
            _make_suggestion(
                type_="risk_alert",
                title=f"任务「{t.name}」处于阻塞状态",
                description=f"项目「{project.name}」中的任务「{t.name}」被阻塞，建议排查阻塞原因并升级处理。",
                priority="high",
                project_id=project.id,
                action_type="escalate",
                params={"task_id": t.id, "task_name": t.name},
            )
        )
    return results


def _rule_overdue_tasks(
    project: Project,
    tasks: list[ProjectTask],
    today: date,
) -> list[dict]:
    """Rule 2: 逾期任务跟进 — 建议延期或拆分任务。"""
    results: list[dict] = []
    for t in tasks:
        if (
            t.due_date
            and t.status != TaskStatus.DONE
            and date.fromisoformat(t.due_date) < today
        ):
            overdue_days = (today - date.fromisoformat(t.due_date)).days
            results.append(
                _make_suggestion(
                    type_="risk_alert",
                    title=f"任务「{t.name}」已逾期 {overdue_days} 天",
                    description=f"项目「{project.name}」中的任务已逾期，建议延长截止日期或将任务拆分为更小的子任务。",
                    priority="high" if overdue_days > 7 else "medium",
                    project_id=project.id,
                    action_type="create_task",
                    params={
                        "task_id": t.id,
                        "task_name": t.name,
                        "overdue_days": overdue_days,
                    },
                )
            )
    return results


def _rule_unassigned_tasks(
    project: Project,
    tasks: list[ProjectTask],
) -> list[dict]:
    """Rule 3: 未指派的任务 — 建议分配负责人。"""
    results: list[dict] = []
    unassigned = [
        t for t in tasks
        if not t.assignee and t.status != TaskStatus.DONE
    ]
    if unassigned:
        names = "、".join(t.name for t in unassigned[:3])
        suffix = f"等 {len(unassigned)} 个任务" if len(unassigned) > 3 else ""
        results.append(
            _make_suggestion(
                type_="task_suggestion",
                title=f"「{project.name}」有 {len(unassigned)} 个任务未指派",
                description=f"任务「{names}」{suffix}尚未分配负责人，建议尽快安排人员认领。",
                priority="medium",
                project_id=project.id,
                action_type="reassign",
                params={
                    "task_ids": [t.id for t in unassigned],
                    "suggested_assignees": project.team_members[:3],
                },
            )
        )
    return results


def _rule_stage_transition_ready(
    project: Project,
    tasks: list[ProjectTask],
) -> list[dict]:
    """Rule 4: 如果当前阶段所有任务已完成，建议推进到下一阶段。"""
    results: list[dict] = []
    if not tasks:
        return results

    all_done = all(t.status == TaskStatus.DONE for t in tasks)
    if not all_done:
        return results

    next_stages = TRANSITIONS.get(project.stage, [])
    if not next_stages:
        return results

    next_stage = next_stages[0]
    next_label = get_stage_label(next_stage)
    current_label = get_stage_label(project.stage)

    results.append(
        _make_suggestion(
            type_="optimization",
            title=f"「{project.name}」可推进至{next_label}阶段",
            description=f"当前「{current_label}」阶段所有任务已完成，建议将项目推进至「{next_label}」阶段。",
            priority="medium",
            project_id=project.id,
            action_type="transition",
            params={
                "current_stage": project.stage.value,
                "target_stage": next_stage.value,
            },
        )
    )
    return results


def _rule_workload_imbalance(
    projects: list[Project],
    all_tasks: dict[str, list[ProjectTask]],
    global_assignee_counts: Counter[str],
) -> list[dict]:
    """Rule 5: 工作量失衡 — 某人 >3 个任务而其他人 <1 个时建议重新分配。"""
    results: list[dict] = []
    if not global_assignee_counts:
        return results

    overloaded = [a for a, c in global_assignee_counts.items() if c > 3]
    underloaded = [a for a, c in global_assignee_counts.items() if c < 1]

    # 也检查项目团队成员中完全没有任务的人
    all_members: set[str] = set()
    for proj in projects:
        all_members.update(proj.team_members)
    idle_members = [m for m in all_members if global_assignee_counts.get(m, 0) == 0]

    if overloaded and (underloaded or idle_members):
        overloaded_str = "、".join(overloaded[:3])
        idle_str = "、".join((underloaded + idle_members)[:3])
        results.append(
            _make_suggestion(
                type_="optimization",
                title="团队工作量分配不均衡",
                description=f"成员「{overloaded_str}」任务较多(>3个)，而「{idle_str}」等成员较为空闲，建议重新分配任务。",
                priority="low",
                project_id=None,
                action_type="reassign",
                params={
                    "overloaded": {a: global_assignee_counts[a] for a in overloaded},
                    "idle": (underloaded + idle_members)[:5],
                },
            )
        )
    return results


def _rule_missing_due_dates(
    project: Project,
    tasks: list[ProjectTask],
) -> list[dict]:
    """Rule 6: 缺少截止日期的任务 — 建议设置截止日期。"""
    results: list[dict] = []
    no_due = [
        t for t in tasks
        if not t.due_date and t.status != TaskStatus.DONE
    ]
    if no_due:
        names = "、".join(t.name for t in no_due[:3])
        suffix = f"等 {len(no_due)} 个任务" if len(no_due) > 3 else ""
        results.append(
            _make_suggestion(
                type_="task_suggestion",
                title=f"「{project.name}」有 {len(no_due)} 个任务缺少截止日期",
                description=f"任务「{names}」{suffix}未设置截止日期，建议根据项目计划补充。",
                priority="medium",
                project_id=project.id,
                action_type="create_task",
                params={
                    "task_ids": [t.id for t in no_due],
                    "action": "set_due_date",
                },
            )
        )
    return results


def _rule_stalled_projects(
    project: Project,
    tasks: list[ProjectTask],
) -> list[dict]:
    """Rule 7: 活跃项目无进行中任务 — 建议推动任务启动。"""
    results: list[dict] = []
    if project.status not in ("active", "risk"):
        return results
    if not tasks:
        return results

    has_in_progress = any(t.status == TaskStatus.IN_PROGRESS for t in tasks)
    has_pending = any(t.status == TaskStatus.TODO for t in tasks)

    if not has_in_progress and has_pending:
        todo_tasks = [t for t in tasks if t.status == TaskStatus.TODO]
        first_todo = todo_tasks[0]
        results.append(
            _make_suggestion(
                type_="risk_alert",
                title=f"「{project.name}」当前无进行中的任务",
                description=f"项目处于{project.status_label}状态但无任务在推进，建议启动任务「{first_todo.name}」。",
                priority="high",
                project_id=project.id,
                action_type="create_task",
                params={
                    "task_id": first_todo.id,
                    "task_name": first_todo.name,
                    "action": "start_task",
                },
            )
        )
    return results
