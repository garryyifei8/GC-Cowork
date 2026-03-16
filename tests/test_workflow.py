"""Tests for Workflow Engine."""
import pytest
from uuid import uuid4
from datetime import datetime, timedelta

from src.workflow.engine import (
    WorkflowEngine,
    Workflow,
    WorkflowNode,
    WorkflowEdge,
    WorkflowInstance,
    NodeStatus,
    WorkflowStatus,
)


class TestWorkflowEngine:
    """Test WorkflowEngine."""

    @pytest.fixture
    def engine(self):
        return WorkflowEngine()

    def test_create_workflow(self, engine):
        """Test creating a workflow."""
        workflow = Workflow(
            id="wf-1",
            name="项目立项流程",
            description="项目立项审批流程",
            nodes=[],
            edges=[],
        )
        
        assert workflow.id == "wf-1"
        assert workflow.name == "项目立项流程"

    def test_add_node(self, engine):
        """Test adding nodes to workflow."""
        workflow = Workflow(
            id="wf-1",
            name="测试流程",
            nodes=[
                WorkflowNode(
                    id="start",
                    name="开始",
                    node_type="start",
                ),
                WorkflowNode(
                    id="approval",
                    name="审批",
                    node_type="approval",
                    assignee="manager",
                ),
                WorkflowNode(
                    id="end",
                    name="结束",
                    node_type="end",
                ),
            ],
            edges=[
                WorkflowEdge(from_node="start", to_node="approval"),
                WorkflowEdge(from_node="approval", to_node="end"),
            ],
        )
        
        assert len(workflow.nodes) == 3
        assert len(workflow.edges) == 2


class TestWorkflowInstance:
    """Test Workflow Instance."""

    @pytest.fixture
    def instance(self):
        return WorkflowInstance(
            id=str(uuid4()),
            workflow_id="wf-1",
            current_node_id="start",
            status=WorkflowStatus.PENDING,
            data={"project_name": "测试项目"},
        )

    def test_create_instance(self, instance):
        """Test creating workflow instance."""
        assert instance.workflow_id == "wf-1"
        assert instance.status == WorkflowStatus.PENDING

    def test_start_instance(self, instance):
        """Test starting workflow instance."""
        instance.start()
        
        assert instance.status == WorkflowStatus.RUNNING
        assert instance.current_node_id == "start"
        assert instance.started_at is not None

    def test_complete_node(self, instance):
        """Test completing a node."""
        instance.start()
        instance.complete_node("start", "approval", {"approved": True})
        
        assert instance.current_node_id == "approval"

    def test_cancel_instance(self, instance):
        """Test cancelling workflow instance."""
        instance.start()
        instance.cancel("用户取消")
        
        assert instance.status == WorkflowStatus.CANCELLED
        assert instance.end_reason == "用户取消"


class TestApprovalFlow:
    """Test approval workflow."""

    def test_approval_flow(self):
        """Test approval flow."""
        workflow = Workflow(
            id="approval-wf",
            name="审批流程",
            nodes=[
                WorkflowNode(id="submit", name="提交申请", node_type="start"),
                WorkflowNode(id="manager_review", name="经理审批", node_type="approval"),
                WorkflowNode(id="finance_review", name="财务审批", node_type="approval"),
                WorkflowNode(id="complete", name="完成", node_type="end"),
            ],
            edges=[
                WorkflowEdge(from_node="submit", to_node="manager_review"),
                WorkflowEdge(from_node="manager_review", to_node="finance_review"),
                WorkflowEdge(from_node="finance_review", to_node="complete"),
            ],
        )
        
        instance = WorkflowInstance(
            id=str(uuid4()),
            workflow_id=workflow.id,
            current_node_id="submit",
            status=WorkflowStatus.PENDING,
            data={"amount": 10000},
        )
        
        # Start
        instance.start()
        assert instance.status == WorkflowStatus.RUNNING
        
        # Complete submit -> manager_review
        instance.complete_node("submit", "manager_review", {}, workflow)
        assert instance.current_node_id == "manager_review"
        
        # Complete manager_review -> finance_review
        instance.complete_node("manager_review", "finance_review", {"approved": True}, workflow)
        assert instance.current_node_id == "finance_review"
        
        # Complete finance_review -> complete
        instance.complete_node("finance_review", "complete", {"approved": True}, workflow)
        assert instance.status == WorkflowStatus.COMPLETED


class TestConditionalFlow:
    """Test conditional workflow."""

    def test_conditional_branch(self):
        """Test conditional branching."""
        workflow = Workflow(
            id="conditional-wf",
            name="条件分支流程",
            nodes=[
                WorkflowNode(id="start", name="开始", node_type="start"),
                WorkflowNode(id="decision", name="判断金额", node_type="condition"),
                WorkflowNode(id="high_amount", name="高管审批", node_type="approval"),
                WorkflowNode(id="low_amount", name="经理审批", node_type="approval"),
                WorkflowNode(id="end", name="结束", node_type="end"),
            ],
            edges=[
                WorkflowEdge(from_node="start", to_node="decision"),
                WorkflowEdge(
                    from_node="decision", 
                    to_node="high_amount",
                    condition={"field": "amount", "operator": ">=", "value": 10000}
                ),
                WorkflowEdge(
                    from_node="decision", 
                    to_node="low_amount",
                    condition={"field": "amount", "operator": "<", "value": 10000}
                ),
                WorkflowEdge(from_node="high_amount", to_node="end"),
                WorkflowEdge(from_node="low_amount", to_node="end"),
            ],
        )
        
        # Test high amount path
        instance = WorkflowInstance(
            id=str(uuid4()),
            workflow_id=workflow.id,
            current_node_id="start",
            status=WorkflowStatus.PENDING,
            data={"amount": 50000},
        )
        instance.start()
        
        # Find next node based on condition
        next_node = workflow.find_next_node("decision", instance.data)
        assert next_node == "high_amount"
        
        # Test low amount path
        instance2 = WorkflowInstance(
            id=str(uuid4()),
            workflow_id=workflow.id,
            current_node_id="start",
            status=WorkflowStatus.PENDING,
            data={"amount": 5000},
        )
        instance2.start()
        
        next_node2 = workflow.find_next_node("decision", instance2.data)
        assert next_node2 == "low_amount"


class TestParallelFlow:
    """Test parallel workflow."""

    def test_parallel_approval(self):
        """Test parallel approval nodes."""
        workflow = Workflow(
            id="parallel-wf",
            name="并行审批流程",
            nodes=[
                WorkflowNode(id="start", name="开始", node_type="start"),
                WorkflowNode(id="parallel", name="并行审批", node_type="parallel"),
                WorkflowNode(id="manager", name="经理审批", node_type="approval"),
                WorkflowNode(id="finance", name="财务审批", node_type="approval"),
                WorkflowNode(id="complete", name="完成", node_type="end"),
            ],
            edges=[
                WorkflowEdge(from_node="start", to_node="parallel"),
                WorkflowEdge(from_node="parallel", to_node="manager", parallel=True),
                WorkflowEdge(from_node="parallel", to_node="finance", parallel=True),
                WorkflowEdge(from_node="manager", to_node="complete"),
                WorkflowEdge(from_node="finance", to_node="complete"),
            ],
        )
        
        # Verify parallel edges
        parallel_edges = [e for e in workflow.edges if e.parallel]
        assert len(parallel_edges) == 2


class TestNotification:
    """Test workflow notifications."""

    def test_node_notification(self):
        """Test notification on node transition."""
        node = WorkflowNode(
            id="approval",
            name="审批",
            node_type="approval",
            notify_on_complete=True,
            notify_roles=["manager"],
        )
        
        assert node.notify_on_complete is True
        assert "manager" in node.notify_roles
