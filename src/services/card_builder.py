"""Fast card builder — generates interactive cards from real data without LLM calls.

Called after intent classification to attach relevant cards to the chat response.
Cards are rendered as interactive widgets in the frontend.
"""

from __future__ import annotations

from src.core.models import AgentType


def build_cards_for_intent(agent_type: AgentType, user_message: str) -> list[dict]:
    """Build cards based on the classified agent type and user message.

    Returns a list of card dicts matching the InteractiveCard schema.
    """
    try:
        if agent_type == AgentType.PROJECT:
            return _project_cards(user_message)
        elif agent_type == AgentType.FINANCE:
            return _finance_cards(user_message)
        elif agent_type == AgentType.HR:
            return _hr_cards(user_message)
        elif agent_type == AgentType.BIDDING:
            return _bidding_cards(user_message)
        elif agent_type == AgentType.LEGAL:
            return _legal_cards(user_message)
        elif agent_type == AgentType.DOCUMENT or agent_type == AgentType.KNOWLEDGE:
            return _document_cards(user_message)
        elif agent_type == AgentType.DISPATCH:
            return _overview_cards(user_message)
        else:
            return []
    except Exception:
        return []


def _project_cards(msg: str) -> list[dict]:
    from src.stores.project_store import list_projects
    from src.stores.task_store import list_all_tasks

    projects = list_projects()
    tasks = list_all_tasks()

    cards = []

    # Project overview table
    if any(kw in msg for kw in ["项目", "概况", "总览", "进度", "所有"]):
        proj_data = []
        for p in projects[:10]:
            proj_data.append(
                {
                    "id": p.id if hasattr(p, "id") else p.get("id", ""),
                    "name": p.name if hasattr(p, "name") else p.get("name", ""),
                    "progress_pct": float(p.progress_pct if hasattr(p, "progress_pct") else p.get("progress_pct", 0)),
                    "status": str(p.status if hasattr(p, "status") else p.get("status", "")),
                    "project_type": str(p.project_type if hasattr(p, "project_type") else p.get("project_type", "")),
                    "stage": str(getattr(p, "stage", p.get("stage", "")) if isinstance(p, dict) else p.stage),
                }
            )
        cards.append(
            {
                "type": "progress",
                "title": "项目进度概览",
                "content": f"当前共 {len(projects)} 个项目",
                "data": {
                    "projects": proj_data,
                    "overall": sum(d["progress_pct"] for d in proj_data) / max(len(proj_data), 1),
                },
                "widget_type": "project_progress",
            }
        )

    # Task summary
    if any(kw in msg for kw in ["任务", "工作", "待办"]):
        task_data = []
        for t in tasks[:15]:
            task_data.append(
                {
                    "id": t.id if hasattr(t, "id") else t.get("id", ""),
                    "name": t.name if hasattr(t, "name") else t.get("name", ""),
                    "status": str(getattr(t, "status", t.get("status", "todo")) if isinstance(t, dict) else t.status),
                    "priority": str(
                        getattr(t, "priority", t.get("priority", "medium")) if isinstance(t, dict) else t.priority
                    ),
                    "assignee": str(getattr(t, "assignee", t.get("assignee", "")) or ""),
                    "project_name": str(getattr(t, "project_name", t.get("project_name", "")) or ""),
                    "due_date": str(getattr(t, "due_date", t.get("due_date", "")) or ""),
                }
            )
        cards.append(
            {
                "type": "task_list",
                "title": f"任务列表 ({len(tasks)} 个)",
                "content": f"进行中 {sum(1 for t in task_data if t['status'] == 'in_progress')} · 未开始 {sum(1 for t in task_data if t['status'] == 'todo')}",
                "data": {"tasks": task_data},
                "widget_type": "task_kanban",
            }
        )

    return cards or _default_project_card(projects)


def _default_project_card(projects) -> list[dict]:
    return [
        {
            "type": "data",
            "title": "项目概况",
            "content": f"共 {len(projects)} 个项目",
            "data": {
                "total": len(projects),
                "active": sum(
                    1 for p in projects if (p.status if hasattr(p, "status") else p.get("status", "")) == "active"
                ),
                "risk": sum(
                    1 for p in projects if (p.status if hasattr(p, "status") else p.get("status", "")) == "risk"
                ),
            },
        }
    ]


def _finance_cards(msg: str) -> list[dict]:
    from src.stores.finance_store import list_budgets, list_expenses, list_invoices

    expenses = list_expenses()
    budgets = list_budgets()
    invoices = list_invoices()

    return [
        {
            "type": "data",
            "title": "财务概况",
            "data": {
                "报销单": f"{len(expenses)} 笔",
                "预算项": f"{len(budgets)} 项",
                "发票": f"{len(invoices)} 张",
                "待审批": f"{sum(1 for e in expenses if (e.status if hasattr(e, 'status') else e.get('status', '')) in ('submitted',))} 笔",
            },
        }
    ]


def _hr_cards(msg: str) -> list[dict]:
    from src.stores.hr_store import list_employees

    employees = list_employees()
    return [
        {
            "type": "data",
            "title": "人事概况",
            "data": {
                "总人数": len(employees),
                "在职": sum(
                    1 for e in employees if (e.status if hasattr(e, "status") else e.get("status", "")) == "active"
                ),
            },
        }
    ]


def _bidding_cards(msg: str) -> list[dict]:
    from src.stores.bidding_store import list_opportunities

    opps = list_opportunities()
    return [
        {
            "type": "table",
            "title": f"投标机会 ({len(opps)} 个)",
            "data": {
                "headers": ["标题", "区域", "预算", "截止", "匹配度"],
                "rows": [
                    [
                        o.title if hasattr(o, "title") else o.get("title", ""),
                        o.region if hasattr(o, "region") else o.get("region", ""),
                        str(o.budget_amount if hasattr(o, "budget_amount") else o.get("budget_amount", "")),
                        str(o.deadline if hasattr(o, "deadline") else o.get("deadline", "")),
                        f"{float(o.match_score if hasattr(o, 'match_score') else o.get('match_score', 0)):.0f}%",
                    ]
                    for o in opps[:8]
                ],
            },
        }
    ]


def _legal_cards(msg: str) -> list[dict]:
    from src.stores.legal_store import list_contracts

    contracts = list_contracts()
    return [
        {
            "type": "data",
            "title": "合同概况",
            "data": {
                "合同总数": len(contracts),
                "执行中": sum(
                    1 for c in contracts if (c.status if hasattr(c, "status") else c.get("status", "")) == "active"
                ),
            },
        }
    ]


def _document_cards(msg: str) -> list[dict]:
    from src.stores.document_store import list_documents

    docs = list_documents()
    return [
        {
            "type": "data",
            "title": "知识库文档",
            "data": {
                "文档总数": f"{len(docs)} 份",
                "定稿": f"{sum(1 for d in docs if (d.status if hasattr(d, 'status') else d.get('status', '')) == 'final')} 份",
            },
        }
    ]


def _overview_cards(msg: str) -> list[dict]:
    """General overview cards for dispatch-level queries."""
    from src.stores.project_store import list_projects

    projects = list_projects()
    return [
        {
            "type": "data",
            "title": "平台概况",
            "data": {
                "项目": f"{len(projects)} 个",
                "活跃": f"{sum(1 for p in projects if (p.status if hasattr(p, 'status') else p.get('status', '')) == 'active')} 个",
            },
            "status": "info",
        }
    ]
