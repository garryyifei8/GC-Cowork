export type AgentType =
  | 'dispatch'
  | 'project'
  | 'finance'
  | 'legal'
  | 'procurement'
  | 'hr'
  | 'bidding'
  | 'document'
  | 'knowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agentType?: AgentType;
  senderName: string;
  timestamp: Date;
  cards?: InteractiveCard[];
  /** True while SSE tokens are still streaming in. */
  isStreaming?: boolean;
  /** True when the message represents a failed AI response. */
  error?: boolean;
  /** Human-readable error detail shown in the bubble. */
  errorMessage?: string;
}

export interface InteractiveCard {
  type:
    | 'action'
    | 'data'
    | 'alert'
    | 'form'
    | 'task_list'
    | 'progress'
    | 'table'
    | 'kanban'
    | 'file'
    | 'chart'
    | 'report';
  title: string;
  content?: string;
  data?: Record<string, any>;
  status?: 'success' | 'warning' | 'danger' | 'info';
  actions?: CardAction[];
  /** Explicit widget type for registry lookup (snake_case). Falls back to heuristic detection. */
  widget_type?: string;
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

// ---------------------------------------------------------------------------
// Project Detail (extended fields from backend ProjectDetail)
// ---------------------------------------------------------------------------

export interface ProjectDetail extends Project {
  budget_amount: number | null;
  actual_spend: number | null;
  risks: RiskItem[];
  milestones: MilestoneItem[];
  tasks: ProjectTask[];
  documents?: DocumentItem[];
}

export interface RiskItem {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owner: string | null;
}

export interface MilestoneItem {
  name: string;
  date: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export interface ActivityEvent {
  id: string;
  project_id: string;
  event_type: 'task_created' | 'task_updated' | 'stage_transition' | 'status_changed';
  actor: string;
  summary: string;
  detail: Record<string, any>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Dashboard Metrics
// ---------------------------------------------------------------------------

export interface ProjectRiskSummary {
  project_id: string;
  project_name: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  top_risk: string;
}

export interface AIInsight {
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'critical';
  project_id: string | null;
}

export interface BudgetSummaryItem {
  project_id: string;
  project_name: string;
  budget_amount: number | null;
  actual_spend: number | null;
}

export interface DashboardMetrics {
  total_projects: number;
  active_projects: number;
  at_risk_projects: number;
  completed_projects: number;
  total_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  stage_distribution: Record<string, number>;
  project_risks: ProjectRiskSummary[];
  ai_insights: AIInsight[];
  task_status_distribution: Record<string, number>;
  budget_summary: BudgetSummaryItem[];
}

// ---------------------------------------------------------------------------
// AI Suggestions
// ---------------------------------------------------------------------------

export interface SuggestedAction {
  action_type: 'create_task' | 'reassign' | 'escalate' | 'transition';
  params: Record<string, any>;
}

export interface AISuggestion {
  id: string;
  type: 'task_suggestion' | 'risk_alert' | 'optimization';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  project_id: string | null;
  suggested_action: SuggestedAction;
}

// ---------------------------------------------------------------------------
// Knowledge Base
// ---------------------------------------------------------------------------

export interface KnowledgeDoc {
  id: number;
  title: string;
  author: string;
  date: string;
  type: string;
  likes: number;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocumentItem {
  id: string;
  title: string;
  doc_type: string;
  project_id: string | null;
  content_summary: string;
  version: string;
  author: string;
  status: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Task with Project (cross-project task view)
// ---------------------------------------------------------------------------

export interface TaskWithProject extends ProjectTask {
  project_name: string;
}

// ---------------------------------------------------------------------------
// HR
// ---------------------------------------------------------------------------

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  hire_date: string;
  salary: number;
  status: string;
  phone: string;
  email: string;
  emergency_contact: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
  approver: string | null;
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  deductions: number;
  social_insurance: number;
  tax: number;
  net_salary: number;
}

export interface HRSummary {
  total_employees: number;
  active_count: number;
  on_leave_count: number;
  department_distribution: Record<string, number>;
  avg_salary: number;
  attendance_rate: number;
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface ExpenseReport {
  id: string;
  submitter: string;
  project_id: string | null;
  category: string;
  amount: number;
  description: string;
  receipts_count: number;
  submit_date: string;
  status: string;
  approver: string | null;
  payment_date: string | null;
}

export interface BudgetLine {
  id: string;
  project_id: string | null;
  category: string;
  planned_amount: number;
  actual_amount: number;
  fiscal_year: number;
  quarter: number;
  notes: string;
}

export interface FinanceInvoice {
  id: string;
  project_id: string | null;
  vendor: string;
  amount: number;
  invoice_date: string;
  due_date: string;
  status: string;
  category: string;
}

export interface FinanceSummary {
  total_expenses: number;
  pending_approvals: number;
  budget_utilization_rate: number;
  overdue_invoices: number;
  monthly_expense_trend: Array<{ month: string; amount: number }>;
}

// ---------------------------------------------------------------------------
// OA
// ---------------------------------------------------------------------------

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  target_user: string | null;
  is_read: boolean;
  created_at: string;
}

export interface VehicleRequest {
  id: string;
  applicant: string;
  date: string;
  origin: string;
  destination: string;
  reason: string;
  status: string;
  approver: string | null;
  created_at: string;
}

export interface ReceiptParseResult {
  amount: number;
  date: string;
  category: string;
  vendor: string;
  description: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Procurement
// ---------------------------------------------------------------------------

export interface ProcurementPackage {
  id: string;
  project_id: string;
  name: string;
  category: string;
  supplier: string | null;
  budget_amount: number | null;
  actual_amount: number | null;
  status: string;
  plan_date: string | null;
  arrival_date: string | null;
  responsible: string | null;
  notes: string;
}

// ---------------------------------------------------------------------------
// Process Management
// ---------------------------------------------------------------------------

export interface ProcessRecord {
  id: string;
  project_id: string;
  record_type: string;
  title: string;
  date: string;
  author: string;
  content: string;
  status: string;
  attachments: string[];
  related_stage: string;
}

// ---------------------------------------------------------------------------
// Legal / Contract Management
// ---------------------------------------------------------------------------

export interface LegalContract {
  id: string;
  title: string;
  contract_type: string;
  party_a: string;
  party_b: string;
  project_id: string | null;
  amount: number;
  sign_date: string;
  start_date: string;
  end_date: string;
  status: string;
  risk_level: string;
  key_terms: string;
  responsible: string;
}

// ---------------------------------------------------------------------------
// Audit Management
// ---------------------------------------------------------------------------

export interface AuditReport {
  id: string;
  title: string;
  audit_type: string;
  project_id: string | null;
  auditor: string;
  start_date: string;
  end_date: string | null;
  status: string;
  findings_count: number;
  risk_level: string;
  summary: string;
}

// ---------------------------------------------------------------------------
// Supervision Management
// ---------------------------------------------------------------------------

export interface SupervisionRecord {
  id: string;
  project_id: string;
  record_type: string;
  title: string;
  date: string;
  inspector: string;
  location: string;
  content: string;
  status: string;
  issues_found: number;
  photos: string[];
}
