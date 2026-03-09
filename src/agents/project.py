"""项目管理Agent — project lifecycle management."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import PROJECT_SYSTEM_PROMPT


class ProjectAgent(BaseAgent):
    agent_type = AgentType.PROJECT
    system_prompt = PROJECT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
