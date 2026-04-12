"""Test KnowledgeAgent uses RAG to build context."""
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.agents.knowledge import KnowledgeAgent
from src.core.models import AgentRequest, AgentType
from src.knowledge import dependencies
from src.knowledge.rag import KnowledgeItem, SearchResult


class FakeRag:
    def __init__(self, results):
        self._results = results

    async def search(self, query, top_k=5, category=None, project_id=None):
        return self._results

    async def get_context_for_llm(self, query, top_k=3):
        if not self._results:
            return "未找到相关知识。"
        lines = [f"【{r.item.title}】{r.item.content[:100]}" for r in self._results]
        return "\n".join(lines)


async def test_knowledge_agent_injects_rag_context(monkeypatch):
    results = [
        SearchResult(
            item=KnowledgeItem(
                id="k-1",
                title="项目管理规范",
                content="本规范定义了立项流程。",
                category="process",
            ),
            score=0.9,
        )
    ]
    monkeypatch.setattr(dependencies, "_rag_instance", FakeRag(results))

    mock_llm = AsyncMock()
    mock_llm.chat_json = AsyncMock(return_value={"reply": "已查到", "cards": []})
    mock_llm.chat = AsyncMock(return_value="已查到")
    agent = KnowledgeAgent(llm_client=mock_llm)

    req = AgentRequest(
        session_id=uuid4(),
        agent_type=AgentType.KNOWLEDGE,
        user_message="立项流程是什么？",
    )
    resp = await agent.handle(req)

    # Verify the LLM was called with a message containing RAG context
    called_messages = mock_llm.chat_json.call_args[0][0]
    combined = "\n".join(m.get("content", "") for m in called_messages)
    assert "项目管理规范" in combined
    assert "立项流程" in combined
    assert resp.content == "已查到"
