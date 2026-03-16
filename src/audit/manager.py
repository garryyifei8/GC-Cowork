"""Audit Module - 审计管理."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================

class AuditStatus(str, Enum):
    """审计状态."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class FindingSeverity(str, Enum):
    """问题严重程度."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ============================================================================
# Models
# ============================================================================

class AuditFinding(BaseModel):
    """审计发现."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    description: str
    
    severity: str = "medium"  # low, medium, high, critical
    
    # 状态
    status: str = "open"  # open, in_progress, resolved, closed
    
    # 分类
    category: str | None = None  # 财务、合规、流程
    
    # 关联
    project_id: str | None = None
    audit_id: str | None = None
    
    # 整改
    root_cause: str | None = None
    recommendation: str | None = None
    corrective_action: str | None = None
    
    # 责任人
    responsible_person: str | None = None
    
    # 日期
    identified_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime | None = None
    resolved_date: datetime | None = None
    
    def resolve(self, action_taken: str) -> None:
        """标记为已解决."""
        self.status = "resolved"
        self.corrective_action = action_taken
        self.resolved_date = datetime.utcnow()
    
    def close(self) -> None:
        """关闭问题."""
        self.status = "closed"
    
    @property
    def is_overdue(self) -> bool:
        """是否逾期未整改."""
        if self.due_date and self.status != "resolved":
            return datetime.utcnow() > self.due_date
        return False


class ComplianceCheckResult(BaseModel):
    """合规检查结果."""
    check_item: str
    passed: bool
    notes: str | None = None


class ComplianceCheck(BaseModel):
    """合规检查."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    regulation: str  # 法规/标准
    
    # 状态
    status: str = "pending"  # pending, passed, failed
    
    # 检查结果
    results: list[ComplianceCheckResult] = Field(default_factory=list)
    
    # 日期
    checked_at: datetime | None = None
    
    def add_result(self, check_item: str, passed: bool, notes: str | None = None) -> None:
        """添加检查结果."""
        self.results.append(ComplianceCheckResult(
            check_item=check_item,
            passed=passed,
            notes=notes,
        ))
        
        # 更新状态
        if passed:
            self.status = "passed"
        else:
            self.status = "failed"
    
    @property
    def passed_count(self) -> int:
        """通过数量."""
        return sum(1 for r in self.results if r.passed)
    
    @property
    def failed_count(self) -> int:
        """不通过数量."""
        return sum(1 for r in self.results if not r.passed)
    
    @property
    def pass_rate(self) -> float:
        """通过率."""
        if not self.results:
            return 0.0
        return (self.passed_count / len(self.results)) * 100


class AuditReport(BaseModel):
    """审计报告."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    audit_type: str  # 财务审计、合规审计、专项审计
    
    # 状态
    status: AuditStatus = AuditStatus.DRAFT
    
    # 范围
    scope: str | None = None
    project_ids: list[str] = Field(default_factory=list)
    
    # 时间
    period_start: datetime | None = None
    period_end: datetime | None = None
    
    # 审计发现
    findings: list[AuditFinding] = Field(default_factory=list)
    
    # 合规检查
    compliance_checks: list[ComplianceCheck] = Field(default_factory=list)
    
    # 结论
    conclusion: str | None = None
    recommendation: str | None = None
    
    # 审计员
    auditors: list[str] = Field(default_factory=list)
    
    # 日期
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    
    def add_finding(self, finding: AuditFinding) -> None:
        """添加审计发现."""
        finding.audit_id = self.id
        self.findings.append(finding)
    
    def add_compliance_check(self, check: ComplianceCheck) -> None:
        """添加合规检查."""
        self.compliance_checks.append(check)
    
    def complete(self, conclusion: str, recommendation: str | None = None) -> None:
        """完成审计报告."""
        self.status = AuditStatus.COMPLETED
        self.conclusion = conclusion
        self.recommendation = recommendation
        self.completed_at = datetime.utcnow()
    
    @property
    def critical_findings_count(self) -> int:
        """严重问题数量."""
        return sum(1 for f in self.findings if f.severity == "critical")
    
    @property
    def open_findings_count(self) -> int:
        """未关闭问题数量."""
        return sum(1 for f in self.findings if f.status != "closed")
    
    @property
    def overall_compliance_rate(self) -> float:
        """总体合规率."""
        total_checks = sum(len(c.results) for c in self.compliance_checks)
        if total_checks == 0:
            return 100.0
        
        total_passed = sum(c.passed_count for c in self.compliance_checks)
        return (total_passed / total_checks) * 100


# ============================================================================
# Audit Manager
# ============================================================================

class AuditManager:
    """审计管理器."""
    
    def __init__(self):
        self._reports: dict[str, AuditReport] = {}
        self._findings: dict[str, AuditFinding] = {}
        self._checks: dict[str, ComplianceCheck] = {}
    
    # ----- Reports -----
    
    def create_report(self, report: AuditReport) -> None:
        """创建审计报告."""
        self._reports[report.id] = report
    
    def get_report(self, report_id: str) -> AuditReport | None:
        """获取审计报告."""
        return self._reports.get(report_id)
    
    def list_reports(
        self,
        status: AuditStatus | None = None,
        audit_type: str | None = None,
    ) -> list[AuditReport]:
        """列出审计报告."""
        reports = list(self._reports.values())
        
        if status:
            reports = [r for r in reports if r.status == status]
        
        if audit_type:
            reports = [r for r in reports if r.audit_type == audit_type]
        
        return reports
    
    # ----- Findings -----
    
    def create_finding(self, finding: AuditFinding) -> None:
        """创建审计发现."""
        self._findings[finding.id] = finding
    
    def get_finding(self, finding_id: str) -> AuditFinding | None:
        """获取审计发现."""
        return self._findings.get(finding_id)
    
    def get_project_findings(self, project_id: str) -> list[AuditFinding]:
        """获取项目的所有审计发现."""
        return [f for f in self._findings.values() if f.project_id == project_id]
    
    def get_open_findings(self) -> list[AuditFinding]:
        """获取未关闭的问题."""
        return [f for f in self._findings.values() if f.status != "closed"]
    
    # ----- Compliance -----
    
    def create_compliance_check(self, check: ComplianceCheck) -> None:
        """创建合规检查."""
        self._checks[check.id] = check
    
    def get_compliance_check(self, check_id: str) -> ComplianceCheck | None:
        """获取合规检查."""
        return self._checks.get(check_id)
    
    # ----- Templates -----
    
    def create_project_audit(self, project_id: str, audit_type: str = "综合审计") -> AuditReport:
        """创建项目审计."""
        report = AuditReport(
            title=f"项目审计报告 - {project_id}",
            audit_type=audit_type,
            project_ids=[project_id],
        )
        self.create_report(report)
        return report
    
    def create_financial_audit(self, project_id: str) -> AuditReport:
        """创建财务审计."""
        report = AuditReport(
            title=f"财务审计报告 - {project_id}",
            audit_type="财务审计",
            project_ids=[project_id],
        )
        
        # 添加财务合规检查
        financial_check = ComplianceCheck(
            name="财务合规检查",
            regulation="企业会计准则",
        )
        financial_check.add_result("账务处理准确性", True)
        financial_check.add_result("资金使用合规性", True)
        financial_check.add_result("发票管理规范性", True)
        
        report.add_compliance_check(financial_check)
        
        self.create_report(report)
        return report


# ============================================================================
# Compliance Templates
# ============================================================================

def get_bidding_compliance_check() -> ComplianceCheck:
    """获取招投标合规检查."""
    check = ComplianceCheck(
        name="招投标合规检查",
        regulation="招投标法及实施条例",
    )
    
    check.add_result("招标文件合法性", True)
    check.add_result("投标资质审查", True)
    check.add_result("评标程序合规性", True)
    check.add_result("中标结果公示", True)
    check.add_result("合同签订合规性", True)
    
    return check


def get_procurement_compliance_check() -> ComplianceCheck:
    """获取采购合规检查."""
    check = ComplianceCheck(
        name="采购合规检查",
        regulation="政府采购法",
    )
    
    check.add_result("采购方式选择合规", True)
    check.add_result("供应商资格审查", True)
    check.add_result("采购合同规范性", True)
    check.add_result("验收程序合规性", True)
    
    return check
