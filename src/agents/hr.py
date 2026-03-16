"""人事Agent — attendance, performance, recruitment."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import HR_SYSTEM_PROMPT
from src.stores.hr_store import list_attendance, list_employees, list_leave_requests, list_salary_records


class HRAgent(BaseAgent):
    agent_type = AgentType.HR
    system_prompt = HR_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        # 1. Gather HR context from stores
        context_data = self._build_hr_context()

        # 2. Build messages with HR data injected after the system prompt
        messages = self._build_messages(request)
        messages.insert(1, {
            "role": "system",
            "content": f"以下是当前系统中的人事数据：\n\n{context_data}",
        })

        # 3. Call LLM for structured JSON output, fall back to plain text on error
        try:
            result = await self.llm_client.chat_json(messages, max_tokens=2048)
            content = result.get("reply", "")
            cards = self._parse_cards(result.get("cards", []))
        except Exception:
            content = await self.llm_client.chat(messages)
            cards = []

        response = self._base_response(request, content)
        response.cards = cards
        return response

    def build_stream_messages(self, request: AgentRequest) -> list[dict[str, str]]:
        """Build messages for streaming with HR data injected."""
        messages = self._build_messages(request)
        messages.insert(1, {
            "role": "system",
            "content": f"以下是当前系统中的人事数据：\n\n{self._build_hr_context()}",
        })
        messages.append({
            "role": "system",
            "content": "重要：本次请直接用自然语言回复用户。不要使用JSON格式，不要输出代码块。请使用清晰的中文段落和列表来组织回答。",
        })
        return messages

    def _build_hr_context(self) -> str:
        """Serialize current HR data for LLM context."""
        sections: list[str] = []

        # Employees
        employees = list_employees()
        if employees:
            emp_lines = ["【员工列表】"]
            for e in employees:
                emp_lines.append(
                    f"- {e.id}: {e.name} | 部门={e.department} | 职位={e.position}"
                    f" | 状态={e.status.value} | 入职={e.hire_date}"
                )
            sections.append("\n".join(emp_lines))
        else:
            sections.append("【员工列表】暂无数据。")

        # Attendance (most recent records — limit to keep context concise)
        attendance = list_attendance()
        if attendance:
            att_lines = ["【近期考勤记录】"]
            for a in attendance[-20:]:
                emp = next((e for e in employees if e.id == a.employee_id), None)
                name = emp.name if emp else a.employee_id
                att_lines.append(
                    f"- {a.date} | {name} | 状态={a.status.value}"
                    + (f" | 签到={a.check_in}" if a.check_in else "")
                )
            sections.append("\n".join(att_lines))
        else:
            sections.append("【近期考勤记录】暂无数据。")

        # Leave requests
        leaves = list_leave_requests()
        if leaves:
            leave_lines = ["【请假申请】"]
            for lr in leaves:
                emp = next((e for e in employees if e.id == lr.employee_id), None)
                name = emp.name if emp else lr.employee_id
                leave_lines.append(
                    f"- {lr.id}: {name} | 类型={lr.leave_type.value}"
                    f" | {lr.start_date}～{lr.end_date} ({lr.days}天)"
                    f" | 状态={lr.status.value}"
                )
            sections.append("\n".join(leave_lines))
        else:
            sections.append("【请假申请】暂无数据。")

        # Latest salary records (current month only to avoid token bloat)
        salary_records = list_salary_records(month="2026-03")
        if salary_records:
            sal_lines = ["【2026-03薪资记录】"]
            for s in salary_records:
                emp = next((e for e in employees if e.id == s.employee_id), None)
                name = emp.name if emp else s.employee_id
                sal_lines.append(
                    f"- {name}: 基本={s.base_salary}元 | 加班={s.overtime_pay}元"
                    f" | 奖金={s.bonus}元 | 实发={s.net_salary}元"
                )
            sections.append("\n".join(sal_lines))
        else:
            sections.append("【薪资记录】暂无数据。")

        return "\n\n".join(sections)
