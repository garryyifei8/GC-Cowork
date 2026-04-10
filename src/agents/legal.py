"""法务Agent — contract review, compliance checks, legal risk analysis."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import LEGAL_SYSTEM_PROMPT
from src.stores.legal_store import list_contracts


class LegalAgent(BaseAgent):
    agent_type = AgentType.LEGAL
    system_prompt = LEGAL_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = self._build_legal_context()
        messages = self._build_messages(request)
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的合同数据：\n\n{context}"})

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
        """Build messages for streaming with legal data context."""
        messages = super().build_stream_messages(request)
        context = self._build_legal_context()
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的合同数据：\n\n{context}"})
        return messages

    def _build_legal_context(self) -> str:
        contracts = list_contracts()
        if not contracts:
            return "当前系统中暂无合同数据。"
        lines = []
        for c in contracts:
            if isinstance(c, dict):
                lines.append(
                    f"- 合同: {c.get('title', '')} (ID: {c.get('id', '')})\n"
                    f"  类型: {c.get('contract_type', '')} | 状态: {c.get('status', '')}\n"
                    f"  甲方: {c.get('party_a', '')} | 乙方: {c.get('party_b', '')}\n"
                    f"  金额: {c.get('amount', '未定')} | 签署日期: {c.get('sign_date', '未签署')}"
                )
            else:
                lines.append(
                    f"- 合同: {c.title} (ID: {c.id})\n"
                    f"  类型: {c.contract_type} | 状态: {c.status}\n"
                    f"  甲方: {c.party_a} | 乙方: {c.party_b}\n"
                    f"  金额: {c.amount or '未定'} | 签署日期: {c.sign_date or '未签署'}"
                )
        return "\n\n".join(lines)
