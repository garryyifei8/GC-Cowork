"""监理Agent (Supervision Agent) — 工程监理管理."""

from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import SUPERVISION_SYSTEM_PROMPT
from src.stores.project_store import list_projects
from src.stores.task_store import list_tasks


class SupervisionAgent(BaseAgent):
    """监理Agent - 工程监理管理

    职责：
    - 旁站监理：关键工序旁站记录、影像留存
    - 巡视检查：日常巡视记录、问题台账
    - 平行检验：独立检测记录、数据比对
    - 监理报告：周报/月报、专题报告
    """

    agent_type = AgentType.SUPERVISION
    system_prompt = SUPERVISION_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        """处理监理管理请求"""
        # 1. 收集监理数据
        supervision_data = self._build_supervision_data()

        # 2. 构建消息
        messages = self._build_messages(request)
        messages.insert(
            1,
            {
                "role": "system",
                "content": ("以下是当前项目的监理数据，请基于这些数据回答用户问题：\n\n" + supervision_data),
            },
        )

        # 3. 调用LLM
        try:
            result = await self.llm_client.chat_json(messages, max_tokens=2048)
            content = result.get("reply", "")
            raw_cards = result.get("cards", [])
            cards = self._parse_cards(raw_cards)
        except Exception:
            content = await self.llm_client.chat(messages)
            cards = []

        response = self._base_response(request, content)
        response.cards = cards
        return response

    def _build_supervision_data(self) -> str:
        """构建监理数据上下文"""
        projects = list_projects()
        if not projects:
            return "当前系统中暂无项目数据。"

        lines = []
        for p in projects:
            list_tasks(p.id)  # preload task data

            # 模拟监理数据
            patrol_records = self._get_patrol_records(p.id)
            inspection_records = self._get_inspection_records(p.id)
            issues = self._get_issues(p.id)

            lines.append(
                f"## 项目: {p.name} (ID: {p.id})\n"
                f"**巡视记录**: {patrol_records['total']}次\n"
                f"  - 正常: {patrol_records['normal']}次\n"
                f"  - 异常: {patrol_records['abnormal']}次\n\n"
                f"**检查记录**: {inspection_records['total']}次\n"
                f"  - 质量检查: {inspection_records['quality']}次\n"
                f"  - 安全检查: {inspection_records['safety']}次\n\n"
                f"**问题跟踪**: {issues['total']}个\n"
                f"  - 已整改: {issues['resolved']}个\n"
                f"  - 待整改: {issues['pending']}个\n"
                f"  - 逾期: {issues['overdue']}个"
            )

        return "\n\n".join(lines) if lines else "暂无项目数据"

    def _get_patrol_records(self, project_id: str) -> dict:
        """获取巡视记录"""
        return {
            "total": 15,
            "normal": 12,
            "abnormal": 3,
        }

    def _get_inspection_records(self, project_id: str) -> dict:
        """获取检查记录"""
        return {
            "total": 8,
            "quality": 5,
            "safety": 3,
        }

    def _get_issues(self, project_id: str) -> dict:
        """获取问题跟踪"""
        return {
            "total": 5,
            "resolved": 3,
            "pending": 1,
            "overdue": 1,
        }
