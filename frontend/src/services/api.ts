import type { ChatResponse, Project, ProjectDetail, ProjectTask, BiddingOpportunity, ActivityEvent, DashboardMetrics, AISuggestion, TaskWithProject, DocumentItem, Employee, AttendanceRecord, LeaveRequest, SalaryRecord, HRSummary, ExpenseReport, BudgetLine, FinanceInvoice, FinanceSummary } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const chatService = {
  sendMessage: (message: string, context?: Array<{ role: string; content: string }>) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

export const projectService = {
  list: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Project[]>(`/projects${params}`);
  },
  get: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  create: (data: { name: string; project_type?: string; budget_display?: string }) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  transition: (id: string, targetStage: string) =>
    request<Project>(`/projects/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ target_stage: targetStage }),
    }),
  listTasks: (projectId: string) =>
    request<ProjectTask[]>(`/projects/${projectId}/tasks`),
  createTask: (projectId: string, data: { name: string; assignee?: string; priority?: string; due_date?: string }) =>
    request<ProjectTask>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (taskId: string, data: Partial<ProjectTask>) =>
    request<ProjectTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getActivities: (projectId: string) =>
    request<ActivityEvent[]>(`/projects/${projectId}/activities`),
  getDocuments: (projectId: string) =>
    request<DocumentItem[]>(`/projects/${projectId}/documents`),
};

export const activityService = {
  getRecent: (limit = 10) =>
    request<ActivityEvent[]>(`/activities/recent?limit=${limit}`),
};

export const dashboardService = {
  getMetrics: () => request<DashboardMetrics>('/dashboard/metrics'),
  getSuggestions: () => request<AISuggestion[]>('/dashboard/suggestions'),
};

export const taskService = {
  listAll: (params?: { assignee?: string; status?: string; priority?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.assignee) searchParams.set('assignee', params.assignee);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    const qs = searchParams.toString();
    return request<TaskWithProject[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },
};

export const biddingService = {
  list: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    const qs = params.toString();
    return request<BiddingOpportunity[]>(`/bidding/opportunities${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<BiddingOpportunity>(`/bidding/opportunities/${id}`),
};

export const hrService = {
  listEmployees: (params?: { department?: string; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.department) sp.set('department', params.department);
    if (params?.status) sp.set('status', params.status);
    const qs = sp.toString();
    return request<Employee[]>(`/hr/employees${qs ? `?${qs}` : ''}`);
  },
  getEmployee: (id: string) => request<Employee>(`/hr/employees/${id}`),
  listAttendance: (params?: { employee_id?: string; date_from?: string; date_to?: string }) => {
    const sp = new URLSearchParams();
    if (params?.employee_id) sp.set('employee_id', params.employee_id);
    if (params?.date_from) sp.set('date_from', params.date_from);
    if (params?.date_to) sp.set('date_to', params.date_to);
    const qs = sp.toString();
    return request<AttendanceRecord[]>(`/hr/attendance${qs ? `?${qs}` : ''}`);
  },
  listLeaves: (params?: { employee_id?: string; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.employee_id) sp.set('employee_id', params.employee_id);
    if (params?.status) sp.set('status', params.status);
    const qs = sp.toString();
    return request<LeaveRequest[]>(`/hr/leaves${qs ? `?${qs}` : ''}`);
  },
  updateLeave: (id: string, data: Partial<LeaveRequest>) =>
    request<LeaveRequest>(`/hr/leaves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listSalary: (params?: { employee_id?: string; month?: string }) => {
    const sp = new URLSearchParams();
    if (params?.employee_id) sp.set('employee_id', params.employee_id);
    if (params?.month) sp.set('month', params.month);
    const qs = sp.toString();
    return request<SalaryRecord[]>(`/hr/salary${qs ? `?${qs}` : ''}`);
  },
  getSummary: () => request<HRSummary>('/hr/summary'),
  getInsights: () => request<Array<{ title: string; description: string; severity: string; category: string }>>('/hr/insights'),
};

export const financeService = {
  listExpenses: (params?: { status?: string; project_id?: string; submitter?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.project_id) sp.set('project_id', params.project_id);
    if (params?.submitter) sp.set('submitter', params.submitter);
    const qs = sp.toString();
    return request<ExpenseReport[]>(`/finance/expenses${qs ? `?${qs}` : ''}`);
  },
  getExpense: (id: string) => request<ExpenseReport>(`/finance/expenses/${id}`),
  updateExpense: (id: string, data: Partial<ExpenseReport>) =>
    request<ExpenseReport>(`/finance/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listBudgets: (params?: { project_id?: string; fiscal_year?: number }) => {
    const sp = new URLSearchParams();
    if (params?.project_id) sp.set('project_id', params.project_id);
    if (params?.fiscal_year) sp.set('fiscal_year', String(params.fiscal_year));
    const qs = sp.toString();
    return request<BudgetLine[]>(`/finance/budgets${qs ? `?${qs}` : ''}`);
  },
  listInvoices: (params?: { status?: string; project_id?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.project_id) sp.set('project_id', params.project_id);
    const qs = sp.toString();
    return request<FinanceInvoice[]>(`/finance/invoices${qs ? `?${qs}` : ''}`);
  },
  updateInvoice: (id: string, data: Partial<FinanceInvoice>) =>
    request<FinanceInvoice>(`/finance/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getSummary: () => request<FinanceSummary>('/finance/summary'),
  getInsights: () => request<Array<{ title: string; description: string; severity: string; category: string }>>('/finance/insights'),
};
