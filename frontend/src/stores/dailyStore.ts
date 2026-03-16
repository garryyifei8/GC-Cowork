import { create } from 'zustand';
import type {
  LeaveRequest,
  AttendanceRecord,
  SalaryRecord,
  ExpenseReport,
  Notice,
  VehicleRequest,
  ReceiptParseResult,
} from '../types';

/** Hardcoded current user for demo — matches seed employee "emp-001" 张工 */
export const CURRENT_USER_ID = 'emp-001';
export const CURRENT_USER_NAME = '张工';

interface DailyState {
  // Data
  myLeaves: LeaveRequest[];
  myAttendance: AttendanceRecord[];
  mySalary: SalaryRecord[];
  myExpenses: ExpenseReport[];
  pendingApprovals: {
    leaves: LeaveRequest[];
    expenses: ExpenseReport[];
    vehicles: VehicleRequest[];
  };
  notices: Notice[];
  myVehicles: VehicleRequest[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAll: () => Promise<void>;
  fetchMyLeaves: () => Promise<void>;
  fetchMyAttendance: (dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchMySalary: (month?: string) => Promise<void>;
  fetchMyExpenses: () => Promise<void>;
  fetchPendingApprovals: () => Promise<void>;
  fetchNotices: () => Promise<void>;
  fetchMyVehicles: () => Promise<void>;

  createLeave: (data: {
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
  }) => Promise<void>;

  createExpense: (data: {
    category: string;
    amount: number;
    description: string;
    project_id?: string;
    submit_date?: string;
  }) => Promise<void>;

  parseReceipt: (file: File) => Promise<ReceiptParseResult>;

  createVehicle: (data: {
    date: string;
    origin: string;
    destination: string;
    reason: string;
  }) => Promise<void>;

  approveLeave: (id: string, approved: boolean) => Promise<void>;
  approveExpense: (id: string, approved: boolean) => Promise<void>;
  approveVehicle: (id: string, approved: boolean) => Promise<void>;

  markNoticeRead: (id: string) => Promise<void>;
  clockIn: () => Promise<void>;

  clearError: () => void;
}

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const useDailyStore = create<DailyState>((set, get) => ({
  myLeaves: [],
  myAttendance: [],
  mySalary: [],
  myExpenses: [],
  pendingApprovals: { leaves: [], expenses: [], vehicles: [] },
  notices: [],
  myVehicles: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchMyLeaves(),
        get().fetchMyAttendance(),
        get().fetchMySalary(),
        get().fetchMyExpenses(),
        get().fetchPendingApprovals(),
        get().fetchNotices(),
        get().fetchMyVehicles(),
      ]);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载数据失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyLeaves: async () => {
    const data = await api<LeaveRequest[]>(`/api/hr/leaves${qs({ employee_id: CURRENT_USER_ID })}`);
    set({ myLeaves: data });
  },

  fetchMyAttendance: async (dateFrom?: string, dateTo?: string) => {
    const data = await api<AttendanceRecord[]>(`/api/hr/attendance${qs({ employee_id: CURRENT_USER_ID, date_from: dateFrom, date_to: dateTo })}`);
    set({ myAttendance: data });
  },

  fetchMySalary: async (month?: string) => {
    const data = await api<SalaryRecord[]>(`/api/hr/salary${qs({ employee_id: CURRENT_USER_ID, month })}`);
    set({ mySalary: data });
  },

  fetchMyExpenses: async () => {
    const data = await api<ExpenseReport[]>(`/api/finance/expenses${qs({ submitter: CURRENT_USER_NAME })}`);
    set({ myExpenses: data });
  },

  fetchPendingApprovals: async () => {
    const [leaves, expenses, vehicles] = await Promise.all([
      api<LeaveRequest[]>('/api/hr/leaves?status=pending'),
      api<ExpenseReport[]>('/api/finance/expenses?status=submitted'),
      api<VehicleRequest[]>('/api/oa/vehicle-requests?status=pending'),
    ]);
    set({ pendingApprovals: { leaves, expenses, vehicles } });
  },

  fetchNotices: async () => {
    const data = await api<Notice[]>(`/api/oa/notices${qs({ target_user: CURRENT_USER_ID })}`);
    set({ notices: data });
  },

  fetchMyVehicles: async () => {
    const data = await api<VehicleRequest[]>(`/api/oa/vehicle-requests${qs({ applicant: CURRENT_USER_ID })}`);
    set({ myVehicles: data });
  },

  createLeave: async (data) => {
    await api('/api/hr/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, employee_id: CURRENT_USER_ID }),
    });
    await get().fetchMyLeaves();
  },

  createExpense: async (data) => {
    await api('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, submitter: CURRENT_USER_NAME, status: 'submitted', submit_date: new Date().toISOString().slice(0, 10) }),
    });
    await get().fetchMyExpenses();
  },

  parseReceipt: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/finance/expenses/parse-receipt', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<ReceiptParseResult>;
  },

  createVehicle: async (data) => {
    await api('/api/oa/vehicle-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, applicant: CURRENT_USER_ID }),
    });
    await get().fetchMyVehicles();
  },

  approveLeave: async (id, approved) => {
    await api(`/api/hr/leaves/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: approved ? 'approved' : 'rejected', approver: CURRENT_USER_NAME }),
    });
    await get().fetchPendingApprovals();
  },

  approveExpense: async (id, approved) => {
    await api(`/api/finance/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: approved ? 'approved' : 'rejected', approver: CURRENT_USER_NAME }),
    });
    await get().fetchPendingApprovals();
  },

  approveVehicle: async (id, approved) => {
    await api(`/api/oa/vehicle-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: approved ? 'approved' : 'rejected', approver: CURRENT_USER_NAME }),
    });
    await get().fetchPendingApprovals();
  },

  markNoticeRead: async (id) => {
    await api(`/api/oa/notices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    });
    await get().fetchNotices();
  },

  clockIn: async () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().slice(0, 10);
    const existing = get().myAttendance.find((a) => a.date === today);
    if (existing) {
      // Clock out — no PATCH endpoint for attendance, skip for demo
      return;
    }
    await api('/api/hr/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: CURRENT_USER_ID,
        date: today,
        check_in: time,
        status: now.getHours() >= 9 ? 'late' : 'normal',
      }),
    });
    await get().fetchMyAttendance();
  },

  clearError: () => set({ error: null }),
}));
