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


AGENT_CLASSES = [
    (ProjectAgent, AgentType.PROJECT, "项目进度如何"),
    (FinanceAgent, AgentType.FINANCE, "报销发票审核"),
    (LegalAgent, AgentType.LEGAL, "合同条款审查"),
    (ProcurementAgent, AgentType.PROCUREMENT, "供应商询价"),
    (HRAgent, AgentType.HR, "考勤异常处理"),
    (BiddingAgent, AgentType.BIDDING, "投标书编写"),
    (DocumentAgent, AgentType.DOCUMENT, "生成周报"),
    (KnowledgeAgent, AgentType.KNOWLEDGE, "查找案例"),
]


@pytest.mark.parametrize("agent_cls,agent_type,message", AGENT_CLASSES)
class TestSpecializedAgents:
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
