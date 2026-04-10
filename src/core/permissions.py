"""Permission System - RBAC + ABAC.

RBAC (Role-Based Access Control): 基于角色的访问控制
ABAC (Attribute-Based Access Control): 基于属性的访问控制
"""

from __future__ import annotations

from datetime import datetime, time
from typing import Any

from pydantic import BaseModel, Field

# ============================================================================
# Data Models
# ============================================================================


class User(BaseModel):
    """用户."""

    id: str
    username: str
    name: str
    email: str | None = None
    roles: list[str] = Field(default_factory=list)
    departments: list[str] = Field(default_factory=list)
    attributes: dict[str, Any] = Field(default_factory=dict)


class Role(BaseModel):
    """角色."""

    id: str
    name: str
    permissions: list[str] = Field(default_factory=list)  # permission strings like "project:read"
    description: str | None = None
    is_system: bool = False


class Permission(BaseModel):
    """权限定义."""

    id: str
    name: str
    action: str  # create, read, write, delete, execute
    resource: str  # project, task, document, etc.
    conditions: dict[str, Any] = Field(default_factory=dict)
    description: str | None = None


class Resource(BaseModel):
    """资源."""

    id: str
    type: str  # project, task, document, etc.
    owner_id: str | None = None
    department: str | None = None
    attributes: dict[str, Any] = Field(default_factory=dict)


class PermissionContext(BaseModel):
    """权限检查上下文."""

    user_id: str
    action: str
    resource: str
    roles: list[str] = Field(default_factory=list)
    user_attributes: dict[str, Any] = Field(default_factory=dict)
    resource_attributes: dict[str, Any] = Field(default_factory=dict)
    environment: dict[str, Any] = Field(default_factory=dict)
    time: datetime | None = None


class AccessDecision(BaseModel):
    """访问决策结果."""

    allowed: bool
    reason: str
    policy: str  # rbac, abac, combined
    conditions_met: list[str] = Field(default_factory=list)


# ============================================================================
# RBAC Engine
# ============================================================================


class RBACEngine:
    """基于角色的访问控制引擎."""

    def __init__(self):
        self._roles: dict[str, Role] = {}
        self._user_roles: dict[str, list[str]] = {}  # user_id -> roles

    def add_role(self, role: Role) -> None:
        """添加角色."""
        self._roles[role.id] = role

    def get_role(self, role_id: str) -> Role | None:
        """获取角色."""
        return self._roles.get(role_id)

    def assign_role(self, user_id: str, role_id: str) -> None:
        """为用户分配角色."""
        if user_id not in self._user_roles:
            self._user_roles[user_id] = []

        if role_id not in self._user_roles[user_id]:
            self._user_roles[user_id].append(role_id)

    def revoke_role(self, user_id: str, role_id: str) -> None:
        """撤销用户角色."""
        if user_id in self._user_roles:
            self._user_roles[user_id] = [r for r in self._user_roles[user_id] if r != role_id]

    def check_permission(
        self,
        user_id: str,
        roles: list[str],
        action: str,
        resource: str,
    ) -> AccessDecision:
        """检查权限."""
        # Check each role
        for role_id in roles:
            role = self._roles.get(role_id)
            if not role:
                continue

            # Wildcard permission
            if "*" in role.permissions:
                return AccessDecision(
                    allowed=True,
                    reason=f"Role '{role.name}' has wildcard permission",
                    policy="rbac",
                )

            # Check specific permission
            # Format: "resource:action" or "resource:*"
            for perm in role.permissions:
                if ":" in perm:
                    perm_resource, perm_action = perm.split(":", 1)

                    # Resource matches
                    if perm_resource == resource or perm_resource == "*":
                        # Action matches
                        if perm_action == action or perm_action == "*":
                            return AccessDecision(
                                allowed=True,
                                reason=f"Role '{role.name}' has permission '{perm}'",
                                policy="rbac",
                            )

        return AccessDecision(
            allowed=False,
            reason="No role has required permission",
            policy="rbac",
        )


# ============================================================================
# ABAC Engine
# ============================================================================


class ABACEngine:
    """基于属性的访问控制引擎."""

    def __init__(self):
        self._policies: list[dict[str, Any]] = []
        self._setup_default_policies()

    def _setup_default_policies(self):
        """设置默认策略."""
        # 工作时间策略
        self._policies.append(
            {
                "name": "working_hours",
                "effect": "permit",
                "conditions": [
                    {
                        "type": "time",
                        "attribute": "time",
                        "operator": "between",
                        "value": {"start": "09:00", "end": "18:00"},
                    }
                ],
            }
        )

        # 资源所有权策略
        self._policies.append(
            {
                "name": "owner_full_access",
                "effect": "permit",
                "conditions": [
                    {
                        "type": "resource",
                        "attribute": "owner_id",
                        "operator": "equals",
                        "value": {"attribute": "user_id"},
                    }
                ],
            }
        )

    def add_policy(self, policy: dict[str, Any]) -> None:
        """添加策略."""
        self._policies.append(policy)

    def check_permission(self, context: PermissionContext) -> AccessDecision:
        """检查权限."""
        # Default: allow if no policies block
        allowed = True
        conditions_met = []

        # Check each policy
        for policy in self._policies:
            if self._evaluate_policy(policy, context):
                conditions_met.append(policy["name"])

                # If any policy denies, block access
                if policy.get("effect") == "deny":
                    allowed = False

        return AccessDecision(
            allowed=allowed,
            reason=f"ABAC policies evaluated: {', '.join(conditions_met) or 'no conditions matched'}",
            policy="abac",
            conditions_met=conditions_met,
        )

    def _evaluate_policy(self, policy: dict[str, Any], context: PermissionContext) -> bool:
        """评估策略."""
        conditions = policy.get("conditions", [])

        if not conditions:
            return True

        # All conditions must be met (AND logic)
        for condition in conditions:
            if not self._evaluate_condition(condition, context):
                return False

        return True

    def _evaluate_condition(self, condition: dict[str, Any], context: PermissionContext) -> bool:
        """评估条件."""
        condition_type = condition.get("type")

        if condition_type == "time":
            return self._evaluate_time_condition(condition, context)
        elif condition_type == "resource":
            return self._evaluate_resource_condition(condition, context)
        elif condition_type == "user":
            return self._evaluate_user_condition(condition, context)

        return True

    def _evaluate_time_condition(self, condition: dict[str, Any], context: PermissionContext) -> bool:
        """评估时间条件."""
        if not context.time:
            return True  # No time context, allow

        current_time = context.time.time()

        value = condition.get("value", {})

        if condition.get("operator") == "between":
            start = time.fromisoformat(value.get("start", "00:00"))
            end = time.fromisoformat(value.get("end", "23:59"))

            return start <= current_time <= end

        return True

    def _evaluate_resource_condition(self, condition: dict[str, Any], context: PermissionContext) -> bool:
        """评估资源条件."""
        attr = condition.get("attribute")
        operator = condition.get("operator")
        expected_value = condition.get("value")

        actual_value = context.resource_attributes.get(attr)

        if operator == "equals":
            # Check if value is a reference to another attribute
            if isinstance(expected_value, dict) and "attribute" in expected_value:
                ref_attr = expected_value["attribute"]
                actual_value = context.user_attributes.get(ref_attr)

            return actual_value == expected_value

        return True

    def _evaluate_user_condition(self, condition: dict[str, Any], context: PermissionContext) -> bool:
        """评估用户条件."""
        attr = condition.get("attribute")
        operator = condition.get("operator")
        expected_value = condition.get("value")

        actual_value = context.user_attributes.get(attr)

        if operator == "equals":
            return actual_value == expected_value
        elif operator == "in":
            return actual_value in expected_value

        return True


# ============================================================================
# Combined Permission Engine
# ============================================================================


class PermissionEngine:
    """组合权限引擎 (RBAC + ABAC)."""

    def __init__(self):
        self.rbac = RBACEngine()
        self.abac = ABACEngine()

    def check_permission(
        self,
        context: PermissionContext,
    ) -> AccessDecision:
        """检查权限 - RBAC first, then ABAC."""
        # Step 1: RBAC check
        rbac_decision = self.rbac.check_permission(
            user_id=context.user_id,
            roles=context.roles,
            action=context.action,
            resource=context.resource,
        )

        if not rbac_decision.allowed:
            return rbac_decision

        # Step 2: ABAC check (additional policies)
        abac_decision = self.abac.check_permission(context)

        # Combined decision: both must allow
        allowed = rbac_decision.allowed and abac_decision.allowed

        return AccessDecision(
            allowed=allowed,
            reason=f"RBAC: {rbac_decision.reason}; ABAC: {abac_decision.reason}",
            policy="combined",
            conditions_met=rbac_decision.conditions_met + abac_decision.conditions_met,
        )


# ============================================================================
# Preset Roles
# ============================================================================


def get_default_roles() -> list[Role]:
    """获取默认角色列表."""
    return [
        Role(
            id="admin",
            name="系统管理员",
            permissions=["*"],
            description="系统管理，拥有所有权限",
            is_system=True,
        ),
        Role(
            id="project_manager",
            name="项目经理",
            permissions=[
                "project:create",
                "project:read",
                "project:write",
                "project:delete",
                "task:create",
                "task:read",
                "task:write",
                "task:delete",
                "task:assign",
                "report:read",
                "report:create",
            ],
            description="项目管理权限",
        ),
        Role(
            id="team_member",
            name="团队成员",
            permissions=[
                "project:read",
                "task:read",
                "task:write",
                "document:read",
                "document:write",
            ],
            description="普通团队成员权限",
        ),
        Role(
            id="finance",
            name="财务人员",
            permissions=[
                "finance:read",
                "finance:write",
                "finance:approve",
                "project:read",
            ],
            description="财务管理权限",
        ),
        Role(
            id="hr",
            name="人事专员",
            permissions=[
                "hr:read",
                "hr:write",
                "employee:read",
                "employee:write",
            ],
            description="人事管理权限",
        ),
        Role(
            id="legal",
            name="法务人员",
            permissions=[
                "legal:read",
                "legal:write",
                "contract:read",
                "contract:write",
                "project:read",
            ],
            description="法务管理权限",
        ),
        Role(
            id="viewer",
            name="只读用户",
            permissions=[
                "project:read",
                "task:read",
                "document:read",
                "report:read",
            ],
            description="只读权限",
        ),
    ]
