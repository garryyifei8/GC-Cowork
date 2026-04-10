"""审计Agent — audit report analysis, risk identification, compliance checks."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import AUDIT_SYSTEM_PROMPT
from src.stores.audit_store import list_reports


class AuditAgent(BaseAgent):
    agent_type = AgentType.AUDIT
    system_prompt = AUDIT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = self._build_audit_context()
        messages = self._build_messages(request)
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的审计报告数据：\n\n{context}"})

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
        """Build messages for streaming with audit data context."""
        messages = super().build_stream_messages(request)
        context = self._build_audit_context()
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的审计报告数据：\n\n{context}"})
        return messages

    def _build_audit_context(self) -> str:
        reports = list_reports()
        if not reports:
            return "当前系统中暂无审计报告。"
        lines = []
        for r in reports:
            end_str = str(r.end_date) if r.end_date else "进行中"
            lines.append(
                f"- 报告: {r.title} (ID: {r.id})\n"
                f"  类型: {r.audit_type} | 审计员: {r.auditor}\n"
                f"  时间: {r.start_date} ~ {end_str}\n"
                f"  状态: {r.status} | 风险等级: {r.risk_level}\n"
                f"  发现问题数: {r.findings_count}\n"
                f"  摘要: {r.summary}"
            )
        return "\n\n".join(lines)
