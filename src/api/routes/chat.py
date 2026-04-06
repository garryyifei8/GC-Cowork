"""
Conversational chat API — the primary user-facing endpoint.

POST /api/chat           — simple chat (frontend-compatible)
POST /api/chat/stream    — SSE streaming chat
POST /api/chat/message   — send a message, get an agent response
GET  /api/chat/sessions  — list sessions (stub)
POST /api/chat/sessions  — create a new session
"""

import json
import logging
from collections.abc import AsyncIterator
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from starlette.responses import StreamingResponse

from src.agents.dispatch import DispatchAgent
from src.core.config import settings
from src.core.exceptions import SessionNotFoundError
from src.core.models import AgentRequest, AgentType, Message, MessageRole, Session
from src.llm.client import LLMClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory session store (will be replaced by DB in P1)
_sessions: dict[UUID, Session] = {}

# Sentinel values that indicate the API key has not been configured
_PLACEHOLDER_KEYS = {"", "sk-YOUR_DEEPSEEK_API_KEY_HERE"}


def _check_api_key() -> None:
    """Raise 503 if the LLM API key is not configured."""
    if settings.llm_api_key in _PLACEHOLDER_KEYS:
        raise HTTPException(
            status_code=503,
            detail=("LLM API key is not configured. Set the LLM_API_KEY environment variable or add it to .env."),
        )


# Cache dict so settings.py can clear it on provider switch
_llm_client_cache: dict = {}


def _get_llm_client() -> LLMClient:
    """Return a configured LLMClient. Reads active provider from settings API."""
    # Get current provider config directly from the settings registry
    try:
        from src.api.routes.settings import get_active_provider_config

        provider = get_active_provider_config()
        if provider:
            api_key = provider["api_key"]
            api_base = provider["api_base"]
            model = provider["model"]
        else:
            api_key = settings.llm_api_key
            api_base = settings.llm_api_base
            model = settings.llm_model
    except ImportError:
        api_key = settings.llm_api_key
        api_base = settings.llm_api_base
        model = settings.llm_model

    cache_key = f"{api_base}:{model}:{api_key[:8]}"
    if cache_key not in _llm_client_cache:
        _llm_client_cache.clear()
        if api_key in _PLACEHOLDER_KEYS:
            raise HTTPException(status_code=503, detail="LLM API key is not configured.")
        _llm_client_cache[cache_key] = LLMClient(
            api_key=api_key,
            api_base=api_base,
            model=model,
        )
    return _llm_client_cache[cache_key]


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class SimpleChatRequest(BaseModel):
    """Frontend-compatible chat request (POST /api/chat)."""

    message: str = Field(min_length=1, max_length=4096)
    context: list[dict] | None = None

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message must not be blank")
        return v


class SimpleChatResponse(BaseModel):
    reply: str
    agent_type: str
    cards: list[dict] = []


class ChatMessageRequest(BaseModel):
    session_id: UUID | None = None
    user_id: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=4096)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message must not be blank")
        return v


class ChatMessageResponse(BaseModel):
    session_id: UUID
    message_id: UUID
    content: str
    agent_type: str
    cards: list[dict] = []
    requires_human_confirmation: bool = False


class CreateSessionRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    title: str = Field(default="", max_length=256)


class SessionSummary(BaseModel):
    session_id: UUID
    user_id: str
    title: str
    message_count: int


# ---------------------------------------------------------------------------
# POST /api/chat — simple chat (frontend-compatible, no session required)
# ---------------------------------------------------------------------------


@router.post("", response_model=SimpleChatResponse)
async def simple_chat(req: SimpleChatRequest) -> SimpleChatResponse:
    """Simple chat endpoint matching frontend expectations.

    Accepts ``{message, context?}`` and returns ``{reply, agent_type, cards}``.
    Internally creates a transient session with a default user.
    """
    llm_client = _get_llm_client()
    dispatch = DispatchAgent(llm_client=llm_client)

    # Build history from optional context list
    history: list[dict] = []
    if req.context:
        for msg in req.context:
            role = msg.get("role", "user")
            content = msg.get("content", msg.get("message", ""))
            history.append({"role": role, "content": content})

    session_id = uuid4()
    agent_request = AgentRequest(
        session_id=session_id,
        agent_type=dispatch.agent_type,
        user_message=req.message,
        context={"history": history},
    )

    try:
        agent_response = await dispatch.handle(agent_request)
    except Exception:
        logger.exception("Agent dispatch failed for simple chat")
        raise

    # Build cards from real data (fast, no extra LLM call)
    from src.services.card_builder import build_cards_for_intent

    data_cards = build_cards_for_intent(agent_response.agent_type, req.message)
    # Use data cards; only add LLM cards if data cards are empty
    all_cards = data_cards if data_cards else [c.model_dump() for c in agent_response.cards]

    return SimpleChatResponse(
        reply=agent_response.content,
        agent_type=agent_response.agent_type.value,
        cards=all_cards,
    )


# ---------------------------------------------------------------------------
# POST /api/chat/stream — SSE streaming chat
# ---------------------------------------------------------------------------


async def _generate_cards_async(agent, request: AgentRequest) -> list[dict]:
    """Run the agent's normal handle() to get structured cards (JSON mode).

    This runs concurrently with the streaming text response so that
    cards are ready by the time streaming finishes.
    """
    try:
        response = await agent.handle(request)
        return [c.model_dump() for c in response.cards]
    except Exception:
        logger.warning("Card generation failed for agent %s", agent.agent_type, exc_info=True)
        return []


async def _stream_chat_response(
    message: str,
    context: list[dict] | None,
) -> AsyncIterator[str]:
    """Generator that yields SSE events for a streaming chat response.

    Flow:
    1. Dispatch agent classifies intent (non-streaming).
    2. Specialized agent streams its response token-by-token.
    3. Final ``done`` event includes agent_type and cards.
    """
    llm_client = _get_llm_client()
    dispatch = DispatchAgent(llm_client=llm_client)

    # Build history
    history: list[dict] = []
    if context:
        for msg in context:
            role = msg.get("role", "user")
            content = msg.get("content", msg.get("message", ""))
            history.append({"role": role, "content": content})

    session_id = uuid4()
    agent_request = AgentRequest(
        session_id=session_id,
        agent_type=dispatch.agent_type,
        user_message=message,
        context={"history": history},
    )

    # Step 1: Classify intent (non-streaming, fast)
    try:
        messages_for_intent = dispatch._build_messages(agent_request)
        intent_data = await llm_client.chat_json(messages_for_intent)
        intent = dispatch._parse_intent(intent_data)
        agent_request.intent = intent
    except Exception as exc:
        error_payload = json.dumps({"error": str(exc)})
        yield f"event: error\ndata: {error_payload}\n\n"
        return

    # Step 2: Determine which agent answers and build its messages
    agent_type = intent.primary_agent
    if agent_type == AgentType.DISPATCH:
        # Dispatch handles it directly (chitchat) — no streaming needed
        reply = intent_data.get("reply", "您好！请问有什么可以帮您？")
        token_payload = json.dumps({"content": reply})
        yield f"event: token\ndata: {token_payload}\n\n"
        done_payload = json.dumps({"agent_type": agent_type.value, "cards": []})
        yield f"event: done\ndata: {done_payload}\n\n"
        return

    # Route to specialized agent for streaming + card generation
    from src.agents.registry import create_agent_registry, get_agent

    registry = create_agent_registry(llm_client)
    target_agent = get_agent(registry, agent_type)

    # Build the LLM messages with data context and plain-text override
    stream_messages = target_agent.build_stream_messages(agent_request)

    # Build cards from real data (instant, no LLM needed)
    from src.services.card_builder import build_cards_for_intent

    cards_data = build_cards_for_intent(agent_type, message)

    # Step 3: Stream response tokens
    full_content = ""
    try:
        async for token in llm_client.chat_stream(stream_messages):
            full_content += token
            token_payload = json.dumps({"content": token})
            yield f"event: token\ndata: {token_payload}\n\n"
    except Exception as exc:
        logger.exception("Streaming failed")
        error_payload = json.dumps({"error": str(exc)})
        yield f"event: error\ndata: {error_payload}\n\n"
        return

    done_payload = json.dumps(
        {
            "agent_type": agent_type.value,
            "cards": cards_data,
            "full_content": full_content,
        }
    )
    yield f"event: done\ndata: {done_payload}\n\n"


@router.post("/stream")
async def stream_chat(req: SimpleChatRequest):
    """SSE streaming chat endpoint.

    Returns ``text/event-stream`` with events:
    - ``event: token`` — ``{"content": "..."}`` for each token
    - ``event: done``  — ``{"agent_type": "...", "cards": [...]}``
    - ``event: error`` — ``{"error": "..."}`` on failure
    """
    return StreamingResponse(
        _stream_chat_response(req.message, req.context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )


# ---------------------------------------------------------------------------
# Health check endpoint
# ---------------------------------------------------------------------------


@router.get("/health")
async def chat_health():
    """Quick check — can we build an LLM client at all?"""
    try:
        from src.api.routes.settings import get_active_provider_config

        provider = get_active_provider_config()
        provider_id = provider["id"] if provider else "unknown"
    except Exception:
        provider_id = "unknown"
    try:
        _get_llm_client()
        return {"status": "ok", "provider": provider_id}
    except Exception as e:
        return {"status": "error", "message": str(e), "provider": provider_id}


# ---------------------------------------------------------------------------
# Session management endpoints
# ---------------------------------------------------------------------------


@router.post("/sessions", response_model=SessionSummary)
async def create_session(req: CreateSessionRequest) -> SessionSummary:
    session = Session(id=uuid4(), user_id=req.user_id, title=req.title)
    _sessions[session.id] = session
    return SessionSummary(
        session_id=session.id,
        user_id=session.user_id,
        title=session.title,
        message_count=0,
    )


@router.get("/sessions", response_model=list[SessionSummary])
async def list_sessions(user_id: str) -> list[SessionSummary]:
    return [
        SessionSummary(
            session_id=s.id,
            user_id=s.user_id,
            title=s.title,
            message_count=len(s.messages),
        )
        for s in _sessions.values()
        if s.user_id == user_id
    ]


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(req: ChatMessageRequest) -> ChatMessageResponse:
    # Resolve or create session
    if req.session_id is not None:
        session = _sessions.get(req.session_id)
        if session is None:
            raise SessionNotFoundError(
                f"Session {req.session_id} not found",
                detail={"session_id": str(req.session_id)},
            )
    else:
        session = Session(id=uuid4(), user_id=req.user_id)
        _sessions[session.id] = session

    # Persist user message
    user_msg = Message(
        session_id=session.id,
        role=MessageRole.USER,
        content=req.message,
    )
    session.messages.append(user_msg)

    # Build context with conversation history
    history = [
        {"role": m.role.value, "content": m.content}
        for m in session.messages[:-1]  # exclude current message
    ]

    # Route through dispatch agent
    llm_client = _get_llm_client()
    dispatch = DispatchAgent(llm_client=llm_client)

    agent_request = AgentRequest(
        session_id=session.id,
        agent_type=dispatch.agent_type,
        user_message=req.message,
        context={"history": history},
    )
    agent_response = await dispatch.handle(agent_request)

    # Persist agent reply
    agent_msg = Message(
        session_id=session.id,
        role=MessageRole.AGENT,
        content=agent_response.content,
        agent_type=agent_response.agent_type,
        cards=agent_response.cards,
    )
    session.messages.append(agent_msg)

    return ChatMessageResponse(
        session_id=session.id,
        message_id=agent_msg.id,
        content=agent_response.content,
        agent_type=agent_response.agent_type.value,
        cards=[c.model_dump() for c in agent_response.cards],
        requires_human_confirmation=agent_response.requires_human_confirmation,
    )
