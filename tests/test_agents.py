"""Tests for all specialized agents — LLM calls are mocked."""
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.agents.project import ProjectAgent
from src.agents.finance import FinanceAgent
from src.agents.legal import LegalAgent
from src.agents.procurement import ProcurementAgent
from src.agents.hr import HRAgent
from src.agents.bidding import BiddingAgent
from src.agents.document import DocumentAgent
from src.agents.knowledge import KnowledgeAgent
from src.core.models import AgentRequest, AgentType
from src.llm.client import LLMClient


def _make_request(agent_type: AgentType, message: str) -> AgentRequest:
    return AgentRequest(
        session_id=uuid4(),
        agent_type=agent_type,
        user_message=message,
    )


# Plain-text agents (still use client.chat directly)
PLAIN_AGENT_CLASSES = [
    (FinanceAgent, AgentType.FINANCE, "报销发票审核"),
    (LegalAgent, AgentType.LEGAL, "合同条款审查"),
    (ProcurementAgent, AgentType.PROCUREMENT, "供应商询价"),
    (HRAgent, AgentType.HR, "考勤异常处理"),
    (KnowledgeAgent, AgentType.KNOWLEDGE, "查找案例"),
]


@pytest.mark.parametrize("agent_cls,agent_type,message", PLAIN_AGENT_CLASSES)
class TestPlainTextAgents:
    @pytest.mark.asyncio
    async def test_handle_returns_response(self, agent_cls, agent_type, message):
        client = AsyncMock(spec=LLMClient)
        client.chat = AsyncMock(return_value="这是AI的专业回复。")
        agent = agent_cls(llm_client=client)
        assert agent.agent_type == agent_type

        request = _make_request(agent_type, message)
        response = await agent.handle(request)

        assert response.content == "这是AI的专业回复。"
        assert response.agent_type == agent_type
        client.chat.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_passes_system_prompt(self, agent_cls, agent_type, message):
        client = AsyncMock(spec=LLMClient)
        client.chat = AsyncMock(return_value="回复")
        agent = agent_cls(llm_client=client)

        request = _make_request(agent_type, message)
        await agent.handle(request)

        call_args = client.chat.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]
        assert messages[0]["role"] == "system"
        assert len(messages[0]["content"]) > 50


class TestProjectAgentBasic:
    """ProjectAgent uses chat_json; verify it integrates correctly."""

    @pytest.mark.asyncio
    async def test_handle_returns_response_via_chat_json(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "项目进度正常。",
            "cards": [],
        })
        agent = ProjectAgent(llm_client=client)
        assert agent.agent_type == AgentType.PROJECT

        request = _make_request(AgentType.PROJECT, "项目进度如何")
        response = await agent.handle(request)

        assert response.content == "项目进度正常。"
        assert response.agent_type == AgentType.PROJECT
        client.chat_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_passes_system_prompt(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": [],
        })
        agent = ProjectAgent(llm_client=client)

        request = _make_request(AgentType.PROJECT, "项目进度如何")
        await agent.handle(request)

        call_args = client.chat_json.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]
        assert messages[0]["role"] == "system"
        assert len(messages[0]["content"]) > 50


class TestBiddingAgentBasic:
    """BiddingAgent uses chat_json with bidding context; verify it integrates correctly."""

    @pytest.mark.asyncio
    async def test_handle_returns_response_via_chat_json(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "当前有4个投标机会。",
            "cards": [
                {"card_type": "data", "title": "投标机会概览", "data": {"count": 4}, "actions": []}
            ],
        })
        agent = BiddingAgent(llm_client=client)
        assert agent.agent_type == AgentType.BIDDING

        request = _make_request(AgentType.BIDDING, "有哪些投标机会")
        response = await agent.handle(request)

        assert response.content == "当前有4个投标机会。"
        assert response.agent_type == AgentType.BIDDING
        assert len(response.cards) == 1
        assert response.cards[0].title == "投标机会概览"
        client.chat_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_passes_system_prompt(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": [],
        })
        agent = BiddingAgent(llm_client=client)

        request = _make_request(AgentType.BIDDING, "投标书编写")
        await agent.handle(request)

        call_args = client.chat_json.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]
        assert messages[0]["role"] == "system"
        assert len(messages[0]["content"]) > 50

    @pytest.mark.asyncio
    async def test_handle_injects_bidding_context(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": [],
        })
        agent = BiddingAgent(llm_client=client)

        request = _make_request(AgentType.BIDDING, "查看投标机会")
        await agent.handle(request)

        call_args = client.chat_json.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]
        # Second message should be the injected bidding context
        assert messages[1]["role"] == "system"
        assert "投标机会" in messages[1]["content"]

    @pytest.mark.asyncio
    async def test_handle_falls_back_to_chat_on_error(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(side_effect=Exception("LLM error"))
        client.chat = AsyncMock(return_value="降级回复内容。")
        agent = BiddingAgent(llm_client=client)

        request = _make_request(AgentType.BIDDING, "投标机会")
        response = await agent.handle(request)

        assert response.content == "降级回复内容。"
        assert response.cards == []
        client.chat.assert_called_once()

    @pytest.mark.asyncio
    async def test_parse_cards_handles_invalid_data(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": ["not_a_dict", None, 42, {"card_type": "data", "title": "有效卡片"}],
        })
        agent = BiddingAgent(llm_client=client)

        request = _make_request(AgentType.BIDDING, "投标")
        response = await agent.handle(request)

        # Only the valid dict card should be parsed
        assert len(response.cards) == 1
        assert response.cards[0].title == "有效卡片"


class TestDocumentAgentBasic:
    """DocumentAgent uses chat_json with document context; verify it integrates correctly."""

    @pytest.mark.asyncio
    async def test_handle_returns_response_via_chat_json(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "系统中共有5份文档。",
            "cards": [
                {"card_type": "data", "title": "文档列表", "data": {"count": 5}, "actions": []}
            ],
        })
        agent = DocumentAgent(llm_client=client)
        assert agent.agent_type == AgentType.DOCUMENT

        request = _make_request(AgentType.DOCUMENT, "查看文档列表")
        response = await agent.handle(request)

        assert response.content == "系统中共有5份文档。"
        assert response.agent_type == AgentType.DOCUMENT
        assert len(response.cards) == 1
        assert response.cards[0].title == "文档列表"
        client.chat_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_passes_system_prompt(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": [],
        })
        agent = DocumentAgent(llm_client=client)

        request = _make_request(AgentType.DOCUMENT, "生成周报")
        await agent.handle(request)

        call_args = client.chat_json.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]
        assert messages[0]["role"] == "system"
        assert len(messages[0]["content"]) > 50

    @pytest.mark.asyncio
    async def test_handle_injects_document_context(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": [],
        })
        agent = DocumentAgent(llm_client=client)

        request = _make_request(AgentType.DOCUMENT, "查看文档")
        await agent.handle(request)

        call_args = client.chat_json.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]
        # Second message should be the injected document context
        assert messages[1]["role"] == "system"
        assert "文档" in messages[1]["content"]

    @pytest.mark.asyncio
    async def test_handle_falls_back_to_chat_on_error(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(side_effect=Exception("LLM error"))
        client.chat = AsyncMock(return_value="降级回复内容。")
        agent = DocumentAgent(llm_client=client)

        request = _make_request(AgentType.DOCUMENT, "生成文档")
        response = await agent.handle(request)

        assert response.content == "降级回复内容。"
        assert response.cards == []
        client.chat.assert_called_once()

    @pytest.mark.asyncio
    async def test_parse_cards_handles_invalid_data(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(return_value={
            "reply": "回复",
            "cards": ["bad", 123, {"card_type": "action", "title": "生成报告"}],
        })
        agent = DocumentAgent(llm_client=client)

        request = _make_request(AgentType.DOCUMENT, "文档")
        response = await agent.handle(request)

        assert len(response.cards) == 1
        assert response.cards[0].title == "生成报告"
