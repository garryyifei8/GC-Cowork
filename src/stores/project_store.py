"""In-memory project CRUD store with seed data."""
from __future__ import annotations

from src.core.models import Project, ProjectStage

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_projects: dict[str, Project] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_projects() -> None:
    """Populate the store with the 3 canonical seed projects."""
    global _seeded
    if _seeded:
        return

    seed_data = [
        Project(
            id="proj-001",
            name="省立博物馆EPC工程",
            project_type="EPC / 展馆",
            stage=ProjectStage.CONSTRUCTION,
            status="active",
            status_label="施工中",
            progress_pct=68.0,
            due_date="2026-10-15",
            budget_display="1.2亿",
            budget=12000.0,
            team_members=[
                "张工",
                "李设计",
                "王监理",
                "刘采购",
                "陈施工",
                "赵结构",
                "周机电",
                "吴幕墙",
                "郑消防",
                "孙智能",
                "钱景观",
                "冯展陈",
            ],
        ),
        Project(
            id="proj-002",
            name="发改委平台信息化二期",
            project_type="信息化开发",
            stage=ProjectStage.CONSTRUCTION,
            status="risk",
            status_label="进度延误",
            progress_pct=35.0,
            due_date="2026-06-30",
            budget_display="450万",
            budget=450.0,
            team_members=[
                "赵开发",
                "钱前端",
                "孙后端",
                "李测试",
                "周运维",
                "吴产品",
                "郑架构",
                "冯数据",
            ],
        ),
        Project(
            id="proj-003",
            name="智慧园区专项债可研",
            project_type="专项债咨询",
            stage=ProjectStage.INITIATION,
            status="planning",
            status_label="立项评估",
            progress_pct=15.0,
            due_date="2026-04-20",
            budget_display="80万",
            budget=80.0,
            team_members=[
                "陈咨询",
                "林财务",
                "黄政策",
                "徐调研",
                "杨报告",
            ],
        ),
    ]

    for project in seed_data:
        _projects[project.id] = project

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------

def list_projects(status: str | None = None) -> list[Project]:
    """Return all projects, optionally filtered by status."""
    projects = list(_projects.values())
    if status is not None:
        projects = [p for p in projects if p.status == status]
    return projects


def get_project(project_id: str) -> Project | None:
    """Return a single project by ID, or None if not found."""
    return _projects.get(project_id)


def create_project(project: Project) -> Project:
    """Insert a new project into the store and return it."""
    _projects[project.id] = project
    return project


def update_project(project_id: str, updates: dict) -> Project | None:
    """Apply a dict of updates to an existing project and return it.

    Returns None if the project does not exist.
    """
    existing = _projects.get(project_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _projects[project_id] = updated
    return updated


def delete_project(project_id: str) -> bool:
    """Remove a project from the store.

    Returns True if the project was found and deleted, False otherwise.
    """
    if project_id in _projects:
        del _projects[project_id]
        return True
    return False
