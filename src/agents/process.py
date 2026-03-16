"""过程控制Agent (Process Control Agent) — 四控管理（进度/质量/安全/成本）."""
from src.agents.base import BaseAgent
from src.core.models import AgentRequest, AgentResponse, AgentType
from src.llm.prompts import PROCESS_CONTROL_SYSTEM_PROMPT
from src.stores.project_store import list_projects
from src.stores.task_store import list_tasks


class ProcessControlAgent(BaseAgent):
    """过程控制Agent - 四控管理（进度/质量/安全/成本）
    
    职责：
    - 进度控制：里程碑节点管控、关键路径分析、工期预警
    - 质量控制：质量检验计划、隐蔽工程验收、质量问题台账
    - 安全控制：安全检查清单、隐患排查、安全培训记录
    - 成本控制：成本预算执行监控、变更成本影响评估
    
    偏差预警机制：
    - 黄色预警：偏差 5%~10% → 通知项目经理 + 生成纠偏建议
    - 橙色预警：偏差 10%~20% → 通知部门负责人 + 启动专项分析
    - 红色预警：偏差 >20% → 通知管理层 + 暂停相关流程 + 要求纠偏方案审批
    """
    
    agent_type = AgentType.PROCESS_CONTROL
    system_prompt = PROCESS_CONTROL_SYSTEM_PROMPT

    async def handle(self, request: AgentRequest) -> AgentResponse:
        """处理四控管理请求"""
        # 1. 收集项目四控数据
        control_data = self._build_control_data()
        
        # 2. 构建消息
        messages = self._build_messages(request)
        # 注入四控数据
        messages.insert(1, {
            "role": "system",
            "content": (
                "以下是当前项目的四控数据，请基于这些数据回答用户问题：\n\n"
                + control_data
            ),
        })

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

    def _build_control_data(self) -> str:
        """构建四控数据上下文"""
        projects = list_projects()
        if not projects:
            return "当前系统中暂无项目数据。"

        lines = []
        for p in projects:
            tasks = list_tasks(p.id)
            
            # 进度分析
            total_tasks = len(tasks)
            done_tasks = sum(1 for t in tasks if t.status.value == "done")
            in_progress = sum(1 for t in tasks if t.status.value == "in_progress")
            progress_pct = p.progress_pct or 0
            
            # 计算偏差（假设计划进度）
            planned_progress = self._calculate_planned_progress(p)
            progress_deviation = progress_pct - planned_progress
            
            # 质量数据（模拟）
            quality_issues = self._get_quality_issues(p.id)
            
            # 安全数据（模拟）
            safety_issues = self._get_safety_issues(p.id)
            
            # 成本数据（模拟）
            cost_data = self._get_cost_data(p.id)
            
            # 确定预警级别
            alert_level = self._get_alert_level(progress_deviation, cost_data)
            
            lines.append(
                f"## 项目: {p.name} (ID: {p.id})\n"
                f"**进度**: {progress_pct}% (计划: {planned_progress}%)\n"
                f"  - 任务: {done_tasks}/{total_tasks}已完成, {in_progress}进行中\n"
                f"  - 偏差: {progress_deviation:+.1f}% {self._alert_emoji(alert_level)}\n\n"
                f"**质量**: {quality_issues['status']}\n"
                f"  - 问题数: {quality_issues['issues']}\n"
                f"  - 合格率: {quality_issues['pass_rate']}%\n\n"
                f"**安全**: {safety_issues['status']}\n"
                f"  - 隐患: {safety_issues['hazards']}个\n"
                f"  - 巡检: {safety_issues['inspections']}次\n\n"
                f"**成本**: {cost_data['status']}\n"
                f"  - 预算: {cost_data['budget']}\n"
                f"  - 执行率: {cost_data['execution_rate']}%\n"
                f"  - 超支: {cost_data['overrun']}%"
            )

        return "\n\n".join(lines) if lines else "暂无项目数据"

    def _calculate_planned_progress(self, project) -> int:
        """计算计划进度（基于项目阶段）"""
        # 简化实现：可以根据项目开始日期和当前日期计算
        return project.progress_pct or 50

    def _get_quality_issues(self, project_id: str) -> dict:
        """获取质量数据"""
        # 简化实现：实际应从数据库查询
        return {
            "status": "正常",
            "issues": 2,
            "pass_rate": 95,
        }

    def _get_safety_issues(self, project_id: str) -> dict:
        """获取安全数据"""
        # 简化实现：实际应从数据库查询
        return {
            "status": "正常",
            "hazards": 1,
            "inspections": 5,
        }

    def _get_cost_data(self, project_id: str) -> dict:
        """获取成本数据"""
        # 简化实现：实际应从数据库查询
        return {
            "status": "正常",
            "budget": "¥1,000,000",
            "execution_rate": 85,
            "overrun": 0,
        }

    def _get_alert_level(self, progress_deviation: float, cost_data: dict) -> str:
        """获取预警级别"""
        cost_overrun = cost_data.get("overrun", 0)
        
        if abs(progress_deviation) > 20 or cost_overrun > 20:
            return "red"
        elif abs(progress_deviation) > 10 or cost_overrun > 10:
            return "orange"
        elif abs(progress_deviation) > 5 or cost_overrun > 5:
            return "yellow"
        return "normal"

    def _alert_emoji(self, level: str) -> str:
        """预警级别对应的emoji"""
        return {
            "red": "🔴",
            "orange": "🟠",
            "yellow": "⚠️",
            "normal": "✅",
        }.get(level, "")
