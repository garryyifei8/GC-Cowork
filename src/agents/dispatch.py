"""
Dispatch Agent (调度Agent) — the universal front-desk agent.

Responsibilities:
- Intent recognition: understand what the user wants
- Agent routing: route to the appropriate specialized agent(s)
- Multi-agent coordination: orchestrate serial / parallel / human-in-loop workflows
- Session management: maintain conversation context
"""
import re

from src.agents.base import BaseAgent
from src.core.models import (
    AgentIntent,
    AgentRequest,
    AgentResponse,
    AgentType,
    TaskComplexity,
    WorkflowPattern,
)
from src.llm.client import LLMClient
from src.llm.prompts import DISPATCH_SYSTEM_PROMPT


# Keyword-based intent mapping (to be replaced with LLM classification in P1)
_INTENT_RULES: list[tuple[list[str], AgentType]] = [
    (["项目", "进度", "里程碑", "工期", "施工", "验收", "结算", "归档"], AgentType.PROJECT),
    (["发票", "报销", "预算", "资金", "财务", "费用", "结算金额"], AgentType.FINANCE),
    (["合同", "条款", "法律", "合规", "风险", "法务"], AgentType.LEGAL),
    (["采购", "供应商", "询价", "比价", "采购申请"], AgentType.PROCUREMENT),
    (["考勤", "请假", "绩效", "招聘", "人事", "员工"], AgentType.HR),
    (["投标", "招标", "标书", "中标概率", "资质", "投标书"], AgentType.BIDDING),
    (["文档", "文件", "报告", "摘要", "模板", "版本"], AgentType.DOCUMENT),
    (["知识", "经验", "案例", "标准", "规范", "学习"], AgentType.KNOWLEDGE),
]

_COMPLEX_KEYWORDS = ["分析", "评估", "综合", "启动", "全部", "所有", "联动"]


def _classify_intent(message: str) -> AgentIntent:
    """
    Rule-based intent classification.
    Returns Dispatch itself when no clear match is found.
    This will be replaced by an LLM classifier in P1.
    """
    scores: dict[AgentType, int] = {}
    for keywords, agent in _INTENT_RULES:
        count = sum(1 for kw in keywords if kw in message)
        if count:
            scores[agent] = scores.get(agent, 0) + count

    if not scores:
        primary = AgentType.DISPATCH
        secondary: list[AgentType] = []
        complexity = TaskComplexity.SIMPLE
        pattern = WorkflowPattern.SERIAL
        confidence = 0.5
    else:
        sorted_agents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_agents[0][0]
        secondary = [a for a, _ in sorted_agents[1:3]]  # up to 2 supporting agents
        is_complex = any(kw in message for kw in _COMPLEX_KEYWORDS) or len(scores) > 2
        complexity = TaskComplexity.COMPLEX if is_complex else TaskComplexity.SIMPLE
        pattern = WorkflowPattern.PARALLEL if len(scores) > 2 else WorkflowPattern.SERIAL
        confidence = min(1.0, sorted_agents[0][1] / 5.0 + 0.5)

    return AgentIntent(
        primary_agent=primary,
        secondary_agents=secondary,
        complexity=complexity,
        workflow_pattern=pattern,
        confidence=confidence,
    )


class DispatchAgent(BaseAgent):
    """
    Universal dispatch agent — the entry point for all user conversations.
    """

    agent_type = AgentType.DISPATCH
    system_prompt = DISPATCH_SYSTEM_PROMPT

    def __init__(self, llm_client: LLMClient):
        super().__init__(llm_client)

    async def handle(self, request: AgentRequest) -> AgentResponse:
        intent = _classify_intent(request.user_message)

        # Enrich request with recognized intent
        request.intent = intent

        # Build a routing confirmation message
        if intent.primary_agent == AgentType.DISPATCH:
            content = (
                "您好！我是AI项目协作平台的智能助手。"
                "请问您需要什么帮助？我可以协助处理项目管理、财务、法务、采购、人事、投标、文档等相关事务。"
            )
        else:
            agent_names = {
                AgentType.PROJECT: "项目管理Agent",
                AgentType.FINANCE: "财务Agent",
                AgentType.LEGAL: "法务Agent",
                AgentType.PROCUREMENT: "采购Agent",
                AgentType.HR: "人事Agent",
                AgentType.BIDDING: "投标Agent",
                AgentType.DOCUMENT: "文档Agent",
                AgentType.KNOWLEDGE: "知识Agent",
            }
            primary_name = agent_names.get(intent.primary_agent, str(intent.primary_agent))
            content = f"正在将您的请求转交给{primary_name}处理..."
            if intent.secondary_agents:
                secondary_names = [agent_names.get(a, str(a)) for a in intent.secondary_agents]
                content += f"（同时协同：{'、'.join(secondary_names)}）"

        return AgentResponse(
            request_id=request.request_id,
            agent_type=self.agent_type,
            content=content,
            metadata={"intent": intent.model_dump()},
        )
