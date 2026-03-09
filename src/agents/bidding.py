"""投标Agent — tender monitoring, proposal generation."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import BIDDING_SYSTEM_PROMPT


class BiddingAgent(BaseAgent):
    agent_type = AgentType.BIDDING
    system_prompt = BIDDING_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
