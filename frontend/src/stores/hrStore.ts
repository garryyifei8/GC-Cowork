import { create } from 'zustand';
import type { Employee, AttendanceRecord, LeaveRequest, SalaryRecord, HRSummary } from '../types';

interface HRInsightItem {
  title: string;
  description: string;
  severity: string;
  category: string;
}

interface HRState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  salaryRecords: SalaryRecord[];
  summary: HRSummary | null;
  insights: HRInsightItem[];
  isLoading: boolean;
  error: string | null;

  fetchEmployees: (department?: string, status?: string) => Promise<void>;
  fetchAttendance: (employeeId?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchLeaveRequests: (employeeId?: string, status?: string) => Promise<void>;
  fetchSalaryRecords: (employeeId?: string, month?: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  approveLeave: (id: string, approved: boolean) => Promise<void>;
  clearError: () => void;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') {
      sp.set(key, val);
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : '';
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const useHRStore = create<HRState>((set) => ({
  employees: [],
  attendance: [],
  leaveRequests: [],
  salaryRecords: [],
  summary: null,
  insights: [],
  isLoading: false,
  error: null,

  fetchEmployees: async (department?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ department, status });
      const employees = await apiFetch<Employee[]>(`/api/hr/employees${qs}`);
      set({ employees, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载员工数据失败',
      });
    }
  },

  fetchAttendance: async (employeeId?: string, dateFrom?: string, dateTo?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ employee_id: employeeId, date_from: dateFrom, date_to: dateTo });
      const attendance = await apiFetch<AttendanceRecord[]>(`/api/hr/attendance${qs}`);
      set({ attendance, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载考勤数据失败',
      });
    }
  },

  fetchLeaveRequests: async (employeeId?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ employee_id: employeeId, status });
      const leaveRequests = await apiFetch<LeaveRequest[]>(`/api/hr/leaves${qs}`);
      set({ leaveRequests, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载请假数据失败',
      });
    }
  },

  fetchSalaryRecords: async (employeeId?: string, month?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ employee_id: employeeId, month });
      const salaryRecords = await apiFetch<SalaryRecord[]>(`/api/hr/salary${qs}`);
      set({ salaryRecords, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载工资数据失败',
      });
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await apiFetch<HRSummary>('/api/hr/summary');
      set({ summary, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载人力资源汇总失败',
      });
    }
  },

  fetchInsights: async () => {
    try {
      const data = await apiFetch<{ insights: HRInsightItem[] }>('/api/hr/insights');
      set({ insights: data.insights ?? [] });
    } catch (err) {
      console.error('Failed to fetch HR insights:', err);
    }
  },

  approveLeave: async (id: string, approved: boolean) => {
    try {
      const status = approved ? 'approved' : 'rejected';
      const updated = await apiFetch<LeaveRequest>(`/api/hr/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      set((state) => ({
        leaveRequests: state.leaveRequests.map((lr) => (lr.id === id ? updated : lr)),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '审批操作失败',
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// Re-export the insight type for use in the page
export type { HRInsightItem };
