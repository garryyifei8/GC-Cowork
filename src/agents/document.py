"""文档Agent — document generation, templates, versioning."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import DOCUMENT_SYSTEM_PROMPT


class DocumentAgent(BaseAgent):
    agent_type = AgentType.DOCUMENT
    system_prompt = DOCUMENT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
