"""Tests for Agent registry."""
from unittest.mock import AsyncMock

import pytest

from src.agents.registry import create_agent_registry, get_agent
from src.core.models import AgentType
from src.llm.client import LLMClient


class TestRegistry:
    def test_registry_has_all_agent_types(self):
        client = AsyncMock(spec=LLMClient)
        registry = create_agent_registry(client)
        for agent_type in AgentType:
            assert agent_type in registry, f"Missing {agent_type} in registry"

    def test_get_agent_returns_correct_type(self):
        client = AsyncMock(spec=LLMClient)
        registry = create_agent_registry(client)
        agent = get_agent(registry, AgentType.FINANCE)
        assert agent.agent_type == AgentType.FINANCE

    def test_get_agent_unknown_raises(self):
        with pytest.raises(KeyError):
            get_agent({}, AgentType.FINANCE)
