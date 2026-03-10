"""In-memory task CRUD store with seed data."""
from __future__ import annotations

from src.core.models import ProjectTask, TaskPriority, TaskStatus

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_tasks: dict[str, ProjectTask] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_tasks() -> None:
    """Populate the store with seed tasks for each project."""
    global _seeded
    if _seeded:
        return

    seed_data = [
        # ----------------------------------------------------------------
        # proj-001: 省立博物馆EPC工程
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-001-01",
            project_id="proj-001",
            name="完成展厅A区幕墙施工",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-15",
            description="展厅A区全部幕墙单元安装及打胶收边",
        ),
        ProjectTask(
            id="task-001-02",
            project_id="proj-001",
            name="机电安装调试",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-05-01",
            description="强弱电、暖通、给排水系统安装及联调",
        ),
        ProjectTask(
            id="task-001-03",
            project_id="proj-001",
            name="消防系统验收准备",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-20",
            description="整理消防竣工资料，联系消防主管部门预约验收",
        ),
        ProjectTask(
            id="task-001-04",
            project_id="proj-001",
            name="展陈设计深化",
            status=TaskStatus.REVIEW,
            priority=TaskPriority.MEDIUM,
            due_date="2026-04-30",
            description="展陈施工图深化及业主审核",
        ),
        ProjectTask(
            id="task-001-05",
            project_id="proj-001",
            name="智能化系统布线",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-06-15",
            description="智能照明、门禁、安防等系统综合布线施工",
        ),
        # ----------------------------------------------------------------
        # proj-002: 发改委平台信息化二期
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-002-01",
            project_id="proj-002",
            name="后端API开发",
            assignee="赵开发",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-10",
            description="核心业务模块RESTful API开发",
        ),
        ProjectTask(
            id="task-002-02",
            project_id="proj-002",
            name="数据迁移方案设计",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date="2026-04-20",
            description="一期存量数据清洗、映射及迁移方案编制",
        ),
        ProjectTask(
            id="task-002-03",
            project_id="proj-002",
            name="前端页面开发",
            status=TaskStatus.BLOCKED,
            priority=TaskPriority.HIGH,
            due_date="2026-04-25",
            description="等待后端接口文档确认后方可开始，当前处于阻塞状态",
        ),
        ProjectTask(
            id="task-002-04",
            project_id="proj-002",
            name="系统集成测试",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-15",
            description="全模块联调及压力测试",
        ),
        ProjectTask(
            id="task-002-05",
            project_id="proj-002",
            name="用户培训材料编写",
            status=TaskStatus.TODO,
            priority=TaskPriority.LOW,
            due_date="2026-06-01",
            description="操作手册、视频教程及培训PPT制作",
        ),
        # ----------------------------------------------------------------
        # proj-003: 智慧园区专项债可研
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-003-01",
            project_id="proj-003",
            name="项目可研报告编制",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-03-25",
            description="完成投资可行性研究报告正文编写",
        ),
        ProjectTask(
            id="task-003-02",
            project_id="proj-003",
            name="专项债申报材料准备",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date="2026-04-01",
            description="按财政部要求整理专项债项目申报全套资料",
        ),
        ProjectTask(
            id="task-003-03",
            project_id="proj-003",
            name="竞品调研分析",
            status=TaskStatus.DONE,
            priority=TaskPriority.MEDIUM,
            due_date="2026-03-15",
            description="调研3个同类智慧园区项目，形成对标分析报告",
        ),
        ProjectTask(
            id="task-003-04",
            project_id="proj-003",
            name="技术方案初稿",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-04-10",
            description="智慧园区信息化系统技术架构方案初稿",
        ),
    ]

    for task in seed_data:
        _tasks[task.id] = task

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------

def list_tasks(project_id: str) -> list[ProjectTask]:
    """Return all tasks belonging to a specific project."""
    return [t for t in _tasks.values() if t.project_id == project_id]


def get_task(task_id: str) -> ProjectTask | None:
    """Return a single task by ID, or None if not found."""
    return _tasks.get(task_id)


def create_task(task: ProjectTask) -> ProjectTask:
    """Insert a new task into the store and return it."""
    _tasks[task.id] = task
    return task


def update_task(task_id: str, updates: dict) -> ProjectTask | None:
    """Apply a dict of updates to an existing task and return it.

    Returns None if the task does not exist.
    """
    existing = _tasks.get(task_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _tasks[task_id] = updated
    return updated


def delete_task(task_id: str) -> bool:
    """Remove a task from the store.

    Returns True if the task was found and deleted, False otherwise.
    """
    if task_id in _tasks:
        del _tasks[task_id]
        return True
    return False
