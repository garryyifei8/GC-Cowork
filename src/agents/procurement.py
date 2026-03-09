"""采购Agent — supplier management, price comparison."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import PROCUREMENT_SYSTEM_PROMPT


class ProcurementAgent(BaseAgent):
    agent_type = AgentType.PROCUREMENT
    system_prompt = PROCUREMENT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
