"""文档处理Agent — document management with structured card output."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import DOCUMENT_SYSTEM_PROMPT
from src.stores.document_store import list_documents


class DocumentAgent(BaseAgent):
    agent_type = AgentType.DOCUMENT
    system_prompt = DOCUMENT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        context = self._build_document_context()
        messages = self._build_messages(request)
        messages.insert(1, {
            "role": "system",
            "content": f"以下是当前系统中的文档数据：\n\n{context}"
        })

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

    def _build_document_context(self) -> str:
        docs = list_documents()
        if not docs:
            return "当前系统中暂无文档。"
        lines = []
        for doc in docs:
            lines.append(
                f"- 文档: {doc.title} (ID: {doc.id})\n"
                f"  类型: {doc.doc_type} | 版本: {doc.version} | 状态: {doc.status}\n"
                f"  作者: {doc.author} | 项目: {doc.project_id or '通用'}"
            )
        return "\n\n".join(lines)

