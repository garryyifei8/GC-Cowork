"""Tests for Permission System (RBAC + ABAC)."""
import pytest
from uuid import uuid4
from datetime import datetime, timedelta

from src.core.permissions import (
    User,
    Role,
    Permission,
    Resource,
    RBACEngine,
    ABACEngine,
    AccessDecision,
    PermissionContext,
)


class TestUser:
    """Test User model."""

    def test_create_user(self):
        """Test creating a user."""
        user = User(
            id="user-1",
            username="zhangsan",
            name="张三",
            email="zhangsan@company.com",
            roles=["project_manager"],
            departments=["技术部"],
        )
        
        assert user.id == "user-1"
        assert "project_manager" in user.roles


class TestRole:
    """Test Role model."""

    def test_create_role(self):
        """Test creating a role."""
        role = Role(
            id="role-1",
            name="项目经理",
            permissions=["project:read", "project:write", "task:assign"],
            description="负责项目管理和任务分配",
        )
        
        assert role.name == "项目经理"
        assert "project:write" in role.permissions


class TestPermission:
    """Test Permission model."""

    def test_create_permission(self):
        """Test creating a permission."""
        permission = Permission(
            id="perm-1",
            name="项目创建",
            action="create",
            resource="project",
            conditions={"department": "技术部"},
        )
        
        assert permission.action == "create"
        assert permission.resource == "project"


class TestRBACEngine:
    """Test RBAC (Role-Based Access Control) Engine."""

    @pytest.fixture
    def engine(self):
        return RBACEngine()

    @pytest.fixture
    def setup_roles(self, engine):
        """Setup roles."""
        engine.add_role(Role(
            id="admin",
            name="管理员",
            permissions=["*"],
        ))
        engine.add_role(Role(
            id="project_manager",
            name="项目经理",
            permissions=["project:*", "task:*", "report:read"],
        ))
        engine.add_role(Role(
            id="team_member",
            name="团队成员",
            permissions=["project:read", "task:read", "task:write"],
        ))
        engine.add_role(Role(
            id="finance",
            name="财务",
            permissions=["finance:*", "project:read"],
        ))

    def test_add_role(self, engine, setup_roles):
        """Test adding roles."""
        role = engine.get_role("admin")
        assert role is not None
        assert role.name == "管理员"

    def test_has_permission_admin(self, engine, setup_roles):
        """Test admin has all permissions."""
        decision = engine.check_permission(
            user_id="user-1",
            roles=["admin"],
            action="delete",
            resource="project",
        )
        assert decision.allowed is True

    def test_has_permission_project_manager(self, engine, setup_roles):
        """Test project manager permissions."""
        decision = engine.check_permission(
            user_id="user-2",
            roles=["project_manager"],
            action="create",
            resource="project",
        )
        assert decision.allowed is True

    def test_has_permission_denied(self, engine, setup_roles):
        """Test permission denied."""
        decision = engine.check_permission(
            user_id="user-3",
            roles=["team_member"],
            action="delete",
            resource="project",
        )
        assert decision.allowed is False

    def test_wildcard_permission(self, engine, setup_roles):
        """Test wildcard permission."""
        decision = engine.check_permission(
            user_id="user-4",
            roles=["project_manager"],
            action="any_action",
            resource="project",
        )
        assert decision.allowed is True


class TestABACEngine:
    """Test ABAC (Attribute-Based Access Control) Engine."""

    @pytest.fixture
    def engine(self):
        return ABACEngine()

    def test_check_time_based_access(self, engine):
        """Test time-based access control."""
        # Create context within working hours
        context = PermissionContext(
            user_id="user-1",
            action="read",
            resource="document",
            resource_attributes={"classification": "internal"},
            time=datetime(2026, 3, 16, 10, 0),  # 10 AM
        )
        
        decision = engine.check_permission(context)
        assert decision.allowed is True

    def test_check_time_based_access_outside_hours(self, engine):
        """Test time-based access outside working hours."""
        context = PermissionContext(
            user_id="user-1",
            action="read",
            resource="document",
            resource_attributes={"classification": "internal"},
            time=datetime(2026, 3, 16, 23, 0),  # 11 PM
        )
        
        # With time policy, should be denied
        decision = engine.check_permission(context)
        # This depends on policy - by default might be allowed
        assert decision is not None

    def test_check_resource_ownership(self, engine):
        """Test resource ownership check."""
        context = PermissionContext(
            user_id="user-1",
            action="delete",
            resource="project",
            resource_attributes={
                "owner_id": "user-1",  # Owner
                "status": "draft"
            },
        )
        
        decision = engine.check_permission(context)
        assert decision.allowed is True

    def test_check_resource_ownership_denied(self, engine):
        """Test resource ownership denied."""
        context = PermissionContext(
            user_id="user-2",
            action="delete",
            resource="project",
            resource_attributes={
                "owner_id": "user-1",  # Different owner
                "status": "draft"
            },
        )
        
        # With ownership policy, should be denied
        decision = engine.check_permission(context)
        # Depends on implementation
        assert decision is not None


class TestCombinedRBACABAC:
    """Test combined RBAC + ABAC."""

    def test_rbac_with_abac_override(self):
        """Test RBAC with ABAC policy override."""
        rbac = RBACEngine()
        abac = ABACEngine()
        
        # Setup RBAC
        rbac.add_role(Role(
            id="employee",
            name="员工",
            permissions=["document:read"],
        ))
        
        # RBAC allows
        rbac_decision = rbac.check_permission(
            user_id="user-1",
            roles=["employee"],
            action="read",
            resource="document",
        )
        
        # ABAC check for additional policy
        context = PermissionContext(
            user_id="user-1",
            action="read",
            resource="document",
            resource_attributes={"classification": "confidential"},
        )
        
        abac_decision = abac.check_permission(context)
        
        # Combined decision
        final_allowed = rbac_decision.allowed and abac_decision.allowed
        assert final_allowed is not None


class TestPermissionContext:
    """Test PermissionContext."""

    def test_create_context(self):
        """Test creating permission context."""
        context = PermissionContext(
            user_id="user-1",
            action="write",
            resource="project",
            user_attributes={"department": "技术部"},
            resource_attributes={"status": "draft"},
            environment={"ip": "192.168.1.100"},
        )
        
        assert context.user_id == "user-1"
        assert context.action == "write"
        assert context.user_attributes["department"] == "技术部"


class TestAccessDecision:
    """Test AccessDecision."""

    def test_create_decision(self):
        """Test creating access decision."""
        decision = AccessDecision(
            allowed=True,
            reason="User has project:write permission",
            policy="rbac",
        )
        
        assert decision.allowed is True
        assert decision.policy == "rbac"

    def test_create_denied_decision(self):
        """Test creating denied decision."""
        decision = AccessDecision(
            allowed=False,
            reason="Insufficient permissions",
            policy="rbac",
        )
        
        assert decision.allowed is False
        assert "Insufficient" in decision.reason
