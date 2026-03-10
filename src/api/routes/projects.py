"""
Project & Task REST API endpoints.

GET    /api/projects                  — list all projects (optional ?status= filter)
POST   /api/projects                  — create a new project
GET    /api/projects/{project_id}     — project detail including tasks
PATCH  /api/projects/{project_id}     — partial-update a project
GET    /api/projects/{project_id}/tasks  — list tasks for a project
POST   /api/projects/{project_id}/tasks  — create a task under a project

PATCH  /api/tasks/{task_id}           — partial-update a task
"""
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.core.exceptions import ProjectNotFoundError, TaskNotFoundError
from src.core.models import Project, ProjectTask, TaskPriority, TaskStatus
from src.stores.project_store import (
    create_project,
    get_project,
    list_projects,
    update_project,
)
from src.stores.task_store import create_task, list_tasks, update_task

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/projects", tags=["projects"])
task_router = APIRouter(prefix="/tasks", tags=["tasks"])

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_list_item(project: Project) -> ProjectListItem:
    return ProjectListItem(
        id=project.id,
        name=project.name,
        project_type=project.project_type,
        stage=project.stage.value,
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
        status=task.status.value,
        priority=task.priority.value,
        due_date=task.due_date,
        description=task.description,
    )


def _to_detail(project: Project, tasks: list[ProjectTask]) -> ProjectDetail:
    return ProjectDetail(
        id=project.id,
        name=project.name,
        project_type=project.project_type,
        stage=project.stage.value,
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
    project = Project(
        id=str(uuid4()),
        name=req.name,
        project_type=req.project_type,
        budget_display=req.budget_display,
    )
    created = create_project(project)
    return _to_list_item(created)


@router.patch("/{project_id}", response_model=ProjectListItem)
async def update_project_endpoint(project_id: str, req: UpdateProjectRequest):
    updates = req.model_dump(exclude_none=True)
    updated = update_project(project_id, updates)
    if not updated:
        raise ProjectNotFoundError(f"Project {project_id} not found")
    return _to_list_item(updated)


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
    return _to_task_item(created)


# ---------------------------------------------------------------------------
# Task endpoints (top-level, for update by task_id)
# ---------------------------------------------------------------------------


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
    return _to_task_item(updated)
