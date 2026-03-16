import type { ChatResponse, Project, ProjectDetail, ProjectTask, BiddingOpportunity, ActivityEvent, DashboardMetrics, AISuggestion, TaskWithProject, DocumentItem, Employee, AttendanceRecord, LeaveRequest, SalaryRecord, HRSummary, ExpenseReport, BudgetLine, FinanceInvoice, FinanceSummary, ProcurementPackage, ProcessRecord } from '../types';

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
  /** Non-streaming fallback — waits for the full response. */
  sendMessage: (message: string, context?: Array<{ role: string; content: string }>) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),

  /**
   * Streaming variant using `fetch` + `ReadableStream`.
   * POSTs to `/api/chat/stream` and parses server-sent events:
   *   - `event: token`  → calls `onToken(content)`
   *   - `event: done`   → calls `onDone({ agent_type, cards })`
   *   - `event: error`  → calls `onError(message)`
   *
   * Returns a Promise that resolves when the stream is fully consumed
   * or rejects on network failure.
   */
  streamMessage: async (
    message: string,
    context: Array<{ role: string; content: string }> | undefined,
    onToken: (token: string) => void,
    onDone: (payload: { agent_type: string; cards: any[] }) => void,
    onError: (errorMessage: string) => void,
  ): Promise<void> => {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    if (!res.body) {
      throw new Error('Response body is not readable');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    // Buffer for incomplete SSE frames between chunks
    let buffer = '';

    const parseAndDispatch = (rawBlock: string) => {
      // Each SSE block contains one or more lines; extract event + data
      const lines = rawBlock.split('\n');
      let eventType = '';
      let dataLine = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice('event:'.length).trim();
        } else if (line.startsWith('data:')) {
          dataLine = line.slice('data:'.length).trim();
        }
      }

      if (!eventType || !dataLine) return;

      try {
        const parsed = JSON.parse(dataLine);
        if (eventType === 'token') {
          onToken(parsed.content ?? '');
        } else if (eventType === 'done') {
          onDone({ agent_type: parsed.agent_type ?? 'dispatch', cards: parsed.cards ?? [] });
        } else if (eventType === 'error') {
          onError(parsed.message ?? '流式响应发生错误');
        }
      } catch {
        // Malformed JSON in SSE data — silently ignore
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by double newlines
      const blocks = buffer.split('\n\n');
      // Keep the last (potentially incomplete) block in the buffer
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const trimmed = block.trim();
        if (trimmed) {
          parseAndDispatch(trimmed);
        }
      }
    }

    // Handle any trailing data in buffer after stream closes
    if (buffer.trim()) {
      parseAndDispatch(buffer.trim());
    }
  },
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
  delete: async (projectId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  createMilestone: async (projectId: string, data: { name: string; date?: string; status?: string }) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  updateMilestone: async (projectId: string, milestoneId: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  deleteMilestone: async (projectId: string, milestoneId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  createRisk: async (projectId: string, data: { description: string; level?: string; mitigation?: string }) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/risks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  updateRisk: async (projectId: string, riskId: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/risks/${riskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  deleteRisk: async (projectId: string, riskId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/risks/${riskId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  updateTeam: async (projectId: string, members: string[]) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  addTeamMember: async (projectId: string, name: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  removeTeamMember: async (projectId: string, name: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  deleteTask: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  getProcurements: (projectId: string) =>
    request<ProcurementPackage[]>(`/projects/${projectId}/procurement`).then((res: any) => res.items ?? res),
  updateProcurement: (projectId: string, pkgId: string, updates: Record<string, any>) =>
    request<ProcurementPackage>(`/projects/${projectId}/procurement/${pkgId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getProcessRecords: (projectId: string, recordType?: string) => {
    const params = recordType ? `?record_type=${recordType}` : '';
    return request<ProcessRecord[]>(`/projects/${projectId}/processes${params}`).then((res: any) => res.items ?? res);
  },
  createProcessRecord: (projectId: string, data: Record<string, any>) =>
    request<ProcessRecord>(`/projects/${projectId}/processes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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
