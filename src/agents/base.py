"""
Base Agent class — all specialized agents inherit from this.
Provides common interface for intent handling, LLM message building, and response generation.
"""
from abc import ABC, abstractmethod

from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.client import LLMClient


class BaseAgent(ABC):
    """Abstract base class for all domain-specific agents."""

    agent_type: AgentType
    system_prompt: str = ""

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    @abstractmethod
    async def handle(self, request: AgentRequest) -> AgentResponse:
        """Process a request and return a structured response."""
        ...

    def _build_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Assemble [system, ...history, user] messages for an LLM call."""
        messages: list[dict[str, str]] = [
            {"role": "system", "content": self.system_prompt},
        ]

        # Inject conversation history from request context if available
        history = request.context.get("history", [])
        for msg in history:
            role = msg.get("role", "user")
            # Map agent role to assistant for LLM
            if role == "agent":
                role = "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": request.user_message})
        return messages

    def _base_response(self, request: AgentRequest, content: str) -> AgentResponse:
        """Helper to build a minimal response."""
        return AgentResponse(
            request_id=request.request_id,
            agent_type=self.agent_type,
            content=content,
        )
