"""Tests for Process Control Agent (过控Agent)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4

from src.agents.process import ProcessControlAgent
from src.agents.supervision import SupervisionAgent
from src.core.models import AgentRequest, AgentResponse, AgentType


class TestProcessControlAgent:
    """Test cases for ProcessControlAgent."""

    @pytest.fixture
    def mock_llm_client(self):
        """Create a mock LLM client."""
        client = MagicMock()
        client.chat = AsyncMock(return_value="测试回复：进度正常。")
        client.chat_json = AsyncMock(return_value={
            "reply": "测试回复：进度正常。",
            "cards": []
        })
        return client

    @pytest.fixture
    def agent(self, mock_llm_client):
        """Create a ProcessControlAgent instance."""
        return ProcessControlAgent(mock_llm_client)

    @pytest.fixture
    def mock_request(self):
        """Create a mock AgentRequest."""
        return AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="检查项目进度偏差",
        )

    def test_agent_type(self, agent):
        """Test that agent has correct type."""
        assert agent.agent_type == AgentType.PROCESS_CONTROL

    def test_system_prompt_exists(self, agent):
        """Test that system prompt is defined."""
        assert agent.system_prompt is not None
        assert len(agent.system_prompt) > 0

    @pytest.mark.asyncio
    async def test_handle_returns_response(self, agent, mock_request):
        """Test that handle returns AgentResponse."""
        response = await agent.handle(mock_request)
        
        assert isinstance(response, AgentResponse)
        assert response.agent_type == AgentType.PROCESS_CONTROL

    @pytest.mark.asyncio
    async def test_handle_with_progress_query(self, agent, mock_llm_client):
        """Test handling progress query."""
        mock_llm_client.chat = AsyncMock(return_value="项目A进度80%，项目B进度60%。")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="当前项目进度如何？",
        )
        
        response = await agent.handle(request)
        
        assert response.content is not None

    @pytest.mark.asyncio
    async def test_handle_with_cost_warning(self, agent, mock_llm_client):
        """Test handling cost warning request."""
        mock_llm_client.chat = AsyncMock(return_value="成本预警：项目A超支5%，项目B超支12%。")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="检查成本是否有超支风险",
        )
        
        response = await agent.handle(request)
        
        assert response.content is not None

    @pytest.mark.asyncio
    async def test_handle_with_quality_issue(self, agent, mock_llm_client):
        """Test handling quality issue."""
        mock_llm_client.chat = AsyncMock(return_value="发现3个质量问题：1. 防水层施工不合规...")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="检查质量问题",
        )
        
        response = await agent.handle(request)
        
        assert response.content is not None

    @pytest.mark.asyncio
    async def test_handle_with_safety_check(self, agent, mock_llm_client):
        """Test handling safety check."""
        mock_llm_client.chat = AsyncMock(return_value="安全检查：发现2个隐患，已整改1个。")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="安全检查结果如何？",
        )
        
        response = await agent.handle(request)
        
        assert response.content is not None


class TestSupervisionAgent:
    """Test cases for SupervisionAgent."""

    @pytest.fixture
    def mock_llm_client(self):
        client = MagicMock()
        client.chat = AsyncMock(return_value="监理正常。")
        client.chat_json = AsyncMock(return_value={"reply": "监理正常。", "cards": []})
        return client

    @pytest.fixture
    def agent(self, mock_llm_client):
        return SupervisionAgent(mock_llm_client)

    def test_agent_type(self, agent):
        """Test agent type is SUPERVISION."""
        assert agent.agent_type == AgentType.SUPERVISION

    def test_system_prompt_exists(self, agent):
        """Test system prompt is defined."""
        assert agent.system_prompt is not None

    @pytest.mark.asyncio
    async def test_handle(self, agent):
        """Test supervision agent handle."""
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.SUPERVISION,
            user_message="监理情况如何？",
        )
        
        response = await agent.handle(request)
        
        assert isinstance(response, AgentResponse)
        assert response.agent_type == AgentType.SUPERVISION


class TestFourControlMetrics:
    """Test cases for four control dimensions (四控)."""

    @pytest.fixture
    def mock_llm_client(self):
        client = MagicMock()
        client.chat = AsyncMock(return_value="测试")
        client.chat_json = AsyncMock(return_value={"reply": "测试", "cards": []})
        return client

    @pytest.fixture
    def agent(self, mock_llm_client):
        return ProcessControlAgent(mock_llm_client)

    @pytest.mark.asyncio
    async def test_progress_control(self, agent, mock_llm_client):
        """Test progress control (进度控制)."""
        mock_llm_client.chat = AsyncMock(return_value="进度分析：项目A提前2天，项目B滞后5天...")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="分析各项目进度偏差",
        )
        response = await agent.handle(request)
        assert response.agent_type == AgentType.PROCESS_CONTROL

    @pytest.mark.asyncio
    async def test_quality_control(self, agent, mock_llm_client):
        """Test quality control (质量控制)."""
        mock_llm_client.chat = AsyncMock(return_value="质量检验结果：合格率95%，发现2个问题...")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="质量检验结果",
        )
        response = await agent.handle(request)
        assert response.agent_type == AgentType.PROCESS_CONTROL

    @pytest.mark.asyncio
    async def test_safety_control(self, agent, mock_llm_client):
        """Test safety control (安全控制)."""
        mock_llm_client.chat = AsyncMock(return_value="安全管控：无事故，巡检发现3个隐患...")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="安全管控情况",
        )
        response = await agent.handle(request)
        assert response.agent_type == AgentType.PROCESS_CONTROL

    @pytest.mark.asyncio
    async def test_cost_control(self, agent, mock_llm_client):
        """Test cost control (成本控制)."""
        mock_llm_client.chat = AsyncMock(return_value="成本执行：预算执行率85%，超支项目2个...")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="成本执行情况",
        )
        response = await agent.handle(request)
        assert response.agent_type == AgentType.PROCESS_CONTROL


class TestDeviationAlert:
    """Test cases for deviation alerts (偏差预警)."""

    @pytest.fixture
    def mock_llm_client(self):
        client = MagicMock()
        client.chat = AsyncMock(return_value="预警测试")
        client.chat_json = AsyncMock(return_value={"reply": "预警测试", "cards": []})
        return client

    @pytest.fixture
    def agent(self, mock_llm_client):
        return ProcessControlAgent(mock_llm_client)

    def test_alert_levels(self, agent):
        """Test alert level definitions."""
        # Test alert emoji
        assert agent._alert_emoji("red") == "🔴"
        assert agent._alert_emoji("orange") == "🟠"
        assert agent._alert_emoji("yellow") == "⚠️"
        assert agent._alert_emoji("normal") == "✅"

    def test_get_alert_level(self, agent):
        """Test alert level calculation."""
        # Red alert: >20%
        assert agent._get_alert_level(25, {"overrun": 0}) == "red"
        assert agent._get_alert_level(0, {"overrun": 25}) == "red"
        
        # Orange alert: 10-20%
        assert agent._get_alert_level(15, {"overrun": 0}) == "orange"
        assert agent._get_alert_level(0, {"overrun": 15}) == "orange"
        
        # Yellow alert: 5-10%
        assert agent._get_alert_level(7, {"overrun": 0}) == "yellow"
        assert agent._get_alert_level(0, {"overrun": 7}) == "yellow"
        
        # Normal: <5%
        assert agent._get_alert_level(3, {"overrun": 0}) == "normal"
        assert agent._get_alert_level(0, {"overrun": 3}) == "normal"

    @pytest.mark.asyncio
    async def test_yellow_alert(self, agent, mock_llm_client):
        """Test yellow alert (偏差5-10%)."""
        mock_llm_client.chat = AsyncMock(return_value="⚠️ 黄色预警：项目A进度偏差8%，通知项目经理。")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="检查项目进度",
        )
        response = await agent.handle(request)
        assert "预警" in response.content or "正常" in response.content

    @pytest.mark.asyncio
    async def test_orange_alert(self, agent, mock_llm_client):
        """Test orange alert (偏差10-20%)."""
        mock_llm_client.chat = AsyncMock(return_value="🟠 橙色预警：项目B进度偏差15%，通知部门负责人。")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="检查项目进度",
        )
        response = await agent.handle(request)
        assert response.content is not None

    @pytest.mark.asyncio
    async def test_red_alert(self, agent, mock_llm_client):
        """Test red alert (偏差>20%)."""
        mock_llm_client.chat = AsyncMock(return_value="🔴 红色预警：项目C进度偏差25%，通知管理层，暂停相关流程。")
        
        request = AgentRequest(
            session_id=uuid4(),
            agent_type=AgentType.PROCESS_CONTROL,
            user_message="检查项目进度",
        )
        response = await agent.handle(request)
        assert response.content is not None
