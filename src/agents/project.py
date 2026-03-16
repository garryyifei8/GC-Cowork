"""项目管理Agent — project lifecycle management with structured card output."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import PROJECT_SYSTEM_PROMPT
from src.stores.project_store import list_projects
from src.stores.task_store import list_tasks
from src.workflow.engine import get_valid_transitions, get_stage_label


class ProjectAgent(BaseAgent):
    agent_type = AgentType.PROJECT
    system_prompt = PROJECT_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        # 1. Gather project context
        project_context = self._build_project_context()

        # 2. Build messages with project data injected
        messages = self._build_messages(request)
        # Insert project data after system prompt
        messages.insert(1, {
            "role": "system",
            "content": (
                "以下是当前系统中的项目数据，请基于这些数据回答用户问题：\n\n"
                + project_context
            ),
        })

        # 3. Call LLM for structured JSON output
        try:
            result = await self.llm_client.chat_json(messages, max_tokens=2048)
            content = result.get("reply", "")
            raw_cards = result.get("cards", [])
            cards = self._parse_cards(raw_cards)
        except Exception:
            # Fallback to plain text if JSON parsing fails
            content = await self.llm_client.chat(messages)
            cards = []

        response = self._base_response(request, content)
        response.cards = cards
        return response

    def build_stream_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Build messages for streaming with project data injected."""
        messages = self._build_messages(request)
        messages.insert(1, {
            "role": "system",
            "content": f"以下是当前系统中的项目数据，请基于这些数据回答用户问题：\n\n{self._build_project_context()}",
        })
        messages.append({
            "role": "system",
            "content": "重要：本次请直接用自然语言回复用户。不要使用JSON格式，不要输出代码块。请使用清晰的中文段落和列表来组织回答。",
        })
        return messages

    def _build_project_context(self) -> str:
        """Serialize current project data for LLM context."""
        projects = list_projects()
        if not projects:
            return "当前系统中暂无项目数据。"

        lines: list[str] = []
        for p in projects:
            stage_label = get_stage_label(p.stage)
            tasks = list_tasks(p.id)
            task_summary = f"{len(tasks)}个任务" if tasks else "暂无任务"

            # Count task statuses
            done_count = sum(1 for t in tasks if t.status.value == "done")
            in_progress_count = sum(
                1 for t in tasks if t.status.value == "in_progress"
            )

            valid_transitions = get_valid_transitions(p.stage)
            next_stages = (
                ", ".join(t["label"] for t in valid_transitions)
                if valid_transitions
                else "无（已归档）"
            )

            lines.append(
                f"- 项目: {p.name} (ID: {p.id})\n"
                f"  类型: {p.project_type} | 阶段: {stage_label} | 状态: {p.status_label}\n"
                f"  进度: {p.progress_pct}% | 预算: {p.budget_display or '未设定'}\n"
                f"  截止日期: {p.due_date or '未设定'} | 团队: {len(p.team_members)}人\n"
                f"  任务: {task_summary} (已完成{done_count}, 进行中{in_progress_count})\n"
                f"  可推进阶段: {next_stages}"
            )
        return "\n\n".join(lines)

