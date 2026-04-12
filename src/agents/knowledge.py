"""知识Agent — experience retrieval, case recommendations, knowledge base search."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.knowledge.dependencies import get_rag
from src.llm.prompts import KNOWLEDGE_SYSTEM_PROMPT


class KnowledgeAgent(BaseAgent):
    agent_type = AgentType.KNOWLEDGE
    system_prompt = KNOWLEDGE_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = await self._build_knowledge_context(request.user_message)
        messages = self._build_messages(request)
        messages.insert(
            1,
            {"role": "system", "content": f"以下是 RAG 检索到的相关知识：\n\n{context}"},
        )

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
        """Build messages for streaming — sync version (base compat).

        Note: This does NOT include RAG context because RAG requires async.
        For RAG-enhanced streaming, use abuild_stream_messages() instead.
        """
        return super().build_stream_messages(request)

    async def abuild_stream_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Async variant that includes RAG context for streaming."""
        messages = super().build_stream_messages(request)
        context = await self._build_knowledge_context(request.user_message)
        messages.insert(
            1,
            {"role": "system", "content": f"以下是 RAG 检索到的相关知识：\n\n{context}"},
        )
        return messages

    async def _build_knowledge_context(self, query: str) -> str:
        """Use RAG to retrieve top-k relevant chunks for the query."""
        rag = get_rag()
        return await rag.get_context_for_llm(query, top_k=3)
