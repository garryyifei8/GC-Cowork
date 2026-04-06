import { create } from 'zustand';
import type { BiddingOpportunity } from '../types';

interface BiddingState {
  opportunities: BiddingOpportunity[];
  selectedOpportunity: BiddingOpportunity | null;
  isLoading: boolean;
  error: string | null;

  fetchOpportunities: (category?: string, status?: string) => Promise<void>;
  fetchOpportunity: (id: string) => Promise<void>;
  setSelected: (opp: BiddingOpportunity | null) => void;
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

export const useBiddingStore = create<BiddingState>((set) => ({
  opportunities: [],
  selectedOpportunity: null,
  isLoading: false,
  error: null,

  fetchOpportunities: async (category?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const qs = buildQuery({ category, status });
      const res = await fetch(`${BASE}/api/bidding/opportunities${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ opportunities: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载投标数据失败',
      });
    }
  },

  fetchOpportunity: async (id: string) => {
    try {
      const res = await fetch(`${BASE}/api/bidding/opportunities/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ selectedOpportunity: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载投标详情失败' });
    }
  },

  setSelected: (opp) => set({ selectedOpportunity: opp }),
}));
