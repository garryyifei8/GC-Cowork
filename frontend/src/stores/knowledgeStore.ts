import { create } from 'zustand';
import { apiFetch } from '../services/api';

interface KnowledgeDoc {
  id: string;
  title: string;
  doc_type: string;
  project_id: string | null;
  content_summary: string;
  version: string;
  author: string;
  status: string;
}

interface SearchResult {
  id: string;
  title: string;
  doc_type: string;
  content_summary: string;
  author: string;
  status: string;
  score: number;
}

interface KnowledgeState {
  documents: KnowledgeDoc[];
  searchResults: SearchResult[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  fetchDocuments: (docType?: string, status?: string) => Promise<void>;
  search: (query: string, category?: string) => Promise<void>;
  clearSearch: () => void;
}

const BASE = '';

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  documents: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,

  fetchDocuments: async (docType?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (docType) params.set('doc_type', docType);
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await apiFetch(`${BASE}/api/knowledge/documents${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ documents: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载知识库文档失败',
      });
    }
  },

  search: async (query: string, category?: string) => {
    set({ isSearching: true, error: null });
    try {
      const res = await apiFetch(`${BASE}/api/knowledge/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category, top_k: 20 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ searchResults: data, isSearching: false });
    } catch (err) {
      set({
        isSearching: false,
        error: err instanceof Error ? err.message : '搜索失败',
      });
    }
  },

  clearSearch: () => set({ searchResults: [] }),
}));
