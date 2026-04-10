"""财务Agent — expense audit, budgeting, fund planning."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import FINANCE_SYSTEM_PROMPT
from src.stores.finance_store import list_budgets, list_expenses, list_invoices


class FinanceAgent(BaseAgent):
    agent_type = AgentType.FINANCE
    system_prompt = FINANCE_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        # 1. Gather finance context from stores
        context_data = self._build_finance_context()

        # 2. Build messages with finance data injected after the system prompt
        messages = self._build_messages(request)
        messages.insert(
            1,
            {
                "role": "system",
                "content": f"以下是当前系统中的财务数据：\n\n{context_data}",
            },
        )

        # 3. Call LLM for structured JSON output, fall back to plain text on error
        try:
            result = await self.llm_client.chat_json(messages, max_tokens=2048)
            content = result.get("reply", "")
            cards = self._parse_cards(result.get("cards", []))
        except Exception:
            content = await self.llm_client.chat(messages)
            cards = []

        response = self._base_response(request, content)
        response.cards = cards
        return response

    def build_stream_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Build messages for streaming with finance data injected."""
        messages = self._build_messages(request)
        messages.insert(
            1,
            {
                "role": "system",
                "content": f"以下是当前系统中的财务数据：\n\n{self._build_finance_context()}",
            },
        )
        messages.append(
            {
                "role": "system",
                "content": "重要：本次请直接用自然语言回复用户。不要使用JSON格式，不要输出代码块。请使用清晰的中文段落和列表来组织回答。",
            }
        )
        return messages

    def _build_finance_context(self) -> str:
        """Serialize current finance data for LLM context."""
        sections: list[str] = []

        # Expenses
        expenses = list_expenses()
        if expenses:
            exp_lines = ["【报销单】"]
            for e in expenses:
                exp_lines.append(
                    f"- {e.id}: 提交人={e.submitter} | 类别={e.category.value}"
                    f" | 金额={e.amount}元 | 状态={e.status.value}"
                    f" | 项目={e.project_id or '通用'} | 日期={e.submit_date or '草稿'}"
                )
            sections.append("\n".join(exp_lines))
        else:
            sections.append("【报销单】暂无数据。")

        # Budgets
        budgets = list_budgets()
        if budgets:
            bgt_lines = ["【预算行】"]
            for b in budgets:
                utilization = round(b.actual_amount / b.planned_amount * 100, 1) if b.planned_amount else 0
                bgt_lines.append(
                    f"- {b.id}: 项目={b.project_id} | 类别={b.category}"
                    f" | 计划={b.planned_amount}万元 | 实际={b.actual_amount}万元"
                    f" | 执行率={utilization}% | {b.fiscal_year}年Q{b.quarter}"
                )
            sections.append("\n".join(bgt_lines))
        else:
            sections.append("【预算行】暂无数据。")

        # Invoices
        invoices = list_invoices()
        if invoices:
            inv_lines = ["【发票】"]
            for i in invoices:
                inv_lines.append(
                    f"- {i.id}: 供应商={i.vendor} | 项目={i.project_id or '通用'}"
                    f" | 金额={i.amount}元 | 状态={i.status.value}"
                    f" | 类别={i.category} | 到期={i.due_date}"
                )
            sections.append("\n".join(inv_lines))
        else:
            sections.append("【发票】暂无数据。")

        return "\n\n".join(sections)
