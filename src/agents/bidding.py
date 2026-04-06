"""投标管理Agent — bidding management with structured card output."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import BIDDING_SYSTEM_PROMPT
from src.stores.bidding_store import list_opportunities


class BiddingAgent(BaseAgent):
    agent_type = AgentType.BIDDING
    system_prompt = BIDDING_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = self._build_bidding_context()
        messages = self._build_messages(request)
        messages.insert(1, {"role": "system", "content": f"以下是当前系统中的投标机会数据：\n\n{context}"})

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

    def _build_bidding_context(self) -> str:
        opportunities = list_opportunities()
        if not opportunities:
            return "当前系统中暂无投标机会。"
        lines = []
        for opp in opportunities:
            lines.append(
                f"- 项目: {opp.title} (ID: {opp.id})\n"
                f"  来源: {opp.source} | 类别: {opp.category}\n"
                f"  预算: {opp.budget_amount or '未公布'} | 截止日期: {opp.deadline}\n"
                f"  状态: {opp.status} | 匹配度: {opp.match_score}%\n"
                f"  地区: {opp.region}"
            )
        return "\n\n".join(lines)
