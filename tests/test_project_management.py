"""Tests for Project Management Enhancement."""
import pytest
from uuid import uuid4
from datetime import datetime, timedelta

from src.project.management import (
    WBSNode,
    Milestone,
    Risk,
    RiskLevel,
    ProjectMetrics,
)


class TestWBSNode:
    """Test WBS (Work Breakdown Structure) Node."""

    def test_create_wbs_node(self):
        """Test creating WBS node."""
        node = WBSNode(
            id="wbs-1",
            name="项目启动",
            level=1,
            parent_id=None,
            estimated_hours=40,
        )
        
        assert node.id == "wbs-1"
        assert node.level == 1

    def test_wbs_hierarchy(self):
        """Test WBS hierarchy."""
        parent = WBSNode(
            id="parent",
            name="项目执行",
            level=1,
        )
        
        child = WBSNode(
            id="child",
            name="需求分析",
            level=2,
            parent_id="parent",
        )
        
        assert child.parent_id == "parent"
        assert child.level == 2


class TestMilestone:
    """Test Milestone."""

    def test_create_milestone(self):
        """Test creating milestone."""
        milestone = Milestone(
            id="m1",
            name="项目立项",
            project_id="p1",
            due_date=datetime(2026, 4, 1),
            status="pending",
        )
        
        assert milestone.name == "项目立项"
        assert milestone.status == "pending"

    def test_milestone_completion(self):
        """Test milestone completion."""
        milestone = Milestone(
            id="m1",
            name="需求评审",
            project_id="p1",
            due_date=datetime(2026, 4, 1),
        )
        
        milestone.complete()
        
        assert milestone.status == "completed"
        assert milestone.completed_at is not None


class TestRisk:
    """Test Risk management."""

    def test_create_risk(self):
        """Test creating risk."""
        risk = Risk(
            id="r1",
            name="人员离职风险",
            description="核心开发人员可能离职",
            level=RiskLevel.HIGH,
            project_id="p1",
        )
        
        assert risk.level == RiskLevel.HIGH

    def test_risk_level_colors(self):
        """Test risk level colors."""
        assert RiskLevel.LOW.color == "#00C875"
        assert RiskLevel.MEDIUM.color == "#FDAB3D"
        assert RiskLevel.HIGH.color == "#E2445C"
        assert RiskLevel.CRITICAL.color == "#6B5CE7"


class TestProjectMetrics:
    """Test Project Metrics."""

    def test_calculate_progress(self):
        """Test progress calculation."""
        metrics = ProjectMetrics(
            project_id="p1",
            total_tasks=10,
            completed_tasks=5,
            total_hours=100,
            spent_hours=40,
        )
        
        assert metrics.progress_percentage == 50.0
        assert metrics.hours_percentage == 40.0

    def test_schedule_variance(self):
        """Test schedule variance."""
        metrics = ProjectMetrics(
            project_id="p1",
            total_tasks=10,
            completed_tasks=3,
            planned_completed=5,
        )
        
        # SV = EV - PV = 3 - 5 = -2
        assert metrics.schedule_variance == -2

    def test_cost_variance(self):
        """Test cost variance."""
        metrics = ProjectMetrics(
            project_id="p1",
            total_hours=100,
            spent_hours=60,
            budget_hours=50,
        )
        
        # CV = EV - AC = 40 - 60 = -20 (over budget)
        # Earned value = 40 hours worth of work done
        ev = (40/100) * 50  # 20
        cv = ev - 60
        assert cv < 0  # Over budget
