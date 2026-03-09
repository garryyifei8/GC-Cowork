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
  content: string;
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
  id: number;
  title: string;
  type: string;
  status: 'active' | 'risk' | 'planning' | 'completed';
  statusLabel: string;
  progress: number;
  dueDate: string;
  budget: string;
  teamSize: number;
}

export interface KnowledgeDoc {
  id: number;
  title: string;
  author: string;
  date: string;
  type: string;
  likes: number;
}
