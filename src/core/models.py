"""
Core domain data models for the AI-native project collaboration platform.
All models use Pydantic v2 for validation and serialization.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class AgentType(str, Enum):
    DISPATCH = "dispatch"          # 调度Agent — universal router
    PROJECT = "project"            # 项目管理Agent
    FINANCE = "finance"            # 财务Agent
    LEGAL = "legal"                # 法务Agent
    PROCUREMENT = "procurement"    # 采购Agent
    HR = "hr"                      # 人事Agent
    BIDDING = "bidding"            # 投标Agent
    DOCUMENT = "document"          # 文档Agent
    KNOWLEDGE = "knowledge"        # 知识Agent
    PROCESS_CONTROL = "process_control"  # 过控Agent — 四控管理（进度/质量/安全/成本）
    SUPERVISION = "supervision"    # 监理Agent — 监理管理


class MessageRole(str, Enum):
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"


class TaskComplexity(str, Enum):
    SIMPLE = "simple"    # Q&A, lookup — use lightweight model
    COMPLEX = "complex"  # analysis, multi-agent — use large model


class WorkflowPattern(str, Enum):
    SERIAL = "serial"           # 串行：sequential agent handoff
    PARALLEL = "parallel"       # 并行：concurrent agents, aggregated result
    HUMAN_IN_LOOP = "human_in_loop"  # 人机协同：agent + human confirmation


class ProjectStage(str, Enum):
    INITIATION = "initiation"          # 立项
    BIDDING = "bidding"                # 投标
    CONTRACT = "contract"              # 签约
    DESIGN = "design"                  # 设计
    PROCUREMENT = "procurement"        # 采购
    CONSTRUCTION = "construction"      # 施工/实施
    ACCEPTANCE = "acceptance"          # 验收
    SETTLEMENT = "settlement"          # 结算
    ARCHIVED = "archived"              # 归档


class CardType(str, Enum):
    ACTION = "action"        # 操作卡片 — buttons for approve/reject/assign
    DATA = "data"            # 数据卡片 — charts and summaries
    FORM = "form"            # 表单卡片 — inline form filling
    FILE = "file"            # 文件卡片 — document preview/edit
    ALERT = "alert"          # 预警卡片 — risk / anomaly warnings
    TASK_LIST = "task_list"  # 可交互任务列表
    KANBAN = "kanban"        # 可交互看板
    PROGRESS = "progress"    # 项目进度图
    TABLE = "table"          # 表格（项目/通用）
    CHART = "chart"          # 图表（环形/柱状等）
    REPORT = "report"        # 报告卡片


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class TimestampedModel(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Conversation & Messaging
# ---------------------------------------------------------------------------

class InteractiveCard(BaseModel):
    """Rich interactive component embedded in an agent reply."""
    card_type: CardType
    title: str
    data: dict[str, Any] = Field(default_factory=dict)
    actions: list[dict[str, str]] = Field(default_factory=list)


class Message(TimestampedModel):
    """A single message in a conversation session."""
    id: UUID = Field(default_factory=uuid4)
    session_id: UUID
    role: MessageRole
    content: str
    agent_type: AgentType | None = None
    cards: list[InteractiveCard] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Session(TimestampedModel):
    """A conversation session between a user and the platform."""
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    title: str = ""
    messages: list[Message] = Field(default_factory=list)
    active_project_id: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Agent System
# ---------------------------------------------------------------------------

class AgentIntent(BaseModel):
    """Result of intent recognition by the Dispatch Agent."""
    primary_agent: AgentType
    secondary_agents: list[AgentType] = Field(default_factory=list)
    complexity: TaskComplexity = TaskComplexity.SIMPLE
    workflow_pattern: WorkflowPattern = WorkflowPattern.SERIAL
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    extracted_params: dict[str, Any] = Field(default_factory=dict)


class AgentRequest(BaseModel):
    """Request sent to a specialized agent."""
    request_id: UUID = Field(default_factory=uuid4)
    session_id: UUID
    agent_type: AgentType
    user_message: str
    context: dict[str, Any] = Field(default_factory=dict)
    intent: AgentIntent | None = None


class AgentResponse(BaseModel):
    """Response from a specialized agent."""
    request_id: UUID
    agent_type: AgentType
    content: str
    cards: list[InteractiveCard] = Field(default_factory=list)
    requires_human_confirmation: bool = False
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    metadata: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

class RiskItem(BaseModel):
    title: str
    description: str
    severity: str  # low | medium | high | critical
    owner: str | None = None


class Project(TimestampedModel):
    """Core project entity covering the full lifecycle."""
    id: str
    name: str
    stage: ProjectStage = ProjectStage.INITIATION
    progress_pct: float = Field(ge=0.0, le=100.0, default=0.0)
    budget: float | None = None
    actual_spend: float | None = None
    risks: list[RiskItem] = Field(default_factory=list)
    milestones: list[dict[str, Any]] = Field(default_factory=list)
    team_members: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    # Extended fields for dashboard display
    project_type: str = ""          # "EPC / 展馆", "信息化开发", "专项债咨询"
    status: str = "planning"        # "active" | "risk" | "planning" | "completed"
    status_label: str = ""          # "施工中", "进度延误", "立项评估"
    due_date: str | None = None     # "2026-10-15"
    budget_display: str | None = None  # "1.2亿", "450万"


# ---------------------------------------------------------------------------
# Task Management
# ---------------------------------------------------------------------------

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"


class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ProjectTask(TimestampedModel):
    """A task within a project."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    name: str
    assignee: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: str | None = None
    description: str = ""


# ---------------------------------------------------------------------------
# Activity Log (活动日志)
# ---------------------------------------------------------------------------

class ActivityEvent(BaseModel):
    """A single activity event in the project lifecycle."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    event_type: str  # task_created | task_updated | stage_transition | status_changed
    actor: str
    summary: str        # 人类可读的中文摘要
    detail: dict[str, Any] = Field(default_factory=dict)  # before/after
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Bidding
# ---------------------------------------------------------------------------

class BiddingOpportunity(TimestampedModel):
    """A bidding/tender opportunity."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    source: str = ""
    publish_date: str = ""
    deadline: str = ""
    budget_amount: str | None = None
    region: str = ""
    category: str = ""
    status: str = "monitoring"
    match_score: float = Field(ge=0.0, le=100.0, default=0.0)
    project_id: str | None = None


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

class DocumentItem(TimestampedModel):
    """A document in the system."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    doc_type: str = "report"
    project_id: str | None = None
    content_summary: str = ""
    version: str = "1.0"
    author: str = ""
    status: str = "draft"


# ---------------------------------------------------------------------------
# Procurement (采购管理)
# ---------------------------------------------------------------------------

class ProcurementStatus(str, Enum):
    PLANNING = "planning"       # 计划中
    BIDDING = "bidding"         # 招标中
    EVALUATING = "evaluating"   # 评标中
    CONTRACTED = "contracted"   # 已签约
    DELIVERING = "delivering"   # 供货中
    INSPECTING = "inspecting"   # 验收中
    COMPLETED = "completed"     # 已完成


class ProcurementPackage(TimestampedModel):
    """采购包 — EPC项目的材料/设备/分包采购单元"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    name: str                    # "幕墙玻璃采购"
    category: str = ""           # "材料" | "设备" | "分包"
    supplier: str | None = None
    budget_amount: float | None = None
    actual_amount: float | None = None
    status: ProcurementStatus = ProcurementStatus.PLANNING
    plan_date: str | None = None     # 计划采购日期
    arrival_date: str | None = None  # 到货日期
    responsible: str | None = None
    notes: str = ""


# ---------------------------------------------------------------------------
# Process Records (过程管理)
# ---------------------------------------------------------------------------

class ProcessRecordType(str, Enum):
    DAILY_LOG = "daily_log"         # 施工日志
    QUALITY_CHECK = "quality_check" # 质量检查
    INSPECTION = "inspection"       # 巡检记录
    MATERIAL_ENTRY = "material_entry" # 材料进场
    HIDDEN_WORK = "hidden_work"     # 隐蔽工程验收
    SAFETY_CHECK = "safety_check"   # 安全检查


class ProcessRecord(TimestampedModel):
    """过程管理记录 — 施工日志、质检、巡检等"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    record_type: ProcessRecordType
    title: str
    date: str                  # "2026-03-13"
    author: str
    content: str = ""
    status: str = "normal"     # "normal" | "issue" | "resolved"
    attachments: list[str] = Field(default_factory=list)  # 附件文件名列表
    related_stage: str = ""    # 关联阶段


# ---------------------------------------------------------------------------
# Knowledge Base
# ---------------------------------------------------------------------------

class KnowledgeItem(TimestampedModel):
    """A single entry in the enterprise knowledge base."""
    id: UUID = Field(default_factory=uuid4)
    title: str
    content: str
    knowledge_type: str  # project | regulation | industry | template | supplier
    tags: list[str] = Field(default_factory=list)
    project_id: str | None = None
    department: str | None = None
    classification_level: str = "internal"  # public | internal | confidential | secret
    version: str = "1.0"
    embedding_vector: list[float] | None = None  # populated after ingestion


# ---------------------------------------------------------------------------
# Shared Enums (HR + Finance approval flow)
# ---------------------------------------------------------------------------

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ---------------------------------------------------------------------------
# HR Enums & Models
# ---------------------------------------------------------------------------

class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    RESIGNED = "resigned"


class AttendanceStatus(str, Enum):
    NORMAL = "normal"
    LATE = "late"
    ABSENT = "absent"
    LEAVE = "leave"


class LeaveType(str, Enum):
    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"


class Employee(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    department: str
    position: str
    hire_date: str           # "2024-03-01"
    salary: float
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    phone: str = ""
    email: str = ""
    emergency_contact: str = ""


class AttendanceRecord(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    employee_id: str
    date: str                # "2026-03-11"
    check_in: str | None = None   # "08:55"
    check_out: str | None = None  # "18:05"
    status: AttendanceStatus = AttendanceStatus.NORMAL


class LeaveRequest(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    employee_id: str
    leave_type: LeaveType
    start_date: str
    end_date: str
    days: float
    reason: str = ""
    status: ApprovalStatus = ApprovalStatus.PENDING
    approver: str | None = None


class SalaryRecord(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    employee_id: str
    month: str               # "2026-03"
    base_salary: float
    overtime_pay: float = 0
    bonus: float = 0
    deductions: float = 0
    social_insurance: float = 0
    tax: float = 0
    net_salary: float = 0


# ---------------------------------------------------------------------------
# Finance Enums & Models
# ---------------------------------------------------------------------------

class ExpenseCategory(str, Enum):
    TRAVEL = "travel"
    OFFICE = "office"
    ENTERTAINMENT = "entertainment"
    MATERIAL = "material"
    OTHER = "other"


class ExpenseStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class InvoiceStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class ExpenseReport(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    submitter: str
    project_id: str | None = None
    category: ExpenseCategory
    amount: float
    description: str = ""
    receipts_count: int = 0
    submit_date: str = ""
    status: ExpenseStatus = ExpenseStatus.DRAFT
    approver: str | None = None
    payment_date: str | None = None


class BudgetLine(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str | None = None
    category: str
    planned_amount: float
    actual_amount: float = 0
    fiscal_year: int = 2026
    quarter: int = 1
    notes: str = ""


class Invoice(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str | None = None
    vendor: str
    amount: float
    invoice_date: str = ""
    due_date: str = ""
    status: InvoiceStatus = InvoiceStatus.PENDING
    category: str = ""


# ---------------------------------------------------------------------------
# OA Enums & Models
# ---------------------------------------------------------------------------

class NoticeType(str, Enum):
    SYSTEM = "system"
    ANNOUNCEMENT = "announcement"
    APPROVAL_RESULT = "approval_result"


class Notice(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    content: str
    type: NoticeType = NoticeType.SYSTEM
    target_user: str | None = None  # None = broadcast to all
    is_read: bool = False


class VehicleRequest(TimestampedModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    applicant: str
    date: str          # YYYY-MM-DD
    origin: str
    destination: str
    reason: str = ""
    status: ApprovalStatus = ApprovalStatus.PENDING
    approver: str | None = None
