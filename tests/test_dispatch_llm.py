"""Tests for DispatchAgent LLM-based intent routing."""
import json
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.agents.dispatch import DispatchAgent
from src.core.exceptions import LLMResponseError
from src.core.models import AgentRequest, AgentType
from src.llm.client import LLMClient


def _make_request(message: str) -> AgentRequest:
    return AgentRequest(
        session_id=uuid4(),
        agent_type=AgentType.DISPATCH,
        user_message=message,
    )


def _mock_dispatch_intent(primary: str, reply: str = "正在处理...") -> dict:
    return {
        "primary_agent": primary,
        "secondary_agents": [],
        "complexity": "simple",
        "workflow_pattern": "serial",
        "confidence": 0.9,
        "reply": reply,
    }


class TestDispatchRouting:
    @pytest.mark.asyncio
    async def test_routes_to_finance(self):
        client = AsyncMock(spec=LLMClient)
        # First call: DispatchAgent classifies intent as "finance"
        # Second call: FinanceAgent tries chat_json, which raises → falls back to chat()
        client.chat_json = AsyncMock(
            side_effect=[
                _mock_dispatch_intent("finance"),
                Exception("force fallback to chat"),
            ]
        )
        client.chat = AsyncMock(return_value="已为您审核发票，金额合规。")

        agent = DispatchAgent(llm_client=client)
        request = _make_request("帮我审核这张发票")
        response = await agent.handle(request)

        assert response.content == "已为您审核发票，金额合规。"
        assert response.agent_type == AgentType.FINANCE

    @pytest.mark.asyncio
    async def test_routes_to_project(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(
            return_value=_mock_dispatch_intent("project")
        )
        client.chat = AsyncMock(return_value="项目进度正常。")

        agent = DispatchAgent(llm_client=client)
        request = _make_request("项目进度如何")
        response = await agent.handle(request)

        assert response.agent_type == AgentType.PROJECT

    @pytest.mark.asyncio
    async def test_dispatch_self_handles_chitchat(self):
        client = AsyncMock(spec=LLMClient)
        client.chat_json = AsyncMock(
            return_value=_mock_dispatch_intent("dispatch", reply="你好！有什么可以帮你的？")
        )

        agent = DispatchAgent(llm_client=client)
        request = _make_request("你好")
        response = await agent.handle(request)

        assert response.agent_type == AgentType.DISPATCH
        assert response.content == "你好！有什么可以帮你的？"
        client.chat.assert_not_called()

    @pytest.mark.asyncio
    async def test_intent_metadata_in_response(self):
        client = AsyncMock(spec=LLMClient)
        intent = _mock_dispatch_intent("legal")
        client.chat_json = AsyncMock(return_value=intent)
        client.chat = AsyncMock(return_value="合同审查完成。")

        agent = DispatchAgent(llm_client=client)
        request = _make_request("审查合同条款")
        response = await agent.handle(request)

        assert "intent" in response.metadata

    @pytest.mark.asyncio
    async def test_parallel_workflow(self):
        client = AsyncMock(spec=LLMClient)
        intent = _mock_dispatch_intent("project")
        intent["secondary_agents"] = ["finance", "legal"]
        intent["workflow_pattern"] = "parallel"
        intent["complexity"] = "complex"
        client.chat_json = AsyncMock(return_value=intent)
        client.chat = AsyncMock(return_value="综合评估报告。")

        agent = DispatchAgent(llm_client=client)
        request = _make_request("项目启动综合评估")
        response = await agent.handle(request)

        assert response.agent_type == AgentType.PROJECT
