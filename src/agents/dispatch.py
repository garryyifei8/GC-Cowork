"""
Dispatch Agent (调度Agent) — the universal front-desk agent.

Responsibilities:
- Intent recognition via LLM: understand what the user wants
- Agent routing: route to the appropriate specialized agent
- Multi-agent coordination: orchestrate workflows (P1: parallel execution)
- Session management: maintain conversation context
"""

import logging

from src.agents.base import BaseAgent
from src.core.models import (
    AgentIntent,
    AgentRequest,
    AgentResponse,
    AgentType,
    TaskComplexity,
    WorkflowPattern,
)
from src.llm.prompts import DISPATCH_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class DispatchAgent(BaseAgent):
    """Universal dispatch agent — entry point for all user conversations."""

    agent_type = AgentType.DISPATCH
    system_prompt = DISPATCH_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        # Step 1: LLM intent classification
        messages = self._build_messages(request)
        intent_data = await self.llm_client.chat_json(messages)
        intent = self._parse_intent(intent_data)
        request.intent = intent

        # Step 2: If dispatch handles it (chitchat / unclear), return directly
        if intent.primary_agent == AgentType.DISPATCH:
            reply = intent_data.get("reply", "您好！请问有什么可以帮您？")
            return AgentResponse(
                request_id=request.request_id,
                agent_type=self.agent_type,
                content=reply,
                metadata={"intent": intent.model_dump()},
            )

        # Step 3: Route to primary specialized agent
        from src.agents.registry import create_agent_registry, get_agent

        registry = create_agent_registry(self.llm_client)
        target_agent = get_agent(registry, intent.primary_agent)

        response = await target_agent.handle(request)
        response.metadata["intent"] = intent.model_dump()

        # Step 4: Execute secondary agents and merge their cards
        if intent.secondary_agents:
            for sec_type in intent.secondary_agents:
                if sec_type == intent.primary_agent:
                    continue  # skip duplicate
                try:
                    sec_agent = get_agent(registry, sec_type)
                    sec_response = await sec_agent.handle(request)
                    response.cards.extend(sec_response.cards)
                    logger.info("Secondary agent %s returned %d cards", sec_type.value, len(sec_response.cards))
                except Exception:
                    logger.warning("Secondary agent %s failed", sec_type.value, exc_info=True)

        return response

    @staticmethod
    def _parse_intent(data: dict) -> AgentIntent:
        """Parse LLM JSON output into an AgentIntent model."""
        try:
            primary = AgentType(data.get("primary_agent", "dispatch"))
        except ValueError:
            primary = AgentType.DISPATCH

        secondary = []
        for s in data.get("secondary_agents", []):
            try:
                secondary.append(AgentType(s))
            except ValueError:
                pass

        try:
            complexity = TaskComplexity(data.get("complexity", "simple"))
        except ValueError:
            complexity = TaskComplexity.SIMPLE

        try:
            pattern = WorkflowPattern(data.get("workflow_pattern", "serial"))
        except ValueError:
            pattern = WorkflowPattern.SERIAL

        confidence = data.get("confidence", 0.8)
        confidence = max(0.0, min(1.0, float(confidence)))

        return AgentIntent(
            primary_agent=primary,
            secondary_agents=secondary,
            complexity=complexity,
            workflow_pattern=pattern,
            confidence=confidence,
            extracted_params=data,
        )
