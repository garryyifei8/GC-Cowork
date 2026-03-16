"""In-memory activity event store with seed data."""
from __future__ import annotations

import random
from datetime import datetime, timedelta
from uuid import uuid4

from src.core.models import ActivityEvent

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_activities: dict[str, ActivityEvent] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_activities() -> None:
    """Populate the store with 5-8 historical activities per seed project."""
    global _seeded
    if _seeded:
        return

    now = datetime.utcnow()

    # 每个项目的种子活动模板
    _project_activities: dict[str, list[dict]] = {
        # ----------------------------------------------------------------
        # proj-001: 省立博物馆EPC工程 (施工阶段)
        # ----------------------------------------------------------------
        "proj-001": [
            {"event_type": "stage_transition", "actor": "张工",
             "summary": "项目从设计阶段推进到施工阶段",
             "detail": {"before": {"stage": "design"}, "after": {"stage": "construction"}},
             "days_ago": 28},
            {"event_type": "task_created", "actor": "张工",
             "summary": "创建任务「完成展厅A区幕墙施工」",
             "detail": {"task_id": "task-001-01", "task_name": "完成展厅A区幕墙施工"},
             "days_ago": 25},
            {"event_type": "task_created", "actor": "张工",
             "summary": "创建任务「机电安装调试」",
             "detail": {"task_id": "task-001-02", "task_name": "机电安装调试"},
             "days_ago": 24},
            {"event_type": "task_updated", "actor": "王监理",
             "summary": "更新任务「消防系统验收准备」的优先级为中",
             "detail": {"task_id": "task-001-03", "before": {"priority": "low"}, "after": {"priority": "medium"}},
             "days_ago": 18},
            {"event_type": "status_changed", "actor": "张工",
             "summary": "项目进度更新至68%",
             "detail": {"before": {"progress_pct": 55.0}, "after": {"progress_pct": 68.0}},
             "days_ago": 5},
            {"event_type": "task_updated", "actor": "冯展陈",
             "summary": "任务「展陈设计深化」状态变更为评审中",
             "detail": {"task_id": "task-001-04", "before": {"status": "in_progress"}, "after": {"status": "review"}},
             "days_ago": 3},
            {"event_type": "task_created", "actor": "孙智能",
             "summary": "创建任务「智能化系统布线」",
             "detail": {"task_id": "task-001-05", "task_name": "智能化系统布线"},
             "days_ago": 2},
        ],
        # ----------------------------------------------------------------
        # proj-002: 发改委平台信息化二期 (施工阶段/进度延误)
        # ----------------------------------------------------------------
        "proj-002": [
            {"event_type": "stage_transition", "actor": "吴产品",
             "summary": "项目从采购阶段推进到施工阶段",
             "detail": {"before": {"stage": "procurement"}, "after": {"stage": "construction"}},
             "days_ago": 30},
            {"event_type": "task_created", "actor": "赵开发",
             "summary": "创建任务「后端API开发」",
             "detail": {"task_id": "task-002-01", "task_name": "后端API开发"},
             "days_ago": 27},
            {"event_type": "status_changed", "actor": "吴产品",
             "summary": "项目状态变更为风险预警 — 进度延误",
             "detail": {"before": {"status": "active", "status_label": "开发中"}, "after": {"status": "risk", "status_label": "进度延误"}},
             "days_ago": 14},
            {"event_type": "task_updated", "actor": "钱前端",
             "summary": "任务「前端页面开发」状态变更为阻塞",
             "detail": {"task_id": "task-002-03", "before": {"status": "todo"}, "after": {"status": "blocked"}},
             "days_ago": 10},
            {"event_type": "task_created", "actor": "赵开发",
             "summary": "创建任务「系统集成测试」",
             "detail": {"task_id": "task-002-04", "task_name": "系统集成测试"},
             "days_ago": 8},
            {"event_type": "task_updated", "actor": "赵开发",
             "summary": "更新任务「后端API开发」截止日期延后至4月10日",
             "detail": {"task_id": "task-002-01", "before": {"due_date": "2026-03-25"}, "after": {"due_date": "2026-04-10"}},
             "days_ago": 4},
        ],
        # ----------------------------------------------------------------
        # proj-003: 智慧园区专项债可研 (立项阶段)
        # ----------------------------------------------------------------
        "proj-003": [
            {"event_type": "task_created", "actor": "陈咨询",
             "summary": "创建任务「项目可研报告编制」",
             "detail": {"task_id": "task-003-01", "task_name": "项目可研报告编制"},
             "days_ago": 22},
            {"event_type": "task_created", "actor": "陈咨询",
             "summary": "创建任务「竞品调研分析」",
             "detail": {"task_id": "task-003-03", "task_name": "竞品调研分析"},
             "days_ago": 20},
            {"event_type": "task_updated", "actor": "徐调研",
             "summary": "任务「竞品调研分析」状态变更为已完成",
             "detail": {"task_id": "task-003-03", "before": {"status": "in_progress"}, "after": {"status": "done"}},
             "days_ago": 12},
            {"event_type": "status_changed", "actor": "陈咨询",
             "summary": "项目进度更新至15%",
             "detail": {"before": {"progress_pct": 8.0}, "after": {"progress_pct": 15.0}},
             "days_ago": 7},
            {"event_type": "task_created", "actor": "黄政策",
             "summary": "创建任务「专项债申报材料准备」",
             "detail": {"task_id": "task-003-02", "task_name": "专项债申报材料准备"},
             "days_ago": 5},
        ],
        # ----------------------------------------------------------------
        # proj-004: 市民服务中心智能化改造 (设计阶段)
        # ----------------------------------------------------------------
        "proj-004": [
            {"event_type": "stage_transition", "actor": "韩总工",
             "summary": "项目从签约阶段推进到设计阶段",
             "detail": {"before": {"stage": "contract"}, "after": {"stage": "design"}},
             "days_ago": 26},
            {"event_type": "task_created", "actor": "韩总工",
             "summary": "创建任务「智能化系统方案设计」",
             "detail": {"task_id": "task-004-01", "task_name": "智能化系统方案设计"},
             "days_ago": 24},
            {"event_type": "task_created", "actor": "吕结构",
             "summary": "创建任务「结构加固方案评审」",
             "detail": {"task_id": "task-004-02", "task_name": "结构加固方案评审"},
             "days_ago": 21},
            {"event_type": "task_updated", "actor": "吕结构",
             "summary": "任务「结构加固方案评审」状态变更为评审中",
             "detail": {"task_id": "task-004-02", "before": {"status": "in_progress"}, "after": {"status": "review"}},
             "days_ago": 9},
            {"event_type": "task_created", "actor": "韩总工",
             "summary": "创建任务「BIM模型创建」",
             "detail": {"task_id": "task-004-03", "task_name": "BIM模型创建"},
             "days_ago": 15},
            {"event_type": "status_changed", "actor": "韩总工",
             "summary": "项目进度更新至42%",
             "detail": {"before": {"progress_pct": 30.0}, "after": {"progress_pct": 42.0}},
             "days_ago": 3},
        ],
        # ----------------------------------------------------------------
        # proj-005: 高新区数据中台建设 (采购阶段)
        # ----------------------------------------------------------------
        "proj-005": [
            {"event_type": "stage_transition", "actor": "何架构",
             "summary": "项目从设计阶段推进到采购阶段",
             "detail": {"before": {"stage": "design"}, "after": {"stage": "procurement"}},
             "days_ago": 20},
            {"event_type": "task_created", "actor": "许数据",
             "summary": "创建任务「数据治理规范制定」",
             "detail": {"task_id": "task-005-01", "task_name": "数据治理规范制定"},
             "days_ago": 19},
            {"event_type": "task_updated", "actor": "许数据",
             "summary": "任务「数据治理规范制定」状态变更为已完成",
             "detail": {"task_id": "task-005-01", "before": {"status": "in_progress"}, "after": {"status": "done"}},
             "days_ago": 11},
            {"event_type": "task_created", "actor": "何架构",
             "summary": "创建任务「ETL工具采购评估」",
             "detail": {"task_id": "task-005-02", "task_name": "ETL工具采购评估"},
             "days_ago": 14},
            {"event_type": "task_created", "actor": "邓开发",
             "summary": "创建任务「数据仓库架构设计」",
             "detail": {"task_id": "task-005-03", "task_name": "数据仓库架构设计"},
             "days_ago": 12},
            {"event_type": "status_changed", "actor": "何架构",
             "summary": "项目进度更新至55%",
             "detail": {"before": {"progress_pct": 45.0}, "after": {"progress_pct": 55.0}},
             "days_ago": 2},
            {"event_type": "task_created", "actor": "汪产品",
             "summary": "创建任务「API网关选型」",
             "detail": {"task_id": "task-005-04", "task_name": "API网关选型"},
             "days_ago": 1},
        ],
        # ----------------------------------------------------------------
        # proj-006: 老旧小区改造EPC (验收阶段)
        # ----------------------------------------------------------------
        "proj-006": [
            {"event_type": "stage_transition", "actor": "丁项目",
             "summary": "项目从施工阶段推进到验收阶段",
             "detail": {"before": {"stage": "construction"}, "after": {"stage": "acceptance"}},
             "days_ago": 15},
            {"event_type": "task_created", "actor": "秦资料",
             "summary": "创建任务「竣工资料归档」",
             "detail": {"task_id": "task-006-01", "task_name": "竣工资料归档"},
             "days_ago": 14},
            {"event_type": "task_created", "actor": "韩质检",
             "summary": "创建任务「质量验收检查」",
             "detail": {"task_id": "task-006-02", "task_name": "质量验收检查"},
             "days_ago": 13},
            {"event_type": "status_changed", "actor": "丁项目",
             "summary": "项目进度更新至92%",
             "detail": {"before": {"progress_pct": 85.0}, "after": {"progress_pct": 92.0}},
             "days_ago": 6},
            {"event_type": "task_created", "actor": "蒋施工",
             "summary": "创建任务「绿化补种移交」",
             "detail": {"task_id": "task-006-03", "task_name": "绿化补种移交"},
             "days_ago": 4},
        ],
        # ----------------------------------------------------------------
        # proj-007: 交通枢纽专项债申报 (投标阶段)
        # ----------------------------------------------------------------
        "proj-007": [
            {"event_type": "stage_transition", "actor": "廖咨询",
             "summary": "项目从立项阶段推进到投标阶段",
             "detail": {"before": {"stage": "initiation"}, "after": {"stage": "bidding"}},
             "days_ago": 23},
            {"event_type": "task_created", "actor": "廖咨询",
             "summary": "创建任务「投标文件编制」",
             "detail": {"task_id": "task-007-01", "task_name": "投标文件编制"},
             "days_ago": 20},
            {"event_type": "task_created", "actor": "余财务",
             "summary": "创建任务「项目收益测算」",
             "detail": {"task_id": "task-007-02", "task_name": "项目收益测算"},
             "days_ago": 18},
            {"event_type": "status_changed", "actor": "廖咨询",
             "summary": "项目进度更新至28%",
             "detail": {"before": {"progress_pct": 15.0}, "after": {"progress_pct": 28.0}},
             "days_ago": 6},
            {"event_type": "task_created", "actor": "贾分析",
             "summary": "创建任务「政策合规性审查」",
             "detail": {"task_id": "task-007-03", "task_name": "政策合规性审查"},
             "days_ago": 3},
            {"event_type": "task_updated", "actor": "余财务",
             "summary": "更新任务「项目收益测算」截止日期为3月28日",
             "detail": {"task_id": "task-007-02", "before": {"due_date": "2026-04-05"}, "after": {"due_date": "2026-03-28"}},
             "days_ago": 2},
        ],
        # ----------------------------------------------------------------
        # proj-008: 省教育厅考试系统升级 (施工阶段/资源不足)
        # ----------------------------------------------------------------
        "proj-008": [
            {"event_type": "stage_transition", "actor": "范开发",
             "summary": "项目从采购阶段推进到施工阶段",
             "detail": {"before": {"stage": "procurement"}, "after": {"stage": "construction"}},
             "days_ago": 29},
            {"event_type": "task_created", "actor": "彭运维",
             "summary": "创建任务「高并发压测方案」",
             "detail": {"task_id": "task-008-01", "task_name": "高并发压测方案"},
             "days_ago": 25},
            {"event_type": "task_updated", "actor": "彭运维",
             "summary": "任务「高并发压测方案」状态变更为阻塞 — 等待测试环境",
             "detail": {"task_id": "task-008-01", "before": {"status": "todo"}, "after": {"status": "blocked"}},
             "days_ago": 16},
            {"event_type": "status_changed", "actor": "范开发",
             "summary": "项目状态变更为风险预警 — 资源不足",
             "detail": {"before": {"status": "active", "status_label": "开发中"}, "after": {"status": "risk", "status_label": "资源不足"}},
             "days_ago": 12},
            {"event_type": "task_created", "actor": "田后端",
             "summary": "创建任务「题库迁移开发」",
             "detail": {"task_id": "task-008-02", "task_name": "题库迁移开发"},
             "days_ago": 10},
            {"event_type": "task_created", "actor": "姚前端",
             "summary": "创建任务「前端考试界面重构」",
             "detail": {"task_id": "task-008-03", "task_name": "前端考试界面重构"},
             "days_ago": 7},
            {"event_type": "status_changed", "actor": "范开发",
             "summary": "项目进度更新至20%",
             "detail": {"before": {"progress_pct": 12.0}, "after": {"progress_pct": 20.0}},
             "days_ago": 1},
        ],
        # ----------------------------------------------------------------
        # proj-009: 文化产业园区景观工程 (结算阶段)
        # ----------------------------------------------------------------
        "proj-009": [
            {"event_type": "stage_transition", "actor": "薛景观",
             "summary": "项目从验收阶段推进到结算阶段",
             "detail": {"before": {"stage": "acceptance"}, "after": {"stage": "settlement"}},
             "days_ago": 22},
            {"event_type": "task_created", "actor": "薛景观",
             "summary": "创建任务「结算审计配合」",
             "detail": {"task_id": "task-009-01", "task_name": "结算审计配合"},
             "days_ago": 20},
            {"event_type": "task_created", "actor": "贺绿化",
             "summary": "创建任务「质保期维护计划」",
             "detail": {"task_id": "task-009-02", "task_name": "质保期维护计划"},
             "days_ago": 18},
            {"event_type": "task_updated", "actor": "贺绿化",
             "summary": "任务「质保期维护计划」状态变更为已完成",
             "detail": {"task_id": "task-009-02", "before": {"status": "in_progress"}, "after": {"status": "done"}},
             "days_ago": 8},
            {"event_type": "status_changed", "actor": "薛景观",
             "summary": "项目进度更新至100%",
             "detail": {"before": {"progress_pct": 95.0}, "after": {"progress_pct": 100.0}},
             "days_ago": 5},
        ],
        # ----------------------------------------------------------------
        # proj-010: 智慧水务监测平台 (签约阶段)
        # ----------------------------------------------------------------
        "proj-010": [
            {"event_type": "stage_transition", "actor": "武产品",
             "summary": "项目从投标阶段推进到签约阶段",
             "detail": {"before": {"stage": "bidding"}, "after": {"stage": "contract"}},
             "days_ago": 17},
            {"event_type": "task_created", "actor": "武产品",
             "summary": "创建任务「需求调研」",
             "detail": {"task_id": "task-010-01", "task_name": "需求调研"},
             "days_ago": 15},
            {"event_type": "task_created", "actor": "金开发",
             "summary": "创建任务「合同附件整理」",
             "detail": {"task_id": "task-010-03", "task_name": "合同附件整理"},
             "days_ago": 14},
            {"event_type": "task_updated", "actor": "金开发",
             "summary": "任务「合同附件整理」状态变更为已完成",
             "detail": {"task_id": "task-010-03", "before": {"status": "in_progress"}, "after": {"status": "done"}},
             "days_ago": 7},
            {"event_type": "task_created", "actor": "严架构",
             "summary": "创建任务「技术架构预研」",
             "detail": {"task_id": "task-010-02", "task_name": "技术架构预研"},
             "days_ago": 6},
            {"event_type": "status_changed", "actor": "武产品",
             "summary": "项目进度更新至8%",
             "detail": {"before": {"progress_pct": 3.0}, "after": {"progress_pct": 8.0}},
             "days_ago": 2},
        ],
    }

    for project_id, activities in _project_activities.items():
        for act_data in activities:
            days_ago = act_data.pop("days_ago")
            activity = ActivityEvent(
                id=str(uuid4()),
                project_id=project_id,
                event_type=act_data["event_type"],
                actor=act_data["actor"],
                summary=act_data["summary"],
                detail=act_data["detail"],
                created_at=now - timedelta(days=days_ago, hours=random.randint(0, 12)),
            )
            _activities[activity.id] = activity

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------

def list_activities(project_id: str) -> list[ActivityEvent]:
    """Return all activities for a specific project, sorted by created_at desc."""
    items = [a for a in _activities.values() if a.project_id == project_id]
    items.sort(key=lambda a: a.created_at, reverse=True)
    return items


def list_recent_activities(limit: int = 10) -> list[ActivityEvent]:
    """Return the most recent activities across all projects."""
    items = sorted(_activities.values(), key=lambda a: a.created_at, reverse=True)
    return items[:limit]


def create_activity(activity: ActivityEvent) -> ActivityEvent:
    """Insert a new activity into the store and return it."""
    _activities[activity.id] = activity
    return activity


def get_activity(activity_id: str) -> ActivityEvent | None:
    """Return a single activity by ID, or None if not found."""
    return _activities.get(activity_id)
