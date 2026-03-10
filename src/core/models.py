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
    ACTION = "action"   # 操作卡片 — buttons for approve/reject/assign
    DATA = "data"       # 数据卡片 — charts and summaries
    FORM = "form"       # 表单卡片 — inline form filling
    FILE = "file"       # 文件卡片 — document preview/edit


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
