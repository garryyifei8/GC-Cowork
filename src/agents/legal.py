"""法务Agent — contract review, compliance checks."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import LEGAL_SYSTEM_PROMPT


class LegalAgent(BaseAgent):
    agent_type = AgentType.LEGAL
    system_prompt = LEGAL_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)

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
