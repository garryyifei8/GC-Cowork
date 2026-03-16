"""Project Management Enhancement - WBS, Milestones, Risk, Metrics."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================

class RiskLevel(str, Enum):
    """风险级别."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    
    @property
    def color(self) -> str:
        return {
            "low": "#00C875",
            "medium": "#FDAB3D",
            "high": "#E2445C",
            "critical": "#6B5CE7",
        }.get(self.value, "#C4C4C4")
    
    @property
    def priority(self) -> int:
        return {
            "low": 4,
            "medium": 3,
            "high": 2,
            "critical": 1,
        }.get(self.value, 5)


# ============================================================================
# WBS (Work Breakdown Structure)
# ============================================================================

class WBSNode(BaseModel):
    """WBS 节点 - 工作分解结构."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str | None = None
    level: int = 1  # 1 = 一级任务
    parent_id: str | None = None
    children: list[str] = Field(default_factory=list)
    
    # 估算
    estimated_hours: float | None = None
    actual_hours: float | None = None
    
    # 状态
    status: str = "pending"  # pending, in_progress, completed, blocked
    
    # 负责人
    assignee: str | None = None
    
    # 日期
    start_date: datetime | None = None
    due_date: datetime | None = None
    completed_at: datetime | None = None
    
    # 依赖
    dependencies: list[str] = Field(default_factory=list)
    
    def complete(self) -> None:
        """标记为完成."""
        self.status = "completed"
        self.completed_at = datetime.utcnow()
    
    @property
    def progress(self) -> float:
        """计算进度百分比."""
        if self.status == "completed":
            return 100.0
        elif self.status == "in_progress":
            return 50.0
        return 0.0
    
    @property
    def is_overdue(self) -> bool:
        """是否逾期."""
        if self.due_date and self.status != "completed":
            return datetime.utcnow() > self.due_date
        return False


class WBSTree:
    """WBS 树."""
    
    def __init__(self):
        self._nodes: dict[str, WBSNode] = {}
    
    def add_node(self, node: WBSNode) -> None:
        """添加节点."""
        self._nodes[node.id] = node
        
        # 更新父节点的children
        if node.parent_id and node.parent_id in self._nodes:
            parent = self._nodes[node.parent_id]
            if node.id not in parent.children:
                parent.children.append(node.id)
    
    def get_node(self, node_id: str) -> WBSNode | None:
        """获取节点."""
        return self._nodes.get(node_id)
    
    def get_children(self, node_id: str) -> list[WBSNode]:
        """获取子节点."""
        node = self._nodes.get(node_id)
        if not node:
            return []
        return [self._nodes[cid] for cid in node.children if cid in self._nodes]
    
    def get_all_children(self, node_id: str) -> list[WBSNode]:
        """获取所有子节点（递归）."""
        result = []
        children = self.get_children(node_id)
        for child in children:
            result.append(child)
            result.extend(self.get_all_children(child.id))
        return result
    
    def calculate_total_hours(self, node_id: str) -> float:
        """计算节点总工时（包括子节点）."""
        node = self._nodes.get(node_id)
        if not node:
            return 0.0
        
        total = node.estimated_hours or 0.0
        for child in self.get_all_children(node_id):
            total += child.estimated_hours or 0.0
        
        return total


# ============================================================================
# Milestone (里程碑)
# ============================================================================

class Milestone(BaseModel):
    """里程碑."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str | None = None
    project_id: str
    
    due_date: datetime
    completed_at: datetime | None = None
    
    status: str = "pending"  # pending, completed, delayed
    
    # 关联的WBS节点
    wbs_node_ids: list[str] = Field(default_factory=list)
    
    # 交付物
    deliverables: list[str] = Field(default_factory=list)
    
    def complete(self) -> None:
        """完成里程碑."""
        self.status = "completed"
        self.completed_at = datetime.utcnow()
    
    @property
    def is_completed(self) -> bool:
        return self.status == "completed"
    
    @property
    def is_overdue(self) -> bool:
        if self.status != "completed":
            return datetime.utcnow() > self.due_date
        return False


# ============================================================================
# Risk (风险)
# ============================================================================

class Risk(BaseModel):
    """项目风险."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    level: RiskLevel
    
    project_id: str
    
    # 风险分类
    category: str = "general"  # technical, resource, schedule, quality, external
    
    # 状态
    status: str = "identified"  # identified, tracked, mitigated, closed
    
    # 影响
    impact: str | None = None  # 影响描述
    probability: float = 0.5  # 发生概率 0-1
    
    # 应对措施
    mitigation: str | None = None
    contingency: str | None = None
    
    # 负责人
    owner: str | None = None
    
    # 日期
    identified_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: datetime | None = None
    
    # 关联的任务
    related_tasks: list[str] = Field(default_factory=list)
    
    def mitigate(self, mitigation_plan: str) -> None:
        """制定应对措施."""
        self.mitigation = mitigation_plan
        self.status = "tracked"
    
    def close(self) -> None:
        """关闭风险."""
        self.status = "closed"
        self.resolved_at = datetime.utcnow()
    
    @property
    def risk_score(self) -> float:
        """计算风险分数 = 概率 * 严重程度."""
        severity = {
            RiskLevel.LOW: 0.25,
            RiskLevel.MEDIUM: 0.5,
            RiskLevel.HIGH: 0.75,
            RiskLevel.CRITICAL: 1.0,
        }.get(self.level, 0.5)
        
        return self.probability * severity


# ============================================================================
# Project Metrics (项目指标)
# ============================================================================

class ProjectMetrics(BaseModel):
    """项目指标."""
    project_id: str
    
    # 任务指标
    total_tasks: int = 0
    completed_tasks: int = 0
    in_progress_tasks: int = 0
    blocked_tasks: int = 0
    
    # 计划指标
    planned_completed: int = 0  # 计划应该完成的任务数
    
    # 工时指标
    total_hours: float = 0.0
    spent_hours: float = 0.0
    budget_hours: float = 0.0
    
    # 质量指标
    defects_count: int = 0
    defects_resolved: int = 0
    
    @property
    def progress_percentage(self) -> float:
        """进度百分比."""
        if self.total_tasks == 0:
            return 0.0
        return (self.completed_tasks / self.total_tasks) * 100
    
    @property
    def hours_percentage(self) -> float:
        """工时完成百分比."""
        if self.total_hours == 0:
            return 0.0
        return (self.spent_hours / self.total_hours) * 100
    
    @property
    def schedule_variance(self) -> int:
        """进度偏差 (SV = EV - PV)."""
        # Earned Value = completed tasks
        # Planned Value = planned to complete
        return self.completed_tasks - self.planned_completed
    
    @property
    def schedule_performance_index(self) -> float:
        """进度绩效指数 (SPI = EV / PV)."""
        if self.planned_completed == 0:
            return 1.0
        return self.completed_tasks / self.planned_completed
    
    @property
    def cost_variance(self) -> float:
        """成本偏差 (CV = EV - AC)."""
        # Earned value in hours
        ev = (self.completed_tasks / self.total_tasks) * self.budget_hours if self.total_tasks > 0 else 0
        return ev - self.spent_hours
    
    @property
    def cost_performance_index(self) -> float:
        """成本绩效指数 (CPI = EV / AC)."""
        if self.spent_hours == 0:
            return 1.0
        ev = (self.completed_tasks / self.total_tasks) * self.budget_hours if self.total_tasks > 0 else 0
        return ev / self.spent_hours
    
    @property
    def quality_score(self) -> float:
        """质量得分."""
        if self.defects_count == 0:
            return 100.0
        return (self.defects_resolved / self.defects_count) * 100
    
    def get_status_summary(self) -> dict[str, Any]:
        """获取状态摘要."""
        return {
            "progress": self.progress_percentage,
            "schedule_variance": self.schedule_variance,
            "spi": self.schedule_performance_index,
            "cpi": self.cost_performance_index,
            "quality": self.quality_score,
            "status": self.overall_status,
        }
    
    @property
    def overall_status(self) -> str:
        """总体状态."""
        if self.schedule_performance_index < 0.8:
            return "critical"
        elif self.schedule_performance_index < 1.0:
            return "at_risk"
        elif self.cost_performance_index < 0.8:
            return "over_budget"
        return "on_track"


# ============================================================================
# Project Health
# ============================================================================

class ProjectHealth:
    """项目健康度."""
    
    @staticmethod
    def calculate(metrics: ProjectMetrics, risks: list[Risk]) -> dict[str, Any]:
        """计算项目健康度."""
        # 基础分数
        health_score = 100.0
        
        # 进度扣分
        if metrics.schedule_performance_index < 1.0:
            health_score -= (1.0 - metrics.schedule_performance_index) * 30
        
        # 成本扣分
        if metrics.cost_performance_index < 1.0:
            health_score -= (1.0 - metrics.cost_performance_index) * 20
        
        # 风险扣分
        high_risks = [r for r in risks if r.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
        health_score -= len(high_risks) * 10
        
        # 质量扣分
        if metrics.quality_score < 100:
            health_score -= (100 - metrics.quality_score) * 0.2
        
        # 确保在0-100范围内
        health_score = max(0, min(100, health_score))
        
        # 确定状态
        if health_score >= 80:
            status = "healthy"
        elif health_score >= 60:
            status = "warning"
        elif health_score >= 40:
            status = "critical"
        else:
            status = "blocked"
        
        return {
            "score": round(health_score, 1),
            "status": status,
            "factors": {
                "schedule": metrics.schedule_performance_index,
                "cost": metrics.cost_performance_index,
                "quality": metrics.quality_score,
                "high_risks": len(high_risks),
            },
        }


# ============================================================================
# Alert Management
# ============================================================================

class Alert(BaseModel):
    """预警."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    type: str  # schedule, cost, quality, risk
    level: RiskLevel
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False


def check_and_create_alerts(
    metrics: ProjectMetrics,
    risks: list[Risk],
) -> list[Alert]:
    """检查并创建预警."""
    alerts = []
    
    # Schedule alert
    if metrics.schedule_performance_index < 0.8:
        alerts.append(Alert(
            project_id=metrics.project_id,
            type="schedule",
            level=RiskLevel.CRITICAL,
            message=f"进度严重滞后，SPI = {metrics.schedule_performance_index:.2f}",
        ))
    elif metrics.schedule_performance_index < 0.9:
        alerts.append(Alert(
            project_id=metrics.project_id,
            type="schedule",
            level=RiskLevel.HIGH,
            message=f"进度滞后，SPI = {metrics.schedule_performance_index:.2f}",
        ))
    elif metrics.schedule_performance_index < 1.0:
        alerts.append(Alert(
            project_id=metrics.project_id,
            type="schedule",
            level=RiskLevel.MEDIUM,
            message="进度轻微滞后",
        ))
    
    # Cost alert
    if metrics.cost_performance_index < 0.8:
        alerts.append(Alert(
            project_id=metrics.project_id,
            type="cost",
            level=RiskLevel.HIGH,
            message=f"成本超支，CPI = {metrics.cost_performance_index:.2f}",
        ))
    
    # Risk alerts
    for risk in risks:
        if risk.status in ["identified", "tracked"] and risk.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            alerts.append(Alert(
                project_id=risk.project_id,
                type="risk",
                level=risk.level,
                message=f"高风险: {risk.name}",
            ))
    
    return alerts
