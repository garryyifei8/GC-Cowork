"""知识Agent — experience retrieval, case recommendations, knowledge base search."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import KNOWLEDGE_SYSTEM_PROMPT
from src.stores.document_store import list_documents


class KnowledgeAgent(BaseAgent):
    agent_type = AgentType.KNOWLEDGE
    system_prompt = KNOWLEDGE_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = self._build_knowledge_context()
        messages = self._build_messages(request)
        messages.insert(1, {"role": "system", "content": f"以下是当前知识库中的文档数据：\n\n{context}"})

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
        """Build messages for streaming with knowledge data context."""
        messages = super().build_stream_messages(request)
        context = self._build_knowledge_context()
        messages.insert(1, {"role": "system", "content": f"以下是当前知识库中的文档数据：\n\n{context}"})
        return messages

    def _build_knowledge_context(self) -> str:
        docs = list_documents()
        if not docs:
            return "当前知识库中暂无文档。"
        lines = []
        for doc in docs:
            if isinstance(doc, dict):
                lines.append(
                    f"- 文档: {doc.get('title', '')} (ID: {doc.get('id', '')})\n"
                    f"  类型: {doc.get('doc_type', '')} | 分类: {doc.get('category', '')}\n"
                    f"  作者: {doc.get('author', '')} | 版本: {doc.get('version', '')}\n"
                    f"  状态: {doc.get('status', '')} | 摘要: {doc.get('content_summary', '')[:80]}"
                )
            else:
                lines.append(
                    f"- 文档: {doc.title} (ID: {doc.id})\n"
                    f"  类型: {doc.doc_type} | 分类: {doc.category}\n"
                    f"  作者: {doc.author} | 版本: {doc.version}\n"
                    f"  状态: {doc.status} | 摘要: {doc.content_summary[:80]}"
                )
        return "\n\n".join(lines)
