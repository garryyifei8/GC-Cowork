"""人事Agent — attendance, performance, recruitment."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import HR_SYSTEM_PROMPT


class HRAgent(BaseAgent):
    agent_type = AgentType.HR
    system_prompt = HR_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
