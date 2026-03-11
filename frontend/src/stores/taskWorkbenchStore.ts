import { create } from 'zustand';
import type { TaskWithProject } from '../types';
import { taskService, projectService } from '../services/api';

interface TaskWorkbenchState {
  tasks: TaskWithProject[];
  isLoading: boolean;
  error: string | null;
  filterStatus: string | null;
  filterPriority: string | null;
  filterProjectId: string | null;
  viewMode: 'list' | 'kanban';
  groupBy: 'none' | 'project' | 'priority';
  fetchTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  updateTaskPriority: (taskId: string, priority: string) => Promise<void>;
  setFilterStatus: (value: string | null) => void;
  setFilterPriority: (value: string | null) => void;
  setFilterProjectId: (value: string | null) => void;
  setViewMode: (mode: 'list' | 'kanban') => void;
  setGroupBy: (groupBy: 'none' | 'project' | 'priority') => void;
}

export const useTaskWorkbenchStore = create<TaskWorkbenchState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filterStatus: null,
  filterPriority: null,
  filterProjectId: null,
  viewMode: 'list',
  groupBy: 'none',

  fetchTasks: async () => {
    const { filterStatus, filterPriority } = get();
    set({ isLoading: true, error: null });
    try {
      const params: { status?: string; priority?: string } = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const tasks = await taskService.listAll(params);
      set({ tasks, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载任务失败',
      });
    }
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    try {
      await projectService.updateTask(taskId, { status });
      await get().fetchTasks();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新任务状态失败' });
    }
  },

  updateTaskPriority: async (taskId: string, priority: string) => {
    try {
      await projectService.updateTask(taskId, { priority });
      await get().fetchTasks();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新任务优先级失败' });
    }
  },

  setFilterStatus: (value: string | null) => set({ filterStatus: value }),
  setFilterPriority: (value: string | null) => set({ filterPriority: value }),
  setFilterProjectId: (value: string | null) => set({ filterProjectId: value }),
  setViewMode: (mode: 'list' | 'kanban') => set({ viewMode: mode }),
  setGroupBy: (groupBy: 'none' | 'project' | 'priority') => set({ groupBy }),
}));
