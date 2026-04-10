"""Rule-based finance insights and summary analytics.

No LLM is involved — all logic is deterministic and based on thresholds
applied to the live in-memory finance data.
"""

from __future__ import annotations

from collections import defaultdict

# ---------------------------------------------------------------------------
# Insight generation
# ---------------------------------------------------------------------------


def generate_finance_insights(
    expenses: list,
    budgets: list,
    invoices: list,
) -> list[dict]:
    """Analyse finance data and return a list of insight dicts.

    Each dict contains:
      - title       (str) — short headline
      - description (str) — human-readable explanation in Chinese
      - severity    (str) — "info" | "warning" | "critical"
      - category    (str) — "budget" | "invoice" | "expense"

    Rules applied (in order):
      1. Budget utilisation > 90 % for any line → warning
      2. Overdue invoices → critical reminder
      3. Single expense > 2× average of the same category → anomaly warning
      4. Pending/submitted expense count > 5 → approval backlog info
    """
    insights: list[dict] = []

    # ------------------------------------------------------------------
    # Rule 1 — budget utilisation > 90 %
    # ------------------------------------------------------------------
    for bgt in budgets:
        if bgt.planned_amount and bgt.planned_amount > 0:
            utilisation = bgt.actual_amount / bgt.planned_amount
            if utilisation > 0.9:
                pct = round(utilisation * 100, 1)
                insights.append(
                    {
                        "title": f"预算超支预警：{bgt.category}",
                        "description": (
                            f"项目 {bgt.project_id or '公司级'} 的【{bgt.category}】预算使用率已达 "
                            f"{pct}%（计划 {bgt.planned_amount} 万元，实际 {bgt.actual_amount} 万元），"
                            f"建议及时评审剩余预算。"
                        ),
                        "severity": "warning",
                        "category": "budget",
                    }
                )

    # ------------------------------------------------------------------
    # Rule 2 — overdue invoices
    # ------------------------------------------------------------------
    overdue_invoices = [i for i in invoices if i.status.value == "overdue"]
    if overdue_invoices:
        total_overdue_amount = sum(i.amount for i in overdue_invoices)
        vendors = "、".join(i.vendor for i in overdue_invoices)
        insights.append(
            {
                "title": f"逾期发票催款提醒（共 {len(overdue_invoices)} 张）",
                "description": (
                    f"以下供应商发票已逾期未付，合计金额 {total_overdue_amount:,.0f} 元，请尽快处理：{vendors}。"
                ),
                "severity": "critical",
                "category": "invoice",
            }
        )

    # ------------------------------------------------------------------
    # Rule 3 — single expense > 2× category average
    # ------------------------------------------------------------------
    category_amounts: dict[str, list[float]] = defaultdict(list)
    for exp in expenses:
        category_amounts[exp.category.value].append(exp.amount)

    for exp in expenses:
        cat = exp.category.value
        amounts = category_amounts[cat]
        if len(amounts) < 2:
            # Need at least two data points to compute a meaningful average
            continue
        avg = sum(amounts) / len(amounts)
        if avg > 0 and exp.amount > 2 * avg:
            insights.append(
                {
                    "title": f"费用异常：{exp.submitter} 的{exp.category.value}类报销",
                    "description": (
                        f"报销单 {exp.id}（提交人：{exp.submitter}）金额 {exp.amount:,.0f} 元，"
                        f"超过同类别平均值 {avg:,.0f} 元的 2 倍，请核实是否存在异常。"
                    ),
                    "severity": "warning",
                    "category": "expense",
                }
            )

    # ------------------------------------------------------------------
    # Rule 4 — pending/submitted count > 5 → approval backlog
    # ------------------------------------------------------------------
    pending_count = sum(1 for e in expenses if e.status.value in ("submitted", "pending"))
    if pending_count > 5:
        insights.append(
            {
                "title": f"审批积压提醒：{pending_count} 笔报销待处理",
                "description": (
                    f"当前共有 {pending_count} 笔报销单处于待审批状态，"
                    f"建议财务负责人优先安排审核，避免影响员工报销周期。"
                ),
                "severity": "info",
                "category": "expense",
            }
        )

    return insights


# ---------------------------------------------------------------------------
# Summary metrics
# ---------------------------------------------------------------------------


def get_finance_summary(
    expenses: list,
    budgets: list,
    invoices: list,
) -> dict:
    """Compute high-level finance KPIs for the dashboard summary card.

    Returns a dict with:
      - total_expenses           (float) — sum of all expense amounts
      - pending_approvals        (int)   — count of submitted expense reports
      - budget_utilization_rate  (float) — average actual/planned across all budget lines (0–1)
      - overdue_invoices         (int)   — count of invoices with status=overdue
      - monthly_expense_trend    (list)  — [{month: str, amount: float}] sorted ascending
    """
    # Total expenses
    total_expenses = sum(e.amount for e in expenses)

    # Pending approvals (status == submitted)
    pending_approvals = sum(1 for e in expenses if e.status.value == "submitted")

    # Average budget utilisation rate
    utilisation_rates: list[float] = []
    for bgt in budgets:
        if bgt.planned_amount and bgt.planned_amount > 0:
            utilisation_rates.append(bgt.actual_amount / bgt.planned_amount)
    budget_utilization_rate = sum(utilisation_rates) / len(utilisation_rates) if utilisation_rates else 0.0

    # Overdue invoices count
    overdue_invoices = sum(1 for i in invoices if i.status.value == "overdue")

    # Monthly expense trend — aggregate submitted/approved/paid expenses by month
    monthly_totals: dict[str, float] = defaultdict(float)
    for exp in expenses:
        if exp.submit_date:
            # submit_date is "YYYY-MM-DD"; extract "YYYY-MM" as the month key
            month = exp.submit_date[:7]
            monthly_totals[month] += exp.amount

    monthly_expense_trend = [{"month": month, "amount": amount} for month, amount in sorted(monthly_totals.items())]

    return {
        "total_expenses": total_expenses,
        "pending_approvals": pending_approvals,
        "budget_utilization_rate": round(budget_utilization_rate, 4),
        "overdue_invoices": overdue_invoices,
        "monthly_expense_trend": monthly_expense_trend,
    }
