import { create } from 'zustand';
import type { DashboardMetrics, ActivityEvent } from '../types';
import { dashboardService, activityService } from '../services/api';

interface DashboardState {
  metrics: DashboardMetrics | null;
  recentActivities: ActivityEvent[];
  isLoading: boolean;
  error: string | null;

  fetchMetrics: () => Promise<void>;
  fetchRecentActivities: (limit?: number) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  recentActivities: [],
  isLoading: false,
  error: null,

  fetchMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const metrics = await dashboardService.getMetrics();
      set({ metrics, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载仪表盘数据失败',
      });
    }
  },

  fetchRecentActivities: async (limit = 10) => {
    try {
      const recentActivities = await activityService.getRecent(limit);
      set({ recentActivities });
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
