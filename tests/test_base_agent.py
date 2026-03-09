"""Tests for BaseAgent LLM integration helpers."""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from src.agents.base import BaseAgent
from src.core.models import (
    AgentRequest,
    AgentResponse,
    AgentType,
    Message,
    MessageRole,
)
from src.llm.client import LLMClient


class ConcreteAgent(BaseAgent):
    """Minimal concrete agent for testing base class methods."""

    agent_type = AgentType.PROJECT
    system_prompt = "You are a test agent."

    async def handle(self, request: AgentRequest) -> AgentResponse:
        return self._base_response(request, "test")


class TestBuildMessages:
    def test_builds_system_plus_user(self):
        client = AsyncMock(spec=LLMClient)
        agent = ConcreteAgent(llm_client=client)
        session_id = uuid4()
        request = AgentRequest(
            session_id=session_id,
            agent_type=AgentType.PROJECT,
            user_message="项目进度如何",
        )
        messages = agent._build_messages(request)
        assert messages[0] == {"role": "system", "content": "You are a test agent."}
        assert messages[-1] == {"role": "user", "content": "项目进度如何"}

    def test_includes_history(self):
        client = AsyncMock(spec=LLMClient)
        agent = ConcreteAgent(llm_client=client)
        session_id = uuid4()
        history = [
            Message(session_id=session_id, role=MessageRole.USER, content="你好"),
            Message(session_id=session_id, role=MessageRole.AGENT, content="你好！"),
        ]
        request = AgentRequest(
            session_id=session_id,
            agent_type=AgentType.PROJECT,
            user_message="项目进度如何",
            context={"history": [m.model_dump(mode="json") for m in history]},
        )
        messages = agent._build_messages(request)
        # system + 2 history + current user = 4
        assert len(messages) == 4
        assert messages[1]["role"] == "user"
        assert messages[2]["role"] == "assistant"


class TestBaseResponse:
    def test_builds_response(self):
        client = AsyncMock(spec=LLMClient)
        agent = ConcreteAgent(llm_client=client)
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROJECT,
            user_message="test",
        )
        resp = agent._base_response(request, "hello")
        assert resp.content == "hello"
        assert resp.agent_type == AgentType.PROJECT
