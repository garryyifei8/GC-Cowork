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
            assignee="吴幕墙",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-15",
            description="展厅A区全部幕墙单元安装及打胶收边",
        ),
        ProjectTask(
            id="task-001-02",
            project_id="proj-001",
            name="机电安装调试",
            assignee="周机电",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-05-01",
            description="强弱电、暖通、给排水系统安装及联调",
        ),
        ProjectTask(
            id="task-001-03",
            project_id="proj-001",
            name="消防系统验收准备",
            assignee="郑消防",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-20",
            description="整理消防竣工资料，联系消防主管部门预约验收",
        ),
        ProjectTask(
            id="task-001-04",
            project_id="proj-001",
            name="展陈设计深化",
            assignee="冯展陈",
            status=TaskStatus.REVIEW,
            priority=TaskPriority.MEDIUM,
            due_date="2026-04-30",
            description="展陈施工图深化及业主审核",
        ),
        ProjectTask(
            id="task-001-05",
            project_id="proj-001",
            name="智能化系统布线",
            assignee="孙智能",
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
            assignee="冯数据",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date="2026-04-20",
            description="一期存量数据清洗、映射及迁移方案编制",
        ),
        ProjectTask(
            id="task-002-03",
            project_id="proj-002",
            name="前端页面开发",
            assignee="钱前端",
            status=TaskStatus.BLOCKED,
            priority=TaskPriority.HIGH,
            due_date="2026-04-25",
            description="等待后端接口文档确认后方可开始，当前处于阻塞状态",
        ),
        ProjectTask(
            id="task-002-04",
            project_id="proj-002",
            name="系统集成测试",
            assignee="李测试",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-15",
            description="全模块联调及压力测试",
        ),
        ProjectTask(
            id="task-002-05",
            project_id="proj-002",
            name="用户培训材料编写",
            assignee="吴产品",
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
            assignee="杨报告",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-03-25",
            description="完成投资可行性研究报告正文编写",
        ),
        ProjectTask(
            id="task-003-02",
            project_id="proj-003",
            name="专项债申报材料准备",
            assignee="林财务",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date="2026-04-01",
            description="按财政部要求整理专项债项目申报全套资料",
        ),
        ProjectTask(
            id="task-003-03",
            project_id="proj-003",
            name="竞品调研分析",
            assignee="徐调研",
            status=TaskStatus.DONE,
            priority=TaskPriority.MEDIUM,
            due_date="2026-03-15",
            description="调研3个同类智慧园区项目，形成对标分析报告",
        ),
        ProjectTask(
            id="task-003-04",
            project_id="proj-003",
            name="技术方案初稿",
            assignee="陈咨询",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-04-10",
            description="智慧园区信息化系统技术架构方案初稿",
        ),
        # ----------------------------------------------------------------
        # proj-004: 市民服务中心智能化改造
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-004-01",
            project_id="proj-004",
            name="智能化系统方案设计",
            assignee="方设计",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-30",
            description="含楼宇自控、安防监控、智能照明、会议系统等子系统方案设计",
        ),
        ProjectTask(
            id="task-004-02",
            project_id="proj-004",
            name="结构加固方案评审",
            assignee="吕结构",
            status=TaskStatus.REVIEW,
            priority=TaskPriority.HIGH,
            due_date="2026-04-15",
            description="既有建筑结构安全鉴定及加固设计方案内部评审",
        ),
        ProjectTask(
            id="task-004-03",
            project_id="proj-004",
            name="BIM模型创建",
            assignee="韩总工",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-20",
            description="基于Revit创建建筑+结构+机电全专业BIM模型",
        ),
        ProjectTask(
            id="task-004-04",
            project_id="proj-004",
            name="暖通空调系统选型",
            assignee="宋暖通",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-30",
            description="中央空调系统选型比较及能耗分析报告",
        ),
        # ----------------------------------------------------------------
        # proj-005: 高新区数据中台建设
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-005-01",
            project_id="proj-005",
            name="数据治理规范制定",
            assignee="许数据",
            status=TaskStatus.DONE,
            priority=TaskPriority.HIGH,
            due_date="2026-03-01",
            description="数据标准、数据质量规范、元数据管理规范编制",
        ),
        ProjectTask(
            id="task-005-02",
            project_id="proj-005",
            name="ETL工具采购评估",
            assignee="何架构",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-10",
            description="对DataX、Kettle、SeaTunnel等ETL工具进行POC测试对比",
        ),
        ProjectTask(
            id="task-005-03",
            project_id="proj-005",
            name="数据仓库架构设计",
            assignee="邓开发",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-25",
            description="ODS/DWD/DWS/ADS分层架构设计及主题域划分",
        ),
        ProjectTask(
            id="task-005-04",
            project_id="proj-005",
            name="API网关选型",
            assignee="汪产品",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-05-10",
            description="数据服务API网关技术选型（Kong/APISIX/自研）",
        ),
        # ----------------------------------------------------------------
        # proj-006: 老旧小区改造EPC
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-006-01",
            project_id="proj-006",
            name="竣工资料归档",
            assignee="秦资料",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-03-20",
            description="整理全套竣工图纸、隐蔽工程记录、检验批验收资料",
        ),
        ProjectTask(
            id="task-006-02",
            project_id="proj-006",
            name="质量验收检查",
            assignee="韩质检",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-03-25",
            description="分户验收及公共区域质量检查整改",
        ),
        ProjectTask(
            id="task-006-03",
            project_id="proj-006",
            name="绿化补种移交",
            assignee="蒋施工",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-03-28",
            description="小区绿化补种及景观设施移交物业",
        ),
        # ----------------------------------------------------------------
        # proj-007: 交通枢纽专项债申报
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-007-01",
            project_id="proj-007",
            name="投标文件编制",
            assignee="廖咨询",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-01",
            description="编制项目投标书技术标及商务标",
        ),
        ProjectTask(
            id="task-007-02",
            project_id="proj-007",
            name="项目收益测算",
            assignee="余财务",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-03-28",
            description="交通枢纽项目专项债收益与融资自求平衡测算",
        ),
        ProjectTask(
            id="task-007-03",
            project_id="proj-007",
            name="政策合规性审查",
            assignee="贾分析",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-04-05",
            description="核查项目是否符合最新专项债资金使用范围及合规要求",
        ),
        # ----------------------------------------------------------------
        # proj-008: 省教育厅考试系统升级
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-008-01",
            project_id="proj-008",
            name="高并发压测方案",
            assignee="彭运维",
            status=TaskStatus.BLOCKED,
            priority=TaskPriority.HIGH,
            due_date="2026-04-15",
            description="模拟50万并发在线考试场景压力测试，等待测试环境部署",
        ),
        ProjectTask(
            id="task-008-02",
            project_id="proj-008",
            name="题库迁移开发",
            assignee="田后端",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-05-01",
            description="将旧系统题库数据迁移至新架构，含试题格式转换",
        ),
        ProjectTask(
            id="task-008-03",
            project_id="proj-008",
            name="前端考试界面重构",
            assignee="姚前端",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date="2026-05-20",
            description="基于React重构在线考试界面，支持PC/平板双端适配",
        ),
        ProjectTask(
            id="task-008-04",
            project_id="proj-008",
            name="安全等保测评准备",
            assignee="潘安全",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            due_date="2026-06-15",
            description="按等保三级要求准备系统安全测评相关材料",
        ),
        # ----------------------------------------------------------------
        # proj-009: 文化产业园区景观工程 (已完工)
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-009-01",
            project_id="proj-009",
            name="结算审计配合",
            assignee="薛景观",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-03-30",
            description="配合审计单位完成工程量复核及结算审计",
        ),
        ProjectTask(
            id="task-009-02",
            project_id="proj-009",
            name="质保期维护计划",
            assignee="贺绿化",
            status=TaskStatus.DONE,
            priority=TaskPriority.MEDIUM,
            due_date="2026-02-28",
            description="编制绿化养护及景观设施两年质保期维护方案",
        ),
        # ----------------------------------------------------------------
        # proj-010: 智慧水务监测平台
        # ----------------------------------------------------------------
        ProjectTask(
            id="task-010-01",
            project_id="proj-010",
            name="需求调研",
            assignee="武产品",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date="2026-04-15",
            description="走访水务局各科室，梳理水质监测、管网监控、洪涝预警需求",
        ),
        ProjectTask(
            id="task-010-02",
            project_id="proj-010",
            name="技术架构预研",
            assignee="严架构",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date="2026-04-30",
            description="IoT平台选型、时序数据库选型、大屏可视化技术预研",
        ),
        ProjectTask(
            id="task-010-03",
            project_id="proj-010",
            name="合同附件整理",
            assignee="金开发",
            status=TaskStatus.DONE,
            priority=TaskPriority.MEDIUM,
            due_date="2026-03-10",
            description="整理合同技术附件、验收标准及里程碑付款节点",
        ),
    ]

    for task in seed_data:
        _tasks[task.id] = task

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------


def list_all_tasks(
    assignee: str | None = None,
    status: str | None = None,
    priority: str | None = None,
) -> list[ProjectTask]:
    """Return all tasks, optionally filtered."""
    tasks = list(_tasks.values())
    if assignee:
        tasks = [t for t in tasks if t.assignee == assignee]
    if status:
        tasks = [t for t in tasks if t.status.value == status]
    if priority:
        tasks = [t for t in tasks if t.priority.value == priority]
    return tasks


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


# ---------------------------------------------------------------------------
# Supabase delegation — when USE_SUPABASE=true, override all exports
# ---------------------------------------------------------------------------
from src.db.client import use_supabase as _use_sb  # noqa: E402

if _use_sb():
    from src.stores.supabase.task_store import *  # noqa: E402,F401,F403
