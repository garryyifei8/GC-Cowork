"""Tests for core data models."""
import pytest
from uuid import uuid4

from src.core.models import (
    AgentIntent,
    AgentRequest,
    AgentResponse,
    AgentType,
    CardType,
    InteractiveCard,
    KnowledgeItem,
    Message,
    MessageRole,
    Project,
    ProjectStage,
    RiskItem,
    Session,
    TaskComplexity,
    WorkflowPattern,
)


class TestAgentIntent:
    def test_defaults(self):
        intent = AgentIntent(primary_agent=AgentType.PROJECT)
        assert intent.complexity == TaskComplexity.SIMPLE
        assert intent.workflow_pattern == WorkflowPattern.SERIAL
        assert intent.confidence == 1.0
        assert intent.secondary_agents == []

    def test_confidence_bounds(self):
        with pytest.raises(Exception):
            AgentIntent(primary_agent=AgentType.FINANCE, confidence=1.5)
        with pytest.raises(Exception):
            AgentIntent(primary_agent=AgentType.FINANCE, confidence=-0.1)


class TestSession:
    def test_create_session(self):
        session = Session(user_id="user_001")
        assert session.user_id == "user_001"
        assert session.messages == []
        assert session.id is not None

    def test_add_message(self):
        session = Session(user_id="user_001")
        msg = Message(
            session_id=session.id,
            role=MessageRole.USER,
            content="帮我查看XX博物馆项目进度",
        )
        session.messages.append(msg)
        assert len(session.messages) == 1
        assert session.messages[0].content == "帮我查看XX博物馆项目进度"


class TestProject:
    def test_create_project(self):
        project = Project(id="proj_001", name="XX博物馆EPC项目")
        assert project.stage == ProjectStage.INITIATION
        assert project.progress_pct == 0.0
        assert project.risks == []

    def test_progress_bounds(self):
        with pytest.raises(Exception):
            Project(id="p1", name="test", progress_pct=101.0)
        with pytest.raises(Exception):
            Project(id="p1", name="test", progress_pct=-1.0)

    def test_with_risks(self):
        risk = RiskItem(
            title="材料到货延迟",
            description="幕墙材料预计延迟3天",
            severity="medium",
            owner="项目经理",
        )
        project = Project(id="p1", name="test", risks=[risk])
        assert len(project.risks) == 1
        assert project.risks[0].severity == "medium"


class TestInteractiveCard:
    def test_action_card(self):
        card = InteractiveCard(
            card_type=CardType.ACTION,
            title="审批申请",
            actions=[{"label": "通过", "action": "approve"}, {"label": "驳回", "action": "reject"}],
        )
        assert card.card_type == CardType.ACTION
        assert len(card.actions) == 2


class TestKnowledgeItem:
    def test_create_knowledge_item(self):
        item = KnowledgeItem(
            title="EPC合同标准模板",
            content="合同正文...",
            knowledge_type="template",
            tags=["合同", "EPC", "模板"],
        )
        assert item.classification_level == "internal"
        assert item.version == "1.0"
        assert "EPC" in item.tags
