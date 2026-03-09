"""Tests for prompt template definitions."""
from src.core.models import AgentType
from src.llm.prompts import AGENT_PROMPTS, DISPATCH_SYSTEM_PROMPT


class TestPrompts:
    def test_dispatch_prompt_exists(self):
        assert len(DISPATCH_SYSTEM_PROMPT) > 100
        assert "primary_agent" in DISPATCH_SYSTEM_PROMPT
        assert "JSON" in DISPATCH_SYSTEM_PROMPT

    def test_all_agent_types_have_prompts(self):
        """Every non-DISPATCH AgentType must have a system prompt."""
        for agent_type in AgentType:
            if agent_type == AgentType.DISPATCH:
                continue
            assert agent_type in AGENT_PROMPTS, f"Missing prompt for {agent_type}"
            assert len(AGENT_PROMPTS[agent_type]) > 50

    def test_prompts_mention_domain(self):
        """Each prompt should reference its domain context."""
        expected_keywords = {
            AgentType.PROJECT: "项目",
            AgentType.FINANCE: "财务",
            AgentType.LEGAL: "法务",
            AgentType.PROCUREMENT: "采购",
            AgentType.HR: "人事",
            AgentType.BIDDING: "投标",
            AgentType.DOCUMENT: "文档",
            AgentType.KNOWLEDGE: "知识",
        }
        for agent_type, keyword in expected_keywords.items():
            assert keyword in AGENT_PROMPTS[agent_type], (
                f"Prompt for {agent_type} missing keyword '{keyword}'"
            )
