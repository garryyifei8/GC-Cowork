"""Comprehensive tests for the enhanced ProjectAgent with structured card output."""
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.agents.project import ProjectAgent
from src.core.models import (
    AgentRequest,
    AgentType,
    CardType,
    InteractiveCard,
    ProjectStage,
)
from src.llm.client import LLMClient
from src.stores.project_store import seed_projects, list_projects, _projects
from src.stores.task_store import seed_tasks, _tasks


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _seed_stores():
    """Ensure project and task stores are seeded before each test."""
    # Reset state so seed functions can re-run
    import src.stores.project_store as ps
    import src.stores.task_store as ts
    ps._seeded = False
    ps._projects.clear()
    ts._seeded = False
    ts._tasks.clear()
    seed_projects()
    seed_tasks()
    yield
    # Cleanup
    ps._projects.clear()
    ps._seeded = False
    ts._tasks.clear()
    ts._seeded = False


def _make_request(message: str, context: dict | None = None) -> AgentRequest:
    return AgentRequest(
        session_id=uuid4(),
        agent_type=AgentType.PROJECT,
        user_message=message,
        context=context or {},
    )


def _make_client(**overrides) -> AsyncMock:
    client = AsyncMock(spec=LLMClient)
    client.chat = AsyncMock(return_value=overrides.get("chat_return", "fallback回复"))
    client.chat_json = AsyncMock(
        return_value=overrides.get(
            "chat_json_return",
            {"reply": "项目进度正常。", "cards": []},
        )
    )
    if "chat_json_side_effect" in overrides:
        client.chat_json.side_effect = overrides["chat_json_side_effect"]
    return client


# ---------------------------------------------------------------------------
# ProjectAgent.handle() — happy path
# ---------------------------------------------------------------------------

class TestProjectAgentHandle:
    @pytest.mark.asyncio
    async def test_returns_content_from_chat_json(self):
        client = _make_client(chat_json_return={
            "reply": "省立博物馆项目进度68%。",
            "cards": [],
        })
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("博物馆项目进度如何？"))

        assert response.content == "省立博物馆项目进度68%。"
        assert response.agent_type == AgentType.PROJECT
        assert response.cards == []
        client.chat_json.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_returns_data_cards(self):
        client = _make_client(chat_json_return={
            "reply": "以下是项目概况。",
            "cards": [
                {
                    "card_type": "data",
                    "title": "省立博物馆EPC工程",
                    "data": {"progress": "68%", "budget": "1.2亿"},
                    "actions": [],
                }
            ],
        })
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("查看所有项目"))

        assert len(response.cards) == 1
        card = response.cards[0]
        assert card.card_type == CardType.DATA
        assert card.title == "省立博物馆EPC工程"
        assert card.data["progress"] == "68%"

    @pytest.mark.asyncio
    async def test_returns_action_cards(self):
        client = _make_client(chat_json_return={
            "reply": "可以推进到验收阶段。",
            "cards": [
                {
                    "card_type": "action",
                    "title": "推进项目阶段",
                    "data": {"project_id": "proj-001", "target_stage": "acceptance"},
                    "actions": [{"label": "推进到验收"}],
                }
            ],
        })
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("博物馆项目可以推进吗？"))

        assert len(response.cards) == 1
        card = response.cards[0]
        assert card.card_type == CardType.ACTION
        assert card.actions[0]["label"] == "推进到验收"

    @pytest.mark.asyncio
    async def test_alert_card_maps_to_data_type(self):
        client = _make_client(chat_json_return={
            "reply": "发改委项目进度延误，存在风险。",
            "cards": [
                {
                    "card_type": "alert",
                    "title": "进度延误预警",
                    "data": {"project_id": "proj-002", "delay_days": 30},
                    "actions": [{"label": "查看详情"}],
                }
            ],
        })
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("哪个项目有风险？"))

        assert len(response.cards) == 1
        card = response.cards[0]
        # Alert maps to DATA enum since CardType has no ALERT member
        assert card.card_type == CardType.DATA
        # severity marker is injected for alert cards
        assert card.data.get("severity") == "warning"
        assert card.data["project_id"] == "proj-002"

    @pytest.mark.asyncio
    async def test_alert_card_preserves_existing_severity(self):
        client = _make_client(chat_json_return={
            "reply": "紧急风险。",
            "cards": [
                {
                    "card_type": "alert",
                    "title": "紧急预警",
                    "data": {"severity": "critical"},
                    "actions": [],
                }
            ],
        })
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("有紧急风险吗？"))

        card = response.cards[0]
        # Should NOT overwrite if severity already present
        assert card.data["severity"] == "critical"

    @pytest.mark.asyncio
    async def test_multiple_cards(self):
        client = _make_client(chat_json_return={
            "reply": "三个项目概况如下。",
            "cards": [
                {"card_type": "data", "title": "项目A", "data": {}, "actions": []},
                {"card_type": "data", "title": "项目B", "data": {}, "actions": []},
                {"card_type": "action", "title": "操作", "data": {}, "actions": [{"label": "执行"}]},
            ],
        })
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("所有项目概况"))

        assert len(response.cards) == 3

    @pytest.mark.asyncio
    async def test_empty_reply_key(self):
        """When LLM returns empty reply, content should be empty string."""
        client = _make_client(chat_json_return={"reply": "", "cards": []})
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("test"))
        assert response.content == ""

    @pytest.mark.asyncio
    async def test_missing_reply_key_defaults_empty(self):
        """When LLM JSON has no 'reply' key, content defaults to ''."""
        client = _make_client(chat_json_return={"cards": []})
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("test"))
        assert response.content == ""

    @pytest.mark.asyncio
    async def test_missing_cards_key_defaults_empty(self):
        """When LLM JSON has no 'cards' key, cards defaults to []."""
        client = _make_client(chat_json_return={"reply": "回复"})
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("test"))
        assert response.cards == []


# ---------------------------------------------------------------------------
# ProjectAgent.handle() — fallback path
# ---------------------------------------------------------------------------

class TestProjectAgentFallback:
    @pytest.mark.asyncio
    async def test_fallback_to_plain_chat_on_exception(self):
        """When chat_json raises, agent falls back to chat()."""
        client = _make_client(
            chat_json_side_effect=Exception("JSON parse failed"),
            chat_return="这是纯文本回复。",
        )
        agent = ProjectAgent(llm_client=client)
        response = await agent.handle(_make_request("项目进度如何？"))

        assert response.content == "这是纯文本回复。"
        assert response.cards == []
        client.chat_json.assert_awaited_once()
        client.chat.assert_awaited_once()


# ---------------------------------------------------------------------------
# ProjectAgent._build_project_context()
# ---------------------------------------------------------------------------

class TestBuildProjectContext:
    def test_context_includes_all_projects(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        assert "省立博物馆EPC工程" in context
        assert "发改委平台信息化二期" in context
        assert "智慧园区专项债可研" in context

    def test_context_includes_stage_labels(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        assert "施工/实施" in context  # proj-001 and proj-002
        assert "立项" in context       # proj-003

    def test_context_includes_progress(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        assert "68.0%" in context
        assert "35.0%" in context
        assert "15.0%" in context

    def test_context_includes_budget(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        assert "1.2亿" in context
        assert "450万" in context
        assert "80万" in context

    def test_context_includes_task_counts(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        # proj-001 has 5 tasks
        assert "5个任务" in context
        # proj-002 has 5 tasks
        # proj-003 has 4 tasks
        assert "4个任务" in context

    def test_context_includes_team_count(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        assert "12人" in context  # proj-001
        assert "8人" in context   # proj-002
        assert "5人" in context   # proj-003

    def test_context_includes_valid_transitions(self):
        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        # proj-001 (construction) -> acceptance
        assert "验收" in context
        # proj-003 (initiation) -> bidding, contract
        assert "投标" in context

    def test_context_empty_store(self):
        """When no projects exist, context says so."""
        import src.stores.project_store as ps
        ps._projects.clear()

        client = _make_client()
        agent = ProjectAgent(llm_client=client)
        context = agent._build_project_context()

        assert "暂无项目数据" in context


# ---------------------------------------------------------------------------
# ProjectAgent._parse_cards()
# ---------------------------------------------------------------------------

class TestParseCards:
    def _agent(self) -> ProjectAgent:
        return ProjectAgent(llm_client=_make_client())

    def test_parse_data_card(self):
        agent = self._agent()
        raw = [{"card_type": "data", "title": "T", "data": {"k": "v"}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert len(cards) == 1
        assert cards[0].card_type == CardType.DATA
        assert cards[0].title == "T"
        assert cards[0].data == {"k": "v"}

    def test_parse_action_card(self):
        agent = self._agent()
        raw = [{"card_type": "action", "title": "Op", "data": {}, "actions": [{"label": "Do"}]}]
        cards = agent._parse_cards(raw)
        assert cards[0].card_type == CardType.ACTION
        assert cards[0].actions == [{"label": "Do"}]

    def test_parse_form_card(self):
        agent = self._agent()
        raw = [{"card_type": "form", "title": "Form", "data": {}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert cards[0].card_type == CardType.FORM

    def test_parse_file_card(self):
        agent = self._agent()
        raw = [{"card_type": "file", "title": "File", "data": {}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert cards[0].card_type == CardType.FILE

    def test_parse_alert_card_maps_to_data(self):
        agent = self._agent()
        raw = [{"card_type": "alert", "title": "Alert", "data": {}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert cards[0].card_type == CardType.DATA
        assert cards[0].data["severity"] == "warning"

    def test_parse_unknown_type_defaults_to_data(self):
        agent = self._agent()
        raw = [{"card_type": "unknown_type", "title": "X", "data": {}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert cards[0].card_type == CardType.DATA

    def test_parse_missing_card_type_defaults_to_data(self):
        agent = self._agent()
        raw = [{"title": "No Type", "data": {}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert cards[0].card_type == CardType.DATA

    def test_parse_skips_non_dict_entries(self):
        agent = self._agent()
        raw = ["string_not_dict", 42, None, {"card_type": "data", "title": "OK", "data": {}, "actions": []}]
        cards = agent._parse_cards(raw)
        assert len(cards) == 1
        assert cards[0].title == "OK"

    def test_parse_empty_list(self):
        agent = self._agent()
        cards = agent._parse_cards([])
        assert cards == []

    def test_parse_card_with_missing_optional_fields(self):
        agent = self._agent()
        raw = [{"card_type": "data"}]  # no title, data, or actions
        cards = agent._parse_cards(raw)
        assert len(cards) == 1
        assert cards[0].title == ""
        assert cards[0].data == {}
        assert cards[0].actions == []


# ---------------------------------------------------------------------------
# Message construction — project context injection
# ---------------------------------------------------------------------------

class TestMessageConstruction:
    @pytest.mark.asyncio
    async def test_project_context_injected_after_system_prompt(self):
        """Project data should be inserted as a second system message."""
        client = _make_client(chat_json_return={"reply": "ok", "cards": []})
        agent = ProjectAgent(llm_client=client)

        request = _make_request("项目进度如何？")
        await agent.handle(request)

        call_args = client.chat_json.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1]["messages"]

        # messages[0] = system prompt, messages[1] = project context, messages[-1] = user
        assert messages[0]["role"] == "system"
        assert "项目管理Agent" in messages[0]["content"]
        assert messages[1]["role"] == "system"
        assert "当前系统中的项目数据" in messages[1]["content"]
        assert messages[-1]["role"] == "user"
        assert messages[-1]["content"] == "项目进度如何？"

    @pytest.mark.asyncio
    async def test_max_tokens_passed_to_chat_json(self):
        """chat_json should be called with max_tokens=2048."""
        client = _make_client(chat_json_return={"reply": "ok", "cards": []})
        agent = ProjectAgent(llm_client=client)

        await agent.handle(_make_request("test"))

        call_kwargs = client.chat_json.call_args[1]
        assert call_kwargs["max_tokens"] == 2048
