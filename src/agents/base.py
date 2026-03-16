"""
Base Agent class — all specialized agents inherit from this.
Provides common interface for intent handling, LLM message building, and response generation.
"""
from abc import ABC, abstractmethod

from src.core.models import AgentRequest, AgentResponse, AgentType, CardType, InteractiveCard
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

    def build_stream_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Build messages for streaming mode (plain text, no JSON).

        Subclasses that inject data context should override this to include
        their domain data, then call super or append the override instruction.
        """
        messages = self._build_messages(request)
        # Override the JSON requirement — tell LLM to respond in natural language
        messages.append({
            "role": "system",
            "content": (
                "重要：本次请直接用自然语言回复用户。"
                "不要使用JSON格式，不要输出代码块。"
                "请使用清晰的中文段落和列表来组织回答。"
            ),
        })
        return messages

    def _base_response(self, request: AgentRequest, content: str) -> AgentResponse:
        """Helper to build a minimal response."""
        return AgentResponse(
            request_id=request.request_id,
            agent_type=self.agent_type,
            content=content,
        )

    def _parse_cards(self, raw_cards: list) -> list[InteractiveCard]:
        """Convert LLM JSON card output to InteractiveCard models.

        Preserves the original card_type from the LLM (task_list, kanban,
        progress, table, chart, etc.) so the frontend can render interactive
        widgets. Falls back to DATA for unrecognized types.
        """
        cards: list[InteractiveCard] = []
        for raw in raw_cards:
            if not isinstance(raw, dict):
                continue
            try:
                card_type_str = raw.get("card_type", "data")
                # Try to match the enum directly
                try:
                    card_type = CardType(card_type_str)
                except ValueError:
                    card_type = CardType.DATA
                data = raw.get("data", {})
                # Inject severity for alert cards
                if card_type == CardType.ALERT and "severity" not in data:
                    data["severity"] = "warning"
                cards.append(
                    InteractiveCard(
                        card_type=card_type,
                        title=raw.get("title", ""),
                        data=data,
                        actions=raw.get("actions", []),
                    )
                )
            except Exception:
                continue
        return cards
