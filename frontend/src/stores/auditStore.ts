import { create } from 'zustand';
import type { AuditReport } from '../types';

interface AuditSummary {
  total: number;
  in_progress: number;
  findings_count: number;
  compliance_rate: number;
}

interface AuditState {
  reports: AuditReport[];
  summary: AuditSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchReports: (status?: string, auditType?: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
}

const BASE = '';

function buildQuery(params: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const useAuditStore = create<AuditState>((set) => ({
  reports: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchReports: async (status?: string, auditType?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ status, audit_type: auditType });
      const res = await fetch(`${BASE}/api/audit/reports${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ reports: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载审计数据失败',
      });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await fetch(`${BASE}/api/audit/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ summary: data });
    } catch (err) {
      console.error('Failed to fetch audit summary:', err);
    }
  },
}));
