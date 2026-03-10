export type AgentType = 'dispatch' | 'project' | 'finance' | 'legal' | 'procurement' | 'hr' | 'bidding' | 'document' | 'knowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agentType?: AgentType;
  senderName: string;
  timestamp: Date;
  cards?: InteractiveCard[];
}

export interface InteractiveCard {
  type: 'action' | 'data' | 'alert' | 'form';
  title: string;
  content?: string;
  data?: Record<string, any>;
  status?: 'success' | 'warning' | 'danger' | 'info';
  actions?: CardAction[];
}

export interface CardAction {
  label: string;
  primary?: boolean;
  action?: string;
}

export interface ChatRequest {
  message: string;
  context?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  reply: string;
  agent_type: AgentType;
  cards?: InteractiveCard[];
}

export interface Project {
  id: string;
  name: string;
  project_type: string;
  stage: string;
  status: 'active' | 'risk' | 'planning' | 'completed';
  status_label: string;
  progress_pct: number;
  due_date: string | null;
  budget: string | null;
  team_size: number;
  team_members: string[];
}

export interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  assignee: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  description: string;
}

export interface BiddingOpportunity {
  id: string;
  title: string;
  source: string;
  publish_date: string;
  deadline: string;
  budget_amount: string | null;
  region: string;
  category: string;
  status: string;
  match_score: number;
}

export type ViewType = 'table' | 'kanban' | 'gantt';

export interface KnowledgeDoc {
  id: number;
  title: string;
  author: string;
  date: string;
  type: string;
  likes: number;
}
