"""
Project & Task REST API endpoints.

GET    /api/projects                  — list all projects (optional ?status= filter)
POST   /api/projects                  — create a new project
GET    /api/projects/{project_id}     — project detail including tasks
PATCH  /api/projects/{project_id}     — partial-update a project
DELETE /api/projects/{project_id}     — delete a project
GET    /api/projects/{project_id}/tasks  — list tasks for a project
POST   /api/projects/{project_id}/tasks  — create a task under a project
POST   /api/projects/{project_id}/transition  — transition project stage
GET    /api/projects/{project_id}/activities  — project activity log

POST   /api/projects/{project_id}/milestones               — create milestone
PATCH  /api/projects/{project_id}/milestones/{milestone_id} — update milestone
DELETE /api/projects/{project_id}/milestones/{milestone_id} — delete milestone

POST   /api/projects/{project_id}/risks               — create risk
PATCH  /api/projects/{project_id}/risks/{risk_id}     — update risk
DELETE /api/projects/{project_id}/risks/{risk_id}     — delete risk

PUT    /api/projects/{project_id}/team               — replace team members
POST   /api/projects/{project_id}/team               — add a team member
DELETE /api/projects/{project_id}/team/{member_name}  — remove a team member

GET    /api/tasks/{task_id}           — get single task detail
PATCH  /api/tasks/{task_id}           — partial-update a task
DELETE /api/tasks/{task_id}           — delete a task

GET    /api/activities/recent         — global recent activities
"""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.core.auth import require_auth
from src.core.exceptions import ProjectNotFoundError, TaskNotFoundError
from src.core.models import (
    ActivityEvent,
    Project,
    ProjectStage,
    ProjectTask,
    RiskItem,
    TaskPriority,
    TaskStatus,
)
from src.db.compat import val
from src.stores.activity_store import (
    create_activity,
    list_activities,
    list_recent_activities,
    list_task_comments,
)
from src.stores.project_store import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)
from src.stores.task_store import create_task, delete_task, get_task, list_all_tasks, list_tasks, update_task
from src.workflow.engine import can_transition, get_stage_label, get_valid_transitions

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/projects", tags=["projects"], dependencies=[Depends(require_auth)])
task_router = APIRouter(prefix="/tasks", tags=["tasks"], dependencies=[Depends(require_auth)])
activity_router = APIRouter(prefix="/activities", tags=["activities"], dependencies=[Depends(require_auth)])

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class TaskListItem(BaseModel):
    id: str
    project_id: str
    name: str
    assignee: str | None
    status: str
    priority: str
    due_date: str | None
    description: str


class ProjectListItem(BaseModel):
    id: str
    name: str
    project_type: str
    stage: str
    status: str
    status_label: str
    progress_pct: float
    due_date: str | None
    budget: str | None
    team_size: int
    team_members: list[str]


class ProjectDetail(ProjectListItem):
    budget_amount: float | None = None
    actual_spend: float | None = None
    risks: list[dict] = []
    milestones: list[dict] = []
    tasks: list[TaskListItem] = []


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    project_type: str = Field(default="", max_length=128)
    budget_display: str | None = None
    budget: float | None = None  # 数字预算（万元）
    due_date: str | None = None
    description: str | None = None
    manager: str | None = None
    team_members: list[str] = []  # 参与人员列表
    stage: str | None = None  # 初始阶段
    risk_level: str | None = None  # low/medium/high
    milestones: list[dict] | None = None  # 初始里程碑


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    status: str | None = None
    status_label: str | None = None
    progress_pct: float | None = None
    due_date: str | None = None


class CreateTaskRequest(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    assignee: str | None = None
    priority: str = "medium"
    due_date: str | None = None
    description: str = ""


class UpdateTaskRequest(BaseModel):
    name: str | None = None
    assignee: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None
    description: str | None = None


class TransitionRequest(BaseModel):
    target_stage: str = Field(min_length=1, description="目标阶段枚举值")


class CreateMilestoneRequest(BaseModel):
    name: str
    date: str | None = None
    status: str = "pending"  # pending, completed, delayed


class UpdateMilestoneRequest(BaseModel):
    name: str | None = None
    date: str | None = None
    status: str | None = None


class CreateRiskRequest(BaseModel):
    description: str
    level: str = "medium"  # low, medium, high, critical
    mitigation: str = ""


class UpdateRiskRequest(BaseModel):
    description: str | None = None
    level: str | None = None
    mitigation: str | None = None


class AddTeamMemberRequest(BaseModel):
    name: str


class UpdateTeamRequest(BaseModel):
    members: list[str]


class CreateTaskCommentRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4096)
    author: str = "当前用户"


class TaskWithProject(TaskListItem):
    project_name: str


class DocumentListItem(BaseModel):
    id: str
    title: str
    doc_type: str
    project_id: str | None
    content_summary: str
    version: str
    author: str
    status: str


class ActivityListItem(BaseModel):
    id: str
    project_id: str
    event_type: str
    actor: str
    summary: str
    detail: dict = {}
    created_at: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_list_item(project: Project) -> ProjectListItem:
    return ProjectListItem(
        id=project.id,
        name=project.name,
        project_type=project.project_type,
        stage=val(project.stage),
        status=project.status,
        status_label=project.status_label,
        progress_pct=project.progress_pct,
        due_date=project.due_date,
        budget=project.budget_display,
        team_size=len(project.team_members),
        team_members=project.team_members,
    )


def _to_task_item(task: ProjectTask) -> TaskListItem:
    return TaskListItem(
        id=task.id,
        project_id=task.project_id,
        name=task.name,
        assignee=task.assignee,
        status=val(task.status),
        priority=val(task.priority),
        due_date=task.due_date,
        description=task.description,
    )


def _to_activity_item(activity: ActivityEvent) -> ActivityListItem:
    return ActivityListItem(
        id=activity.id,
        project_id=activity.project_id,
        event_type=activity.event_type,
        actor=activity.actor,
        summary=activity.summary,
        detail=activity.detail,
        created_at=activity.created_at.isoformat(),
    )


def _to_detail(project: Project, tasks: list[ProjectTask]) -> ProjectDetail:
    return ProjectDetail(
        id=project.id,
        name=project.name,
        project_type=project.project_type,
        stage=val(project.stage),
        status=project.status,
        status_label=project.status_label,
        progress_pct=project.progress_pct,
        due_date=project.due_date,
        budget=project.budget_display,
        team_size=len(project.team_members),
        team_members=project.team_members,
        budget_amount=project.budget,
        actual_spend=project.actual_spend,
        risks=[r.model_dump() for r in project.risks],
        milestones=project.milestones,
        tasks=[_to_task_item(t) for t in tasks],
    )


# ---------------------------------------------------------------------------
# Project endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=list[ProjectListItem])
async def list_projects_endpoint(status: str | None = None):
    projects = list_projects(status=status)
    return [_to_list_item(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project_endpoint(project_id: str):
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    tasks = list_tasks(project_id)
    return _to_detail(project, tasks)


@router.post("", response_model=ProjectListItem, status_code=201)
async def create_project_endpoint(req: CreateProjectRequest):
    # Build team members: manager first, then additional members (deduped)
    members: list[str] = []
    if req.manager:
        members.append(req.manager)
    for m in req.team_members:
        if m and m not in members:
            members.append(m)

    # Resolve initial stage
    stage = ProjectStage.INITIATION
    if req.stage:
        try:
            stage = ProjectStage(req.stage)
        except ValueError:
            pass

    # Build initial risks from risk_level
    risks = []
    if req.risk_level and req.risk_level in ("medium", "high"):
        risks.append(
            RiskItem(
                title="项目初始风险评估",
                description=f"项目创建时评估风险等级为{'中' if req.risk_level == 'medium' else '高'}",
                severity=req.risk_level,
                owner=req.manager,
            )
        )

    project = Project(
        id=str(uuid4()),
        name=req.name,
        project_type=req.project_type,
        budget_display=req.budget_display,
        budget=req.budget,
        due_date=req.due_date,
        stage=stage,
        team_members=members,
        risks=risks,
        milestones=req.milestones or [],
        metadata={"description": req.description} if req.description else {},
    )
    created = create_project(project)
    return _to_list_item(created)


@router.patch("/{project_id}", response_model=ProjectListItem)
async def update_project_endpoint(project_id: str, req: UpdateProjectRequest):
    updates = req.model_dump(exclude_none=True)
    updated = update_project(project_id, updates)
    if not updated:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    # 写入活动日志
    detail = {"before": {}, "after": {}}
    for key, value in updates.items():
        detail["after"][key] = str(value)
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="status_changed",
            actor="系统",
            summary="项目信息已更新",
            detail=detail,
        )
    )

    return _to_list_item(updated)


@router.delete("/{project_id}", status_code=204)
async def delete_project_endpoint(project_id: str):
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    deleted = delete_project(project_id)
    if not deleted:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="project_deleted",
            actor="系统",
            summary=f"项目 '{project.name}' 已删除",
            detail={"project_id": project_id, "project_name": project.name},
        )
    )

    return None


# ---------------------------------------------------------------------------
# Task endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.get("/{project_id}/tasks", response_model=list[TaskListItem])
async def list_tasks_endpoint(project_id: str):
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    tasks = list_tasks(project_id)
    return [_to_task_item(t) for t in tasks]


@router.post("/{project_id}/tasks", response_model=TaskListItem, status_code=201)
async def create_task_endpoint(project_id: str, req: CreateTaskRequest):
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    task = ProjectTask(
        project_id=project_id,
        name=req.name,
        assignee=req.assignee,
        priority=TaskPriority(req.priority) if req.priority else TaskPriority.MEDIUM,
        due_date=req.due_date,
        description=req.description,
    )
    created = create_task(task)

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="task_created",
            actor=created.assignee or "系统",
            summary=f"新建任务: {created.name}",
            detail={"task_id": created.id, "task_name": created.name},
        )
    )

    return _to_task_item(created)


# ---------------------------------------------------------------------------
# Project documents endpoint
# ---------------------------------------------------------------------------


@router.get("/{project_id}/documents", response_model=list[DocumentListItem])
async def list_project_documents_endpoint(project_id: str):
    """Return all documents belonging to a specific project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    from src.stores.document_store import list_documents

    documents = list_documents(project_id=project_id)
    return [
        DocumentListItem(
            id=d.id,
            title=d.title,
            doc_type=d.doc_type,
            project_id=d.project_id,
            content_summary=d.content_summary,
            version=d.version,
            author=d.author,
            status=d.status,
        )
        for d in documents
    ]


# ---------------------------------------------------------------------------
# Task endpoints (top-level, for update by task_id)
# ---------------------------------------------------------------------------


@task_router.get("", response_model=list[TaskWithProject])
async def list_all_tasks_endpoint(
    assignee: str | None = None,
    status: str | None = None,
    priority: str | None = None,
):
    """Return all tasks across projects, optionally filtered."""
    tasks = list_all_tasks(assignee=assignee, status=status, priority=priority)
    results: list[TaskWithProject] = []
    for t in tasks:
        project = get_project(t.project_id)
        project_name = project.name if project else ""
        results.append(
            TaskWithProject(
                id=t.id,
                project_id=t.project_id,
                name=t.name,
                assignee=t.assignee,
                status=val(t.status),
                priority=val(t.priority),
                due_date=t.due_date,
                description=t.description,
                project_name=project_name,
            )
        )
    return results


@task_router.patch("/{task_id}", response_model=TaskListItem)
async def update_task_endpoint(task_id: str, req: UpdateTaskRequest):
    updates = req.model_dump(exclude_none=True)
    # Convert raw strings to enum values so model_copy preserves enum types
    if "status" in updates:
        updates["status"] = TaskStatus(updates["status"])
    if "priority" in updates:
        updates["priority"] = TaskPriority(updates["priority"])
    updated = update_task(task_id, updates)
    if not updated:
        raise TaskNotFoundError(f"Task {task_id} not found")

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=updated.project_id,
            event_type="task_updated",
            actor=updated.assignee or "系统",
            summary=f"任务 '{updated.name}' 已更新",
            detail={"task_id": task_id, "updates": {k: str(v) for k, v in updates.items()}},
        )
    )

    return _to_task_item(updated)


@task_router.get("/{task_id}", response_model=TaskListItem)
async def get_task_endpoint(task_id: str):
    task = get_task(task_id)
    if not task:
        raise TaskNotFoundError(f"Task {task_id} not found")
    return _to_task_item(task)


@task_router.delete("/{task_id}", status_code=204)
async def delete_task_endpoint(task_id: str):
    task = get_task(task_id)
    if not task:
        raise TaskNotFoundError(f"Task {task_id} not found")

    deleted = delete_task(task_id)
    if not deleted:
        raise TaskNotFoundError(f"Task {task_id} not found")

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=task.project_id,
            event_type="task_deleted",
            actor=task.assignee or "系统",
            summary=f"任务 '{task.name}' 已删除",
            detail={"task_id": task_id, "task_name": task.name},
        )
    )

    return None


# ---------------------------------------------------------------------------
# Task comment endpoints
# ---------------------------------------------------------------------------


@task_router.get("/{task_id}/comments", response_model=list[ActivityListItem])
async def list_task_comments_endpoint(task_id: str):
    """Return all comments for a specific task."""
    task = get_task(task_id)
    if not task:
        raise TaskNotFoundError(f"Task {task_id} not found")
    comments = list_task_comments(task_id)
    return [_to_activity_item(c) for c in comments]


@task_router.post("/{task_id}/comments", response_model=ActivityListItem, status_code=201)
async def create_task_comment_endpoint(task_id: str, req: CreateTaskCommentRequest):
    """Create a comment / update on a task."""
    task = get_task(task_id)
    if not task:
        raise TaskNotFoundError(f"Task {task_id} not found")

    activity = ActivityEvent(
        project_id=task.project_id,
        event_type="task_comment",
        actor=req.author,
        summary=req.content,
        detail={"task_id": task_id, "task_name": task.name},
    )
    created = create_activity(activity)
    return _to_activity_item(created)


# ---------------------------------------------------------------------------
# Stage transition endpoint
# ---------------------------------------------------------------------------


@router.post("/{project_id}/transition", response_model=ProjectListItem)
async def transition_project_endpoint(project_id: str, req: TransitionRequest):
    """Transition a project to a new stage using the workflow engine."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    # 校验目标阶段枚举值
    try:
        target_stage = ProjectStage(req.target_stage)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_STAGE",
                "message": f"无效的阶段值: {req.target_stage}",
                "valid_stages": [s.value for s in ProjectStage],
            },
        )

    # 校验转换合法性
    if not can_transition(project.stage, target_stage):
        valid = get_valid_transitions(project.stage)
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_TRANSITION",
                "message": f"无法从「{get_stage_label(project.stage)}」转换到「{get_stage_label(target_stage)}」",
                "current_stage": val(project.stage),
                "current_label": get_stage_label(project.stage),
                "valid_transitions": valid,
            },
        )

    # 执行阶段转换
    old_stage = project.stage
    new_label = get_stage_label(target_stage)
    updated = update_project(
        project_id,
        {
            "stage": target_stage,
            "status_label": new_label,
        },
    )

    # 写入活动日志
    activity = ActivityEvent(
        project_id=project_id,
        event_type="stage_transition",
        actor="系统",
        summary=f"项目从「{get_stage_label(old_stage)}」阶段推进到「{new_label}」阶段",
        detail={
            "before": {"stage": old_stage.value, "stage_label": get_stage_label(old_stage)},
            "after": {"stage": target_stage.value, "stage_label": new_label},
        },
    )
    create_activity(activity)

    return _to_list_item(updated)  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# Activity endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.get("/{project_id}/activities", response_model=list[ActivityListItem])
async def list_project_activities_endpoint(project_id: str):
    """Return activity log for a specific project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    activities = list_activities(project_id)
    return [_to_activity_item(a) for a in activities]


# ---------------------------------------------------------------------------
# Milestone endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.post("/{project_id}/milestones", response_model=dict, status_code=201)
async def create_milestone_endpoint(project_id: str, req: CreateMilestoneRequest):
    """Create a milestone under a project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    milestone = {"name": req.name, "date": req.date, "status": req.status}
    milestones = list(project.milestones) + [milestone]
    update_project(project_id, {"milestones": milestones})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="milestone_created",
            actor="系统",
            summary=f"新增里程碑: {req.name}",
            detail={"milestone": milestone},
        )
    )

    return milestone


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=dict)
async def update_milestone_endpoint(project_id: str, milestone_id: int, req: UpdateMilestoneRequest):
    """Update a milestone by index (milestone_id is 0-based index)."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    if milestone_id < 0 or milestone_id >= len(project.milestones):
        raise HTTPException(status_code=404, detail=f"Milestone index {milestone_id} not found")

    milestones = [dict(m) for m in project.milestones]
    updates = req.model_dump(exclude_none=True)
    milestones[milestone_id].update(updates)
    update_project(project_id, {"milestones": milestones})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="milestone_updated",
            actor="系统",
            summary=f"里程碑 '{milestones[milestone_id].get('name', '')}' 已更新",
            detail={"milestone_id": milestone_id, "updates": updates},
        )
    )

    return milestones[milestone_id]


@router.delete("/{project_id}/milestones/{milestone_id}", status_code=204)
async def delete_milestone_endpoint(project_id: str, milestone_id: int):
    """Delete a milestone by index (milestone_id is 0-based index)."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    if milestone_id < 0 or milestone_id >= len(project.milestones):
        raise HTTPException(status_code=404, detail=f"Milestone index {milestone_id} not found")

    milestones = [dict(m) for m in project.milestones]
    removed = milestones.pop(milestone_id)
    update_project(project_id, {"milestones": milestones})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="milestone_deleted",
            actor="系统",
            summary=f"里程碑 '{removed.get('name', '')}' 已删除",
            detail={"milestone_id": milestone_id, "milestone": removed},
        )
    )

    return None


# ---------------------------------------------------------------------------
# Risk endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.post("/{project_id}/risks", response_model=dict, status_code=201)
async def create_risk_endpoint(project_id: str, req: CreateRiskRequest):
    """Create a risk under a project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    risk = RiskItem(
        title=req.description,
        description=req.description,
        severity=req.level,
        owner=None,
    )
    risks = list(project.risks) + [risk]
    update_project(project_id, {"risks": risks})

    risk_dict = risk.model_dump()

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="risk_created",
            actor="系统",
            summary=f"新增风险: {req.description}",
            detail={"risk": risk_dict},
        )
    )

    return risk_dict


@router.patch("/{project_id}/risks/{risk_id}", response_model=dict)
async def update_risk_endpoint(project_id: str, risk_id: int, req: UpdateRiskRequest):
    """Update a risk by index (risk_id is 0-based index)."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    if risk_id < 0 or risk_id >= len(project.risks):
        raise HTTPException(status_code=404, detail=f"Risk index {risk_id} not found")

    risks = list(project.risks)
    existing = risks[risk_id]
    updates = req.model_dump(exclude_none=True)

    # Map request fields to RiskItem fields
    risk_updates: dict = {}
    if "description" in updates:
        risk_updates["description"] = updates["description"]
    if "level" in updates:
        risk_updates["severity"] = updates["level"]
    if "mitigation" in updates:
        risk_updates["description"] = updates.get("description", existing.description)

    risks[risk_id] = existing.model_copy(update=risk_updates)
    update_project(project_id, {"risks": risks})

    result = risks[risk_id].model_dump()

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="risk_updated",
            actor="系统",
            summary=f"风险 '{risks[risk_id].title}' 已更新",
            detail={"risk_id": risk_id, "updates": updates},
        )
    )

    return result


@router.delete("/{project_id}/risks/{risk_id}", status_code=204)
async def delete_risk_endpoint(project_id: str, risk_id: int):
    """Delete a risk by index (risk_id is 0-based index)."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    if risk_id < 0 or risk_id >= len(project.risks):
        raise HTTPException(status_code=404, detail=f"Risk index {risk_id} not found")

    risks = list(project.risks)
    removed = risks.pop(risk_id)
    update_project(project_id, {"risks": risks})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="risk_deleted",
            actor="系统",
            summary=f"风险 '{removed.title}' 已删除",
            detail={"risk_id": risk_id, "risk": removed.model_dump()},
        )
    )

    return None


# ---------------------------------------------------------------------------
# Team member endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.put("/{project_id}/team", response_model=list[str])
async def replace_team_endpoint(project_id: str, req: UpdateTeamRequest):
    """Replace the entire team members list."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    updated = update_project(project_id, {"team_members": req.members})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="team_updated",
            actor="系统",
            summary="团队成员列表已替换",
            detail={"before": project.team_members, "after": req.members},
        )
    )

    return updated.team_members  # type: ignore[union-attr]


@router.post("/{project_id}/team", response_model=list[str], status_code=201)
async def add_team_member_endpoint(project_id: str, req: AddTeamMemberRequest):
    """Add a team member to the project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    if req.name in project.team_members:
        raise HTTPException(status_code=409, detail=f"成员 '{req.name}' 已在团队中")

    members = list(project.team_members) + [req.name]
    updated = update_project(project_id, {"team_members": members})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="team_member_added",
            actor="系统",
            summary=f"新增团队成员: {req.name}",
            detail={"member": req.name},
        )
    )

    return updated.team_members  # type: ignore[union-attr]


@router.delete("/{project_id}/team/{member_name}", status_code=204)
async def remove_team_member_endpoint(project_id: str, member_name: str):
    """Remove a team member from the project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")

    if member_name not in project.team_members:
        raise HTTPException(status_code=404, detail=f"成员 '{member_name}' 不在团队中")

    members = [m for m in project.team_members if m != member_name]
    update_project(project_id, {"team_members": members})

    # 写入活动日志
    create_activity(
        ActivityEvent(
            project_id=project_id,
            event_type="team_member_removed",
            actor="系统",
            summary=f"移除团队成员: {member_name}",
            detail={"member": member_name},
        )
    )

    return None


# ---------------------------------------------------------------------------
# Procurement endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.get("/{project_id}/procurement")
async def get_project_procurement(project_id: str):
    """Return all procurement packages for a project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    from src.stores.procurement_store import list_by_project as list_procurement

    items = list_procurement(project_id)
    return {"items": [item.model_dump() for item in items]}


@router.post("/{project_id}/procurement", status_code=201)
async def create_procurement(project_id: str, body: dict):
    """Create a new procurement package under a project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    from src.core.models import ProcurementPackage
    from src.stores.procurement_store import create as create_pkg

    pkg = ProcurementPackage(
        project_id=project_id,
        name=body.get("name", "未命名"),
        category=body.get("category", ""),
        supplier=body.get("supplier"),
        budget_amount=body.get("budget_amount"),
        plan_date=body.get("plan_date"),
        responsible=body.get("responsible"),
        notes=body.get("notes", ""),
    )
    created = create_pkg(pkg)
    return created.model_dump()


@router.put("/{project_id}/procurement/{pkg_id}")
@router.patch("/{project_id}/procurement/{pkg_id}")
async def update_procurement(project_id: str, pkg_id: str, body: dict):
    """Update a procurement package."""
    from src.stores.procurement_store import update as update_pkg

    updated = update_pkg(pkg_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Procurement package not found")
    return updated.model_dump()


@router.delete("/{project_id}/procurement/{pkg_id}", status_code=204)
async def delete_procurement(project_id: str, pkg_id: str):
    """Delete a procurement package."""
    from src.stores.procurement_store import delete as delete_pkg

    if not delete_pkg(pkg_id):
        raise HTTPException(status_code=404, detail="Procurement package not found")


# ---------------------------------------------------------------------------
# Process record endpoints (nested under projects)
# ---------------------------------------------------------------------------


@router.get("/{project_id}/processes")
async def get_project_processes(project_id: str, record_type: str | None = None):
    """Return all process records for a project, optionally filtered by type."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    from src.stores.process_store import list_by_project as list_processes

    items = list_processes(project_id, record_type)
    return {"items": [item.model_dump() for item in items]}


@router.post("/{project_id}/processes", status_code=201)
async def create_process_record(project_id: str, body: dict):
    """Create a new process record under a project."""
    project = get_project(project_id)
    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    from src.stores.process_store import create as create_record

    record = create_record(project_id, body)
    return record.model_dump()


@router.patch("/{project_id}/processes/{record_id}")
async def update_process_record(project_id: str, record_id: str, body: dict):
    """Update a process record."""
    from src.stores.process_store import update as update_record

    updated = update_record(record_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Process record not found")
    return updated.model_dump()


@router.delete("/{project_id}/processes/{record_id}", status_code=204)
async def delete_process_record(project_id: str, record_id: str):
    """Delete a process record."""
    from src.stores.process_store import delete as delete_record

    if not delete_record(record_id):
        raise HTTPException(status_code=404, detail="Process record not found")


# ---------------------------------------------------------------------------
# Global activity endpoints
# ---------------------------------------------------------------------------


@activity_router.get("/recent", response_model=list[ActivityListItem])
async def list_recent_activities_endpoint(limit: int = Query(default=10, ge=1, le=100)):
    """Return the most recent activities across all projects."""
    activities = list_recent_activities(limit=limit)
    return [_to_activity_item(a) for a in activities]
