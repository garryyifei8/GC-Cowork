"""In-memory project CRUD store with seed data."""

from __future__ import annotations

from src.core.models import Project, ProjectStage, RiskItem

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
            actual_spend=8160.0,
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
            risks=[
                RiskItem(
                    title="幕墙材料供货延迟",
                    description="进口Low-E玻璃交期延长2周，影响A区封闭节点",
                    severity="medium",
                    owner="刘采购",
                ),
            ],
            milestones=[
                {"name": "主体结构封顶", "date": "2025-12-20", "status": "completed"},
                {"name": "幕墙工程完工", "date": "2026-05-15", "status": "in_progress"},
                {"name": "机电系统联调", "date": "2026-06-30", "status": "pending"},
                {"name": "竣工验收", "date": "2026-10-15", "status": "pending"},
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
            actual_spend=198.0,
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
            risks=[
                RiskItem(
                    title="前端开发阻塞",
                    description="前端页面开发因后端接口文档未确认处于阻塞状态",
                    severity="high",
                    owner="钱前端",
                ),
                RiskItem(
                    title="进度严重滞后",
                    description="当前进度35%，距截止日期不足3个月，存在延期风险",
                    severity="high",
                    owner="郑架构",
                ),
            ],
            milestones=[
                {"name": "需求评审通过", "date": "2026-02-15", "status": "completed"},
                {"name": "后端API联调", "date": "2026-04-30", "status": "in_progress"},
                {"name": "UAT测试", "date": "2026-05-30", "status": "pending"},
                {"name": "上线交付", "date": "2026-06-30", "status": "pending"},
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
            actual_spend=12.0,
            team_members=["陈咨询", "林财务", "黄政策", "徐调研", "杨报告"],
            milestones=[
                {"name": "可研报告完成", "date": "2026-03-25", "status": "in_progress"},
                {"name": "专项债申报提交", "date": "2026-04-10", "status": "pending"},
                {"name": "财政评审通过", "date": "2026-04-20", "status": "pending"},
            ],
        ),
        # ---- 新增演示项目 ----
        Project(
            id="proj-004",
            name="市民服务中心智能化改造",
            project_type="EPC / 公建",
            stage=ProjectStage.DESIGN,
            status="active",
            status_label="设计阶段",
            progress_pct=42.0,
            due_date="2026-12-31",
            budget_display="6800万",
            budget=6800.0,
            actual_spend=1020.0,
            team_members=[
                "韩总工",
                "方设计",
                "吕结构",
                "马机电",
                "苗幕墙",
                "宋暖通",
                "唐智能",
            ],
            milestones=[
                {"name": "方案设计评审", "date": "2026-03-30", "status": "completed"},
                {"name": "施工图设计完成", "date": "2026-06-30", "status": "in_progress"},
                {"name": "采购招标", "date": "2026-08-15", "status": "pending"},
                {"name": "竣工验收", "date": "2026-12-31", "status": "pending"},
            ],
        ),
        Project(
            id="proj-005",
            name="高新区数据中台建设",
            project_type="信息化开发",
            stage=ProjectStage.PROCUREMENT,
            status="active",
            status_label="采购中",
            progress_pct=55.0,
            due_date="2026-09-30",
            budget_display="1800万",
            budget=1800.0,
            actual_spend=540.0,
            team_members=[
                "何架构",
                "邓开发",
                "许数据",
                "萧测试",
                "曹运维",
                "汪产品",
            ],
            milestones=[
                {"name": "数据治理规范发布", "date": "2026-03-01", "status": "completed"},
                {"name": "ETL工具采购完成", "date": "2026-04-30", "status": "in_progress"},
                {"name": "数据仓库上线", "date": "2026-07-31", "status": "pending"},
                {"name": "项目验收", "date": "2026-09-30", "status": "pending"},
            ],
        ),
        Project(
            id="proj-006",
            name="老旧小区改造EPC",
            project_type="EPC / 市政",
            stage=ProjectStage.ACCEPTANCE,
            status="active",
            status_label="竣工验收",
            progress_pct=92.0,
            due_date="2026-03-31",
            budget_display="3500万",
            budget=3500.0,
            actual_spend=3220.0,
            team_members=[
                "丁项目",
                "蒋施工",
                "沈监理",
                "韩质检",
                "秦资料",
                "尤安全",
            ],
            risks=[
                RiskItem(
                    title="验收时间紧迫",
                    description="距竣工验收截止仅剩20天，资料归档尚未完成",
                    severity="medium",
                    owner="秦资料",
                ),
            ],
            milestones=[
                {"name": "主体施工完成", "date": "2025-11-30", "status": "completed"},
                {"name": "市政管网接通", "date": "2026-01-15", "status": "completed"},
                {"name": "分户验收", "date": "2026-03-20", "status": "in_progress"},
                {"name": "竣工备案", "date": "2026-03-31", "status": "pending"},
            ],
        ),
        Project(
            id="proj-007",
            name="交通枢纽专项债申报",
            project_type="专项债咨询",
            stage=ProjectStage.BIDDING,
            status="active",
            status_label="投标准备",
            progress_pct=28.0,
            due_date="2026-05-15",
            budget_display="120万",
            budget=120.0,
            actual_spend=18.0,
            team_members=["廖咨询", "余财务", "贾分析", "夏调研"],
            milestones=[
                {"name": "投标文件提交", "date": "2026-04-05", "status": "in_progress"},
                {"name": "开标评审", "date": "2026-04-20", "status": "pending"},
                {"name": "中标公示", "date": "2026-05-15", "status": "pending"},
            ],
        ),
        Project(
            id="proj-008",
            name="省教育厅考试系统升级",
            project_type="信息化开发",
            stage=ProjectStage.CONSTRUCTION,
            status="risk",
            status_label="资源不足",
            progress_pct=20.0,
            due_date="2026-08-01",
            budget_display="960万",
            budget=960.0,
            actual_spend=144.0,
            team_members=[
                "范开发",
                "石测试",
                "姚前端",
                "田后端",
                "彭运维",
                "潘安全",
                "蔡DBA",
            ],
            risks=[
                RiskItem(
                    title="测试环境未就绪",
                    description="高并发压测方案因测试环境未部署处于阻塞状态",
                    severity="high",
                    owner="彭运维",
                ),
                RiskItem(
                    title="人力资源不足",
                    description="前端重构与题库迁移并行，开发资源紧张",
                    severity="medium",
                    owner="范开发",
                ),
            ],
            milestones=[
                {"name": "需求冻结", "date": "2026-03-15", "status": "completed"},
                {"name": "核心模块开发完成", "date": "2026-05-31", "status": "in_progress"},
                {"name": "全量压力测试通过", "date": "2026-07-01", "status": "pending"},
                {"name": "上线交付", "date": "2026-08-01", "status": "pending"},
            ],
        ),
        Project(
            id="proj-009",
            name="文化产业园区景观工程",
            project_type="EPC / 景观",
            stage=ProjectStage.SETTLEMENT,
            status="completed",
            status_label="结算审计",
            progress_pct=100.0,
            due_date="2026-01-15",
            budget_display="2200万",
            budget=2200.0,
            actual_spend=2090.0,
            team_members=[
                "薛景观",
                "雷施工",
                "贺绿化",
                "倪水系",
            ],
            milestones=[
                {"name": "景观方案设计", "date": "2025-04-30", "status": "completed"},
                {"name": "土建施工完成", "date": "2025-08-31", "status": "completed"},
                {"name": "绿化种植完成", "date": "2025-11-15", "status": "completed"},
                {"name": "竣工验收", "date": "2025-12-20", "status": "completed"},
                {"name": "结算审计", "date": "2026-01-15", "status": "in_progress"},
            ],
        ),
        Project(
            id="proj-010",
            name="智慧水务监测平台",
            project_type="信息化开发",
            stage=ProjectStage.CONTRACT,
            status="planning",
            status_label="合同签订",
            progress_pct=8.0,
            due_date="2027-03-01",
            budget_display="2600万",
            budget=2600.0,
            actual_spend=52.0,
            team_members=[
                "武产品",
                "严架构",
                "金开发",
                "魏测试",
                "陶运维",
                "柳数据",
            ],
            milestones=[
                {"name": "合同签订", "date": "2026-03-01", "status": "completed"},
                {"name": "需求调研", "date": "2026-05-01", "status": "in_progress"},
                {"name": "系统设计", "date": "2026-08-01", "status": "pending"},
                {"name": "开发实施", "date": "2027-01-01", "status": "pending"},
                {"name": "项目验收", "date": "2027-03-01", "status": "pending"},
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
