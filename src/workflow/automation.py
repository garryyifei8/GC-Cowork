"""Automation rule engine — When→Then rules for automatic actions.

Supports deadline reminders, budget warnings, status change notifications.
"""

from __future__ import annotations

import logging
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Rule models
# ---------------------------------------------------------------------------


class TriggerType(str, Enum):
    SCHEDULE = "schedule"  # Cron-like periodic check
    EVENT = "event"  # Triggered by a specific event
    THRESHOLD = "threshold"  # Triggered when value crosses threshold


class ActionType(str, Enum):
    NOTIFY = "notify"  # Send notification
    UPDATE_STATUS = "update_status"  # Change entity status
    CREATE_TASK = "create_task"  # Auto-create a task
    ESCALATE = "escalate"  # Escalate to manager


class AutomationRule(BaseModel):
    """A When→Then automation rule."""

    id: str
    name: str
    description: str = ""
    enabled: bool = True
    trigger_type: TriggerType
    trigger_config: dict[str, Any] = Field(default_factory=dict)
    action_type: ActionType
    action_config: dict[str, Any] = Field(default_factory=dict)
    last_run: datetime | None = None
    run_count: int = 0


class RuleExecutionResult(BaseModel):
    rule_id: str
    success: bool
    message: str
    actions_taken: int = 0


# ---------------------------------------------------------------------------
# Rule registry
# ---------------------------------------------------------------------------

_rules: dict[str, AutomationRule] = {}


def register_rule(rule: AutomationRule) -> None:
    _rules[rule.id] = rule


def get_rules() -> list[AutomationRule]:
    return list(_rules.values())


def get_rule(rule_id: str) -> AutomationRule | None:
    return _rules.get(rule_id)


def toggle_rule(rule_id: str, enabled: bool) -> AutomationRule | None:
    rule = _rules.get(rule_id)
    if rule:
        rule.enabled = enabled
    return rule


# ---------------------------------------------------------------------------
# Rule evaluation functions
# ---------------------------------------------------------------------------


async def check_deadline_reminders() -> list[dict[str, Any]]:
    """Check for tasks/projects approaching deadlines."""
    from src.stores.project_store import list_projects
    from src.stores.task_store import list_all_tasks

    alerts: list[dict[str, Any]] = []
    now = datetime.now()
    warning_days = 3

    # Check tasks
    tasks = list_all_tasks()
    for task in tasks:
        if task.due_date and task.status.value not in ("done", "blocked"):
            try:
                due = datetime.strptime(task.due_date, "%Y-%m-%d")
                days_left = (due - now).days
                if 0 <= days_left <= warning_days:
                    alerts.append(
                        {
                            "type": "task_deadline",
                            "entity_id": task.id,
                            "title": f"任务即将到期: {task.name}",
                            "content": f"剩余 {days_left} 天，截止 {task.due_date}",
                            "severity": "warning" if days_left > 1 else "critical",
                            "assignee": task.assignee,
                        }
                    )
                elif days_left < 0:
                    alerts.append(
                        {
                            "type": "task_overdue",
                            "entity_id": task.id,
                            "title": f"任务已逾期: {task.name}",
                            "content": f"已逾期 {abs(days_left)} 天",
                            "severity": "critical",
                            "assignee": task.assignee,
                        }
                    )
            except ValueError:
                pass

    # Check projects
    projects = list_projects()
    for proj in projects:
        if proj.due_date and proj.status not in ("completed", "archived"):
            try:
                due = datetime.strptime(proj.due_date, "%Y-%m-%d")
                days_left = (due - now).days
                if 0 <= days_left <= 7:
                    alerts.append(
                        {
                            "type": "project_deadline",
                            "entity_id": proj.id,
                            "title": f"项目即将到期: {proj.name}",
                            "content": f"剩余 {days_left} 天",
                            "severity": "warning",
                        }
                    )
            except ValueError:
                pass

    return alerts


async def check_budget_warnings() -> list[dict[str, Any]]:
    """Check for budget overruns."""
    from src.stores.finance_store import list_budgets

    alerts: list[dict[str, Any]] = []
    budgets = list_budgets()

    for budget in budgets:
        if budget.planned_amount > 0:
            utilization = budget.actual_amount / budget.planned_amount
            if utilization > 1.0:
                alerts.append(
                    {
                        "type": "budget_overrun",
                        "entity_id": budget.id,
                        "title": f"预算超支: {budget.category}",
                        "content": f"使用率 {utilization:.0%}，超出 {(utilization - 1) * 100:.1f}%",
                        "severity": "critical",
                        "project_id": budget.project_id,
                    }
                )
            elif utilization > 0.85:
                alerts.append(
                    {
                        "type": "budget_warning",
                        "entity_id": budget.id,
                        "title": f"预算预警: {budget.category}",
                        "content": f"使用率 {utilization:.0%}，接近上限",
                        "severity": "warning",
                        "project_id": budget.project_id,
                    }
                )

    return alerts


async def check_contract_expiry() -> list[dict[str, Any]]:
    """Check for contracts expiring soon."""
    from src.stores.legal_store import list_contracts

    alerts: list[dict[str, Any]] = []
    now = datetime.now()

    contracts = list_contracts(status="active")
    for contract in contracts:
        if contract.end_date:
            try:
                end = datetime.strptime(contract.end_date, "%Y-%m-%d")
                days_left = (end - now).days
                if 0 <= days_left <= 30:
                    alerts.append(
                        {
                            "type": "contract_expiring",
                            "entity_id": contract.id,
                            "title": f"合同即将到期: {contract.title}",
                            "content": f"剩余 {days_left} 天，到期日 {contract.end_date}",
                            "severity": "warning" if days_left > 7 else "critical",
                        }
                    )
            except (ValueError, AttributeError):
                pass

    return alerts


# ---------------------------------------------------------------------------
# Main evaluation loop
# ---------------------------------------------------------------------------


async def evaluate_all_rules() -> list[RuleExecutionResult]:
    """Run all enabled automation rules and return results."""
    results: list[RuleExecutionResult] = []

    for rule in _rules.values():
        if not rule.enabled:
            continue

        try:
            alerts: list[dict[str, Any]] = []

            if rule.id == "deadline_reminder":
                alerts = await check_deadline_reminders()
            elif rule.id == "budget_warning":
                alerts = await check_budget_warnings()
            elif rule.id == "contract_expiry":
                alerts = await check_contract_expiry()

            # Dispatch notifications for alerts
            if alerts:
                try:
                    from src.api.routes.ws import notify_all

                    for alert in alerts:
                        await notify_all(
                            event_type=alert["type"],
                            title=alert["title"],
                            content=alert.get("content", ""),
                            severity=alert.get("severity", "info"),
                            data=alert,
                        )
                except ImportError:
                    pass  # WebSocket module not available

            rule.last_run = datetime.utcnow()
            rule.run_count += 1

            results.append(
                RuleExecutionResult(
                    rule_id=rule.id,
                    success=True,
                    message=f"已检查，发现 {len(alerts)} 条提醒",
                    actions_taken=len(alerts),
                )
            )

        except Exception as e:
            logger.error(f"Rule {rule.id} failed: {e}")
            results.append(
                RuleExecutionResult(
                    rule_id=rule.id,
                    success=False,
                    message=str(e),
                )
            )

    return results


# ---------------------------------------------------------------------------
# Preset rules
# ---------------------------------------------------------------------------


def register_preset_rules() -> None:
    """Register the built-in automation rules."""
    register_rule(
        AutomationRule(
            id="deadline_reminder",
            name="截止日提醒",
            description="任务/项目临近截止日期时自动提醒（3天内预警，逾期告警）",
            trigger_type=TriggerType.SCHEDULE,
            trigger_config={"interval_minutes": 60},
            action_type=ActionType.NOTIFY,
            action_config={"channels": ["websocket", "notification_panel"]},
        )
    )

    register_rule(
        AutomationRule(
            id="budget_warning",
            name="预算预警",
            description="预算使用率超过85%时预警，超100%时告警",
            trigger_type=TriggerType.THRESHOLD,
            trigger_config={"warning_threshold": 0.85, "critical_threshold": 1.0},
            action_type=ActionType.NOTIFY,
            action_config={"channels": ["websocket", "notification_panel"]},
        )
    )

    register_rule(
        AutomationRule(
            id="contract_expiry",
            name="合同到期提醒",
            description="合同30天内到期时提醒，7天内告警",
            trigger_type=TriggerType.SCHEDULE,
            trigger_config={"interval_minutes": 360},
            action_type=ActionType.NOTIFY,
            action_config={"channels": ["websocket", "notification_panel"]},
        )
    )
