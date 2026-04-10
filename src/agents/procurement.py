"""采购Agent — supplier management, price comparison, procurement tracking."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import PROCUREMENT_SYSTEM_PROMPT
from src.stores.procurement_store import list_by_project
from src.stores.project_store import list_projects


class ProcurementAgent(BaseAgent):
    agent_type = AgentType.PROCUREMENT
    system_prompt = PROCUREMENT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = self._build_procurement_context()
        messages = self._build_messages(request)
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的采购包数据：\n\n{context}"})

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
        """Build messages for streaming with procurement data context."""
        messages = super().build_stream_messages(request)
        context = self._build_procurement_context()
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的采购包数据：\n\n{context}"})
        return messages

    def _build_procurement_context(self) -> str:
        projects = list_projects()
        if not projects:
            return "当前系统中暂无项目和采购包数据。"
        lines = []
        for proj in projects:
            pid = proj.get("id") if isinstance(proj, dict) else proj.id
            pname = proj.get("name") if isinstance(proj, dict) else proj.name
            packages = list_by_project(pid)
            if not packages:
                continue
            lines.append(f"### 项目: {pname} (ID: {pid})")
            for pkg in packages:
                if isinstance(pkg, dict):
                    lines.append(
                        f"- 采购包: {pkg.get('name', '')} (ID: {pkg.get('id', '')})\n"
                        f"  类别: {pkg.get('category', '')} | 供应商: {pkg.get('supplier', '待定')}\n"
                        f"  预算: {pkg.get('budget_amount', '未定')} | 实际: {pkg.get('actual_amount', '未定')}\n"
                        f"  状态: {pkg.get('status', '')} | 负责人: {pkg.get('responsible', '未分配')}"
                    )
                else:
                    lines.append(
                        f"- 采购包: {pkg.name} (ID: {pkg.id})\n"
                        f"  类别: {pkg.category} | 供应商: {pkg.supplier or '待定'}\n"
                        f"  预算: {pkg.budget_amount or '未定'} | 实际: {pkg.actual_amount or '未定'}\n"
                        f"  状态: {pkg.status} | 负责人: {pkg.responsible or '未分配'}"
                    )
        if not lines:
            return "当前系统中暂无采购包数据。"
        return "\n\n".join(lines)
