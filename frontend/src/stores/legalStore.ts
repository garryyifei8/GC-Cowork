import { create } from 'zustand';
import { apiFetch } from '../services/api';
import type { LegalContract } from '../types';

interface LegalSummary {
  total: number;
  active: number;
  expiring_soon: number;
  total_amount: number;
}

interface LegalState {
  contracts: LegalContract[];
  summary: LegalSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchContracts: (status?: string, contractType?: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  updateContract: (id: string, data: Partial<LegalContract>) => Promise<void>;
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

export const useLegalStore = create<LegalState>((set) => ({
  contracts: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchContracts: async (status?: string, contractType?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ status, contract_type: contractType });
      const res = await apiFetch(`${BASE}/api/legal/contracts${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ contracts: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载合同数据失败',
      });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await apiFetch(`${BASE}/api/legal/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ summary: data });
    } catch (err) {
      console.error('Failed to fetch legal summary:', err);
    }
  },

  updateContract: async (id: string, data: Partial<LegalContract>) => {
    try {
      const res = await apiFetch(`${BASE}/api/legal/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: LegalContract = await res.json();
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新合同失败' });
    }
  },
}));
