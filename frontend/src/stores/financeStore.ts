import { create } from 'zustand';
import type {
  ExpenseReport,
  BudgetLine,
  FinanceInvoice,
  FinanceSummary,
} from '../types';

interface FinanceInsight {
  title: string;
  description: string;
  severity: string;
  category: string;
}

interface FinanceState {
  expenses: ExpenseReport[];
  budgets: BudgetLine[];
  invoices: FinanceInvoice[];
  summary: FinanceSummary | null;
  insights: FinanceInsight[];
  isLoading: boolean;
  error: string | null;

  fetchExpenses: (status?: string, projectId?: string, submitter?: string) => Promise<void>;
  fetchBudgets: (projectId?: string, fiscalYear?: number) => Promise<void>;
  fetchInvoices: (status?: string, projectId?: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  approveExpense: (id: string, approved: boolean) => Promise<void>;
}

const BASE = '';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const useFinanceStore = create<FinanceState>((set) => ({
  expenses: [],
  budgets: [],
  invoices: [],
  summary: null,
  insights: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (status?: string, projectId?: string, submitter?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ status, project_id: projectId, submitter });
      const res = await fetch(`${BASE}/api/finance/expenses${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ expenses: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载报销数据失败',
      });
    }
  },

  fetchBudgets: async (projectId?: string, fiscalYear?: number) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ project_id: projectId, fiscal_year: fiscalYear });
      const res = await fetch(`${BASE}/api/finance/budgets${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ budgets: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载预算数据失败',
      });
    }
  },

  fetchInvoices: async (status?: string, projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ status, project_id: projectId });
      const res = await fetch(`${BASE}/api/finance/invoices${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ invoices: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载发票数据失败',
      });
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BASE}/api/finance/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ summary: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载财务摘要失败',
      });
    }
  },

  fetchInsights: async () => {
    try {
      const res = await fetch(`${BASE}/api/finance/insights`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ insights: data.insights ?? [] });
    } catch (err) {
      console.error('Failed to fetch finance insights:', err);
    }
  },

  approveExpense: async (id: string, approved: boolean) => {
    try {
      const res = await fetch(`${BASE}/api/finance/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: approved ? 'approved' : 'rejected' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: ExpenseReport = await res.json();
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '审批操作失败' });
    }
  },
}));
