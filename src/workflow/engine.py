"""Workflow Engine - 审批流和工作流引擎.

支持：
- 串行审批流
- 并行审批流
- 条件分支
- 自动通知
- 审批历史记录
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class NodeStatus(str, Enum):
    """节点状态."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class WorkflowStatus(str, Enum):
    """工作流状态."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class WorkflowNode(BaseModel):
    """工作流节点."""
    id: str
    name: str
    node_type: str = "task"  # start, end, task, approval, condition, parallel
    assignee: str | None = None  # 处理人
    roles: list[str] = Field(default_factory=list)  # 角色
    notify_on_complete: bool = False
    notify_roles: list[str] = Field(default_factory=list)
    timeout_hours: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkflowEdge(BaseModel):
    """工作流边."""
    from_node: str
    to_node: str
    condition: dict[str, Any] | None = None  # 条件分支
    parallel: bool = False  # 是否并行


class Workflow(BaseModel):
    """工作流定义."""
    id: str
    name: str
    description: str | None = None
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str | None = None
    is_active: bool = True

    def find_next_node(self, current_node_id: str, data: dict[str, Any]) -> str | None:
        """根据条件找到下一个节点."""
        # 找到从当前节点出发的所有边
        outgoing_edges = [e for e in self.edges if e.from_node == current_node_id]
        
        if not outgoing_edges:
            return None
        
        # 如果没有条件，返回第一个
        edges_without_condition = [e for e in outgoing_edges if e.condition is None]
        if edges_without_condition:
            return edges_without_condition[0].to_node
        
        # 检查条件
        for edge in outgoing_edges:
            if edge.condition and self._evaluate_condition(edge.condition, data):
                return edge.to_node
        
        return None
    
    def _evaluate_condition(self, condition: dict[str, Any], data: dict[str, Any]) -> bool:
        """评估条件."""
        field = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")
        
        if field not in data:
            return False
        
        actual_value = data[field]
        
        if operator == "==":
            return actual_value == value
        elif operator == "!=":
            return actual_value != value
        elif operator == ">":
            return actual_value > value
        elif operator == ">=":
            return actual_value >= value
        elif operator == "<":
            return actual_value < value
        elif operator == "<=":
            return actual_value <= value
        elif operator == "in":
            return actual_value in value
        elif operator == "contains":
            return value in actual_value
        
        return False
    
    def get_node(self, node_id: str) -> WorkflowNode | None:
        """获取节点."""
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None


class WorkflowInstance(BaseModel):
    """工作流实例."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    workflow_id: str
    current_node_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    data: dict[str, Any] = Field(default_factory=dict)
    
    # 节点执行历史
    node_history: list[dict[str, Any]] = Field(default_factory=list)
    
    # 时间戳
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    end_reason: str | None = None
    
    # 当前节点的审批意见
    current_approval: dict[str, Any] | None = None

    def start(self) -> None:
        """启动工作流."""
        self.status = WorkflowStatus.RUNNING
        self.started_at = datetime.utcnow()
        self.node_history.append({
            "node_id": self.current_node_id,
            "action": "started",
            "timestamp": self.started_at.isoformat(),
        })

    def complete_node(
        self, 
        node_id: str, 
        next_node_id: str | None = None, 
        approval_data: dict[str, Any] | None = None,
        workflow: Workflow | None = None
    ) -> None:
        """完成当前节点，转到下一个节点."""
        now = datetime.utcnow()
        
        self.node_history.append({
            "node_id": node_id,
            "action": "completed",
            "approval_data": approval_data or {},
            "timestamp": now.isoformat(),
        })
        
        if next_node_id:
            # 检查下一个节点是否是end类型
            if workflow:
                next_node = workflow.get_node(next_node_id)
                if next_node and next_node.node_type == "end":
                    self.complete({"reason": "Workflow completed"})
                    return
            
            self.current_node_id = next_node_id
        else:
            # 没有下一个节点，工作流完成
            self.complete({"reason": "All nodes completed"})

    def approve(self, comment: str | None = None, approved: bool = True) -> None:
        """审批通过/拒绝."""
        now = datetime.utcnow()
        
        self.current_approval = {
            "approved": approved,
            "comment": comment,
            "timestamp": now.isoformat(),
        }
        
        action = "approved" if approved else "rejected"
        self.node_history.append({
            "node_id": self.current_node_id,
            "action": action,
            "approval": self.current_approval,
            "timestamp": now.isoformat(),
        })

    def complete(self, result: dict[str, Any] | None = None) -> None:
        """完成工作流."""
        self.status = WorkflowStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.node_history.append({
            "node_id": self.current_node_id,
            "action": "workflow_completed",
            "result": result or {},
            "timestamp": self.completed_at.isoformat(),
        })

    def cancel(self, reason: str) -> None:
        """取消工作流."""
        self.status = WorkflowStatus.CANCELLED
        self.completed_at = datetime.utcnow()
        self.end_reason = reason
        self.node_history.append({
            "node_id": self.current_node_id,
            "action": "cancelled",
            "reason": reason,
            "timestamp": self.completed_at.isoformat(),
        })

    def reject(self, reason: str) -> None:
        """拒绝当前审批."""
        now = datetime.utcnow()
        self.node_history.append({
            "node_id": self.current_node_id,
            "action": "rejected",
            "reason": reason,
            "timestamp": now.isoformat(),
        })
        
        # 审批拒绝后，工作流结束
        self.status = WorkflowStatus.FAILED
        self.completed_at = now
        self.end_reason = f"Rejected: {reason}"


class WorkflowEngine:
    """工作流引擎."""
    
    def __init__(self):
        self._workflows: dict[str, Workflow] = {}
        self._instances: dict[str, WorkflowInstance] = {}
    
    def register_workflow(self, workflow: Workflow) -> None:
        """注册工作流."""
        self._workflows[workflow.id] = workflow
    
    def create_instance(
        self, 
        workflow_id: str, 
        initial_data: dict[str, Any],
        initiator: str | None = None
    ) -> WorkflowInstance | None:
        """创建工作流实例."""
        workflow = self._workflows.get(workflow_id)
        if not workflow:
            return None
        
        # 找到起始节点
        start_nodes = [n for n in workflow.nodes if n.node_type == "start"]
        if not start_nodes:
            return None
        
        instance = WorkflowInstance(
            workflow_id=workflow_id,
            current_node_id=start_nodes[0].id,
            status=WorkflowStatus.PENDING,
            data=initial_data,
        )
        
        self._instances[instance.id] = instance
        return instance
    
    def get_instance(self, instance_id: str) -> WorkflowInstance | None:
        """获取工作流实例."""
        return self._instances.get(instance_id)
    
    def get_workflow(self, workflow_id: str) -> Workflow | None:
        """获取工作流定义."""
        return self._workflows.get(workflow_id)
    
    def list_instances(
        self, 
        workflow_id: str | None = None,
        status: WorkflowStatus | None = None
    ) -> list[WorkflowInstance]:
        """列出工作流实例."""
        instances = list(self._instances.values())
        
        if workflow_id:
            instances = [i for i in instances if i.workflow_id == workflow_id]
        
        if status:
            instances = [i for i in instances if i.status == status]
        
        return instances
    
    def process_approval(
        self,
        instance_id: str,
        approved: bool,
        comment: str | None = None,
    ) -> WorkflowInstance | None:
        """处理审批."""
        instance = self._instances.get(instance_id)
        if not instance:
            return None
        
        workflow = self._workflows.get(instance.workflow_id)
        if not workflow:
            return None
        
        # 记录审批意见
        instance.approve(comment, approved)
        
        if approved:
            # 找到下一个节点
            next_node_id = workflow.find_next_node(instance.current_node_id, instance.data)
            
            if next_node_id:
                instance.complete_node(instance.current_node_id, next_node_id, {"approved": True})
            else:
                instance.complete({"approved": True})
        else:
            instance.reject(comment or "Rejected")
        
        return instance


# ============================================================================
# 预设工作流模板
# ============================================================================

def create_approval_workflow(name: str, approvers: list[str]) -> Workflow:
    """创建审批工作流."""
    nodes = [
        WorkflowNode(id="submit", name="提交申请", node_type="start"),
    ]
    edges = []
    
    # 为每个审批人创建节点
    prev_node = "submit"
    for i, approver in enumerate(approvers):
        node_id = f"approve_{i}"
        nodes.append(WorkflowNode(
            id=node_id,
            name=f"{approver}审批",
            node_type="approval",
            assignee=approver,
            notify_on_complete=True,
        ))
        edges.append(WorkflowEdge(from_node=prev_node, to_node=node_id))
        prev_node = node_id
    
    # 结束节点
    nodes.append(WorkflowNode(id="complete", name="完成", node_type="end"))
    edges.append(WorkflowEdge(from_node=prev_node, to_node="complete"))
    
    return Workflow(
        id=f"approval_{name}",
        name=name,
        nodes=nodes,
        edges=edges,
    )


def create_project_initiation_workflow() -> Workflow:
    """创建项目立项工作流."""
    return create_approval_workflow("项目立项审批", ["项目经理", "部门经理", "财务"])
