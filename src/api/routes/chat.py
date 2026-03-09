"""
Conversational chat API — the primary user-facing endpoint.

POST /api/chat/message   — send a message, get an agent response
GET  /api/chat/sessions  — list sessions (stub)
POST /api/chat/sessions  — create a new session
"""
from uuid import UUID, uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

from src.agents.dispatch import DispatchAgent
from src.core.config import settings
from src.core.exceptions import SessionNotFoundError
from src.core.models import AgentRequest, Message, MessageRole, Session
from src.llm.client import LLMClient

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory session store (will be replaced by DB in P1)
_sessions: dict[UUID, Session] = {}


def _get_llm_client() -> LLMClient:
    """Return a configured LLMClient. Extracted for easy mocking in tests."""
    return LLMClient(
        api_key=settings.llm_api_key,
        api_base=settings.llm_api_base,
        model=settings.llm_model,
    )


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
