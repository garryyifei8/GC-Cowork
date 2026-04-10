import { create } from 'zustand';
import { apiFetch } from '../services/api';
import type { SupervisionRecord } from '../types';

interface SupervisionSummary {
  total: number;
  issues_open: number;
  inspections_this_month: number;
}

interface SupervisionState {
  records: SupervisionRecord[];
  summary: SupervisionSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchRecords: (projectId?: string, recordType?: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  createRecord: (data: Partial<SupervisionRecord>) => Promise<void>;
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

export const useSupervisionStore = create<SupervisionState>((set) => ({
  records: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchRecords: async (projectId?: string, recordType?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ project_id: projectId, record_type: recordType });
      const res = await apiFetch(`${BASE}/api/supervision/records${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ records: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载监理数据失败',
      });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await apiFetch(`${BASE}/api/supervision/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ summary: data });
    } catch (err) {
      console.error('Failed to fetch supervision summary:', err);
    }
  },

  createRecord: async (data: Partial<SupervisionRecord>) => {
    try {
      const res = await apiFetch(`${BASE}/api/supervision/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created: SupervisionRecord = await res.json();
      set((state) => ({ records: [created, ...state.records] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建记录失败' });
    }
  },
}));
