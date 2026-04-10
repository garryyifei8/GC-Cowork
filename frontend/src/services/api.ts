import type {
  ChatResponse,
  Project,
  ProjectDetail,
  ProjectTask,
  ActivityEvent,
  DashboardMetrics,
  AISuggestion,
  TaskWithProject,
  DocumentItem,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  SalaryRecord,
  HRSummary,
  ExpenseReport,
  BudgetLine,
  FinanceInvoice,
  FinanceSummary,
  ProcurementPackage,
  ProcessRecord,
  LegalContract,
  AuditReport,
  SupervisionRecord,
  Supplier,
  SupplierSummary,
} from '../types';

const API_BASE = '/api';

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Fetch wrapper that auto-injects auth token. Use for direct fetch calls in stores. */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers as Record<string, string>) },
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
    onError: (errorMessage: string) => void
  ): Promise<void> => {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: authHeaders(),
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

  checkHealth: () =>
    request<{ status: string; message?: string; provider?: string }>('/chat/health'),
};

export const projectService = {
  list: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Project[]>(`/projects${params}`);
  },
  get: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  create: (data: {
    name: string;
    project_type?: string;
    budget_display?: string;
    budget?: number;
    due_date?: string;
    description?: string;
    manager?: string;
    team_members?: string[];
    stage?: string;
    risk_level?: string;
    milestones?: Array<{ name: string; date: string; status: string }>;
  }) =>
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
  listTasks: (projectId: string) => request<ProjectTask[]>(`/projects/${projectId}/tasks`),
  createTask: (
    projectId: string,
    data: { name: string; assignee?: string; priority?: string; due_date?: string }
  ) =>
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
  getDocuments: (projectId: string) => request<DocumentItem[]>(`/projects/${projectId}/documents`),
  delete: async (projectId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  createMilestone: async (
    projectId: string,
    data: { name: string; date?: string; status?: string }
  ) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  updateMilestone: async (
    projectId: string,
    milestoneId: string,
    data: Record<string, unknown>
  ) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  deleteMilestone: async (projectId: string, milestoneId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  createRisk: async (
    projectId: string,
    data: { description: string; level?: string; mitigation?: string }
  ) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/risks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  updateRisk: async (projectId: string, riskId: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/risks/${riskId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  deleteRisk: async (projectId: string, riskId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/risks/${riskId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  updateTeam: async (projectId: string, members: string[]) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ members }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  addTeamMember: async (projectId: string, name: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  removeTeamMember: async (projectId: string, name: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  deleteTask: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json().catch(() => ({}));
  },
  getProcurements: (projectId: string) =>
    request<ProcurementPackage[]>(`/projects/${projectId}/procurement`).then(
      (res: any) => res.items ?? res
    ),
  createProcurement: (projectId: string, data: Record<string, any>) =>
    request<ProcurementPackage>(`/projects/${projectId}/procurement`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProcurement: (projectId: string, pkgId: string, updates: Record<string, any>) =>
    request<ProcurementPackage>(`/projects/${projectId}/procurement/${pkgId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getProcessRecords: (projectId: string, recordType?: string) => {
    const params = recordType ? `?record_type=${recordType}` : '';
    return request<ProcessRecord[]>(`/projects/${projectId}/processes${params}`).then(
      (res: any) => res.items ?? res
    );
  },
  createProcessRecord: (projectId: string, data: Record<string, any>) =>
    request<ProcessRecord>(`/projects/${projectId}/processes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const activityService = {
  getRecent: (limit = 10) => request<ActivityEvent[]>(`/activities/recent?limit=${limit}`),
};

export const dashboardService = {
  getMetrics: () => request<DashboardMetrics>('/dashboard/metrics'),
  getSuggestions: () => request<AISuggestion[]>('/dashboard/suggestions'),
};

export interface TaskComment {
  id: string;
  project_id: string;
  event_type: string;
  actor: string;
  summary: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export const taskService = {
  listAll: (params?: { assignee?: string; status?: string; priority?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.assignee) searchParams.set('assignee', params.assignee);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    const qs = searchParams.toString();
    return request<TaskWithProject[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },
  listComments: (taskId: string) => request<TaskComment[]>(`/tasks/${taskId}/comments`),
  createComment: (taskId: string, content: string, author?: string) =>
    request<TaskComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, author: author ?? '当前用户' }),
    }),
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
  getInsights: () =>
    request<Array<{ title: string; description: string; severity: string; category: string }>>(
      '/hr/insights'
    ),
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
  getInsights: () =>
    request<Array<{ title: string; description: string; severity: string; category: string }>>(
      '/finance/insights'
    ),
};

export const knowledgeService = {
  listDocuments: (docType?: string, status?: string) => {
    const sp = new URLSearchParams();
    if (docType) sp.set('doc_type', docType);
    if (status) sp.set('status', status);
    const qs = sp.toString();
    return request<DocumentItem[]>(`/knowledge/documents${qs ? `?${qs}` : ''}`);
  },
  search: (query: string, category?: string, topK = 20) =>
    request<
      Array<{
        id: string;
        title: string;
        doc_type: string;
        content_summary: string;
        author: string;
        status: string;
        score: number;
      }>
    >('/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query, category, top_k: topK }),
    }),
};

export const documentService = {
  list: (params?: { project_id?: string; doc_type?: string; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.project_id) sp.set('project_id', params.project_id);
    if (params?.doc_type) sp.set('doc_type', params.doc_type);
    if (params?.status) sp.set('status', params.status);
    const qs = sp.toString();
    return request<DocumentItem[]>(`/documents${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<DocumentItem>(`/documents/${id}`),
  create: (data: {
    title: string;
    doc_type?: string;
    project_id?: string;
    content_summary?: string;
    author?: string;
  }) => request<DocumentItem>('/documents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<DocumentItem>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<{ ok: boolean }>(`/documents/${id}`, { method: 'DELETE' }),
  upload: (
    file: File,
    meta?: {
      title?: string;
      doc_type?: string;
      project_id?: string;
      author?: string;
      category?: string;
    },
    onProgress?: (pct: number) => void
  ): Promise<DocumentItem> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (meta?.title) formData.append('title', meta.title);
      if (meta?.doc_type) formData.append('doc_type', meta.doc_type);
      if (meta?.project_id) formData.append('project_id', meta.project_id);
      if (meta?.author) formData.append('author', meta.author);
      if (meta?.category) formData.append('category', meta.category);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/documents/upload`);

      const token = localStorage.getItem('access_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as DocumentItem);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(formData);
    });
  },
  getDownloadUrl: (docId: string) => `${API_BASE}/documents/${docId}/download`,
  getFileUrl: (fileUrl: string) => {
    if (fileUrl.startsWith('/api/')) return fileUrl;
    return `${API_BASE}/documents/file/${fileUrl}`;
  },
};

export const legalService = {
  list: (params?: { status?: string; contract_type?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.contract_type) sp.set('contract_type', params.contract_type);
    const qs = sp.toString();
    return request<LegalContract[]>(`/legal/contracts${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<LegalContract>(`/legal/contracts/${id}`),
  create: (data: Record<string, unknown>) =>
    request<LegalContract>('/legal/contracts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<LegalContract>(`/legal/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getSummary: () =>
    request<{ total: number; active: number; expiring_soon: number; total_amount: number }>(
      '/legal/summary'
    ),
};

export const auditService = {
  listReports: (params?: { status?: string; audit_type?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.audit_type) sp.set('audit_type', params.audit_type);
    const qs = sp.toString();
    return request<AuditReport[]>(`/audit/reports${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<AuditReport>(`/audit/reports/${id}`),
  getSummary: () =>
    request<{
      total: number;
      in_progress: number;
      findings_count: number;
      compliance_rate: number;
    }>('/audit/summary'),
};

export const supervisionService = {
  list: (params?: { project_id?: string; record_type?: string }) => {
    const sp = new URLSearchParams();
    if (params?.project_id) sp.set('project_id', params.project_id);
    if (params?.record_type) sp.set('record_type', params.record_type);
    const qs = sp.toString();
    return request<SupervisionRecord[]>(`/supervision/records${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) =>
    request<SupervisionRecord>('/supervision/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSummary: () =>
    request<{ total: number; issues_open: number; inspections_this_month: number }>(
      '/supervision/summary'
    ),
};

export const supplierService = {
  list: (params?: { category?: string; status?: string; project_id?: string }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.status) sp.set('status', params.status);
    if (params?.project_id) sp.set('project_id', params.project_id);
    const qs = sp.toString();
    return request<Supplier[]>(`/suppliers${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<Supplier>(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),
  getSummary: () => request<SupplierSummary>('/suppliers/summary'),
};
