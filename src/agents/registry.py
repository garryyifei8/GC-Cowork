"""
Agent registry — maps AgentType to agent instances.
Single source of truth for agent lookup. All agents share one LLMClient.
"""
from src.agents.base import BaseAgent
from src.core.models import AgentType
from src.llm.client import LLMClient


def create_agent_registry(llm_client: LLMClient) -> dict[AgentType, BaseAgent]:
    """Build and return a registry mapping every AgentType to its agent instance."""
    from src.agents.bidding import BiddingAgent
    from src.agents.dispatch import DispatchAgent
    from src.agents.document import DocumentAgent
    from src.agents.finance import FinanceAgent
    from src.agents.hr import HRAgent
    from src.agents.knowledge import KnowledgeAgent
    from src.agents.legal import LegalAgent
    from src.agents.procurement import ProcurementAgent
    from src.agents.project import ProjectAgent
    from src.agents.process import ProcessControlAgent
    from src.agents.supervision import SupervisionAgent

    return {
        AgentType.DISPATCH: DispatchAgent(llm_client),
        AgentType.PROJECT: ProjectAgent(llm_client),
        AgentType.FINANCE: FinanceAgent(llm_client),
        AgentType.LEGAL: LegalAgent(llm_client),
        AgentType.PROCUREMENT: ProcurementAgent(llm_client),
        AgentType.HR: HRAgent(llm_client),
        AgentType.BIDDING: BiddingAgent(llm_client),
        AgentType.DOCUMENT: DocumentAgent(llm_client),
        AgentType.KNOWLEDGE: KnowledgeAgent(llm_client),
        AgentType.PROCESS_CONTROL: ProcessControlAgent(llm_client),
        AgentType.SUPERVISION: SupervisionAgent(llm_client),
    }


def get_agent(registry: dict[AgentType, BaseAgent], agent_type: AgentType) -> BaseAgent:
    """Look up an agent by type. Raises KeyError if not found."""
    return registry[agent_type]
