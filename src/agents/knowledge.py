"""知识Agent — experience retrieval, case recommendations."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import KNOWLEDGE_SYSTEM_PROMPT


class KnowledgeAgent(BaseAgent):
    agent_type = AgentType.KNOWLEDGE
    system_prompt = KNOWLEDGE_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        messages = self._build_messages(request)
        content = await self.llm_client.chat(messages)
        return self._base_response(request, content)
