"""In-memory audit report store for the audit management module."""

from __future__ import annotations

import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

AuditType = Literal["financial", "compliance", "project", "safety"]
AuditStatus = Literal["planned", "in_progress", "completed", "follow_up"]
RiskLevel = Literal["low", "medium", "high", "critical"]


class AuditReportRecord(BaseModel):
    id: str
    title: str
    audit_type: AuditType
    project_id: str | None = None
    auditor: str
    start_date: date
    end_date: date | None = None
    status: AuditStatus
    findings_count: int = Field(ge=0)
    risk_level: RiskLevel
    summary: str


_store: dict[str, AuditReportRecord] = {}
_seeded: bool = False


def seed_audit_reports() -> None:
    """Populate the store with realistic seed data for construction/EPC projects."""
    global _seeded
    if _seeded:
        return

    records = [
        AuditReportRecord(
            id="audit-001",
            title="2024年度财务合规审计报告",
            audit_type="financial",
            project_id=None,
            auditor="王建国",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 1, 26),
            status="completed",
            findings_count=7,
            risk_level="medium",
            summary="对2023年度全公司财务账目进行全面审计，发现7项一般性问题，主要集中于费用报销流程不规范及合同台账管理缺失，已提出整改意见并跟踪落实。",
        ),
        AuditReportRecord(
            id="audit-002",
            title="南沙液化天然气接收站EPC项目质量合规审计",
            audit_type="compliance",
            project_id="proj-001",
            auditor="李晓梅",
            start_date=date(2024, 3, 11),
            end_date=date(2024, 3, 29),
            status="completed",
            findings_count=3,
            risk_level="low",
            summary="项目质量管理体系运行良好，施工记录完整，检验批次合格率达98.6%，发现3项轻微不符合项，已完成整改闭环。",
        ),
        AuditReportRecord(
            id="audit-003",
            title="大亚湾石化园区工程安全生产专项审计",
            audit_type="safety",
            project_id="proj-002",
            auditor="张伟",
            start_date=date(2024, 5, 6),
            end_date=date(2024, 5, 24),
            status="follow_up",
            findings_count=12,
            risk_level="high",
            summary="审计发现高处作业防护措施不足、危化品存储区域标识缺失等12项安全隐患，其中2项属重大隐患，已责令停工整改，目前处于整改跟踪阶段。",
        ),
        AuditReportRecord(
            id="audit-004",
            title="粤港澳大湾区综合管廊工程进度与造价审计",
            audit_type="project",
            project_id="proj-003",
            auditor="陈志强",
            start_date=date(2024, 7, 15),
            end_date=None,
            status="in_progress",
            findings_count=5,
            risk_level="medium",
            summary="正在对项目进度偏差及工程变更索赔进行专项审计，已初步发现5处工程量核算偏差，涉及金额约380万元，审计工作持续推进中。",
        ),
        AuditReportRecord(
            id="audit-005",
            title="深圳国际会展中心配套工程年度合规检查",
            audit_type="compliance",
            project_id="proj-004",
            auditor="刘芳",
            start_date=date(2024, 9, 2),
            end_date=None,
            status="in_progress",
            findings_count=2,
            risk_level="low",
            summary="对项目分包管理、材料采购及劳务用工合规性进行审计，目前已完成现场核查阶段，发现2项合同签署程序瑕疵，正在整理审计报告。",
        ),
        AuditReportRecord(
            id="audit-006",
            title="Q3季度全公司内控体系专项审计",
            audit_type="financial",
            project_id=None,
            auditor="赵磊",
            start_date=date(2024, 10, 14),
            end_date=None,
            status="planned",
            findings_count=0,
            risk_level="low",
            summary="计划对第三季度各部门内部控制执行情况进行全面审查，重点关注采购审批权限执行、资金使用合规性及固定资产管理，审计尚未开始。",
        ),
    ]

    for record in records:
        _store[record.id] = record

    _seeded = True


def list_reports(
    status: AuditStatus | None = None,
    audit_type: AuditType | None = None,
) -> list[AuditReportRecord]:
    """Return all audit reports, optionally filtered by status and/or audit_type."""
    seed_audit_reports()
    results = list(_store.values())
    if status is not None:
        results = [r for r in results if r.status == status]
    if audit_type is not None:
        results = [r for r in results if r.audit_type == audit_type]
    return results


def get_report(report_id: str) -> AuditReportRecord | None:
    """Return a single audit report by ID, or None if not found."""
    seed_audit_reports()
    return _store.get(report_id)


def create_report(data: dict) -> AuditReportRecord:
    """Create a new audit report and add it to the store."""
    seed_audit_reports()
    report_id = data.get("id") or f"audit-{uuid.uuid4().hex[:8]}"
    record = AuditReportRecord(id=report_id, **{k: v for k, v in data.items() if k != "id"})
    _store[record.id] = record
    return record


def update_report(report_id: str, updates: dict) -> AuditReportRecord | None:
    """Apply a partial update to an existing audit report. Returns None if not found."""
    seed_audit_reports()
    existing = _store.get(report_id)
    if existing is None:
        return None
    updated_data = existing.model_dump()
    updated_data.update({k: v for k, v in updates.items() if v is not None})
    updated_record = AuditReportRecord(**updated_data)
    _store[report_id] = updated_record
    return updated_record


def get_audit_summary() -> dict:
    """Return aggregate statistics across all audit reports."""
    seed_audit_reports()
    all_reports = list(_store.values())
    total = len(all_reports)
    in_progress_count = sum(1 for r in all_reports if r.status == "in_progress")
    total_findings = sum(r.findings_count for r in all_reports)
    completed_count = sum(1 for r in all_reports if r.status == "completed")
    compliance_rate = round(completed_count / total, 4) if total > 0 else 0.0
    return {
        "total": total,
        "in_progress": in_progress_count,
        "findings_count": total_findings,
        "compliance_rate": compliance_rate,
    }


# ---------------------------------------------------------------------------
# Supabase delegation — when USE_SUPABASE=true, override all exports
# ---------------------------------------------------------------------------
from src.db.client import use_supabase as _use_sb  # noqa: E402

if _use_sb():
    from src.stores.supabase.audit_store import *  # noqa: E402,F401,F403
