"""财务Agent — expense audit, budgeting, fund planning."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import FINANCE_SYSTEM_PROMPT


class FinanceAgent(BaseAgent):
    agent_type = AgentType.FINANCE
    system_prompt = FINANCE_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
