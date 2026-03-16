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
  groupBy: 'date' | 'none' | 'project' | 'priority';
  searchQuery: string;
  projects: Array<{ id: string; name: string }>;
  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  createTask: (
    projectId: string,
    data: {
      name: string;
      assignee?: string;
      priority?: string;
      due_date?: string;
      description?: string;
    }
  ) => Promise<void>;
  updateTask: (taskId: string, data: Record<string, unknown>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  updateTaskPriority: (taskId: string, priority: string) => Promise<void>;
  setFilterStatus: (value: string | null) => void;
  setFilterPriority: (value: string | null) => void;
  setFilterProjectId: (value: string | null) => void;
  setViewMode: (mode: 'list' | 'kanban') => void;
  setGroupBy: (groupBy: 'date' | 'none' | 'project' | 'priority') => void;
  setSearchQuery: (query: string) => void;
}

export const useTaskWorkbenchStore = create<TaskWorkbenchState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filterStatus: null,
  filterPriority: null,
  filterProjectId: null,
  viewMode: 'list',
  groupBy: 'date',
  searchQuery: '',
  projects: [],

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

  fetchProjects: async () => {
    try {
      const projects = await projectService.list();
      set({ projects: projects.map((p: any) => ({ id: p.id, name: p.name })) });
    } catch {
      // Silently fail — project list is optional for task creation
    }
  },

  createTask: async (projectId, data) => {
    try {
      await projectService.createTask(projectId, data);
      await get().fetchTasks();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建任务失败' });
      throw err;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      await projectService.updateTask(taskId, data as any);
      await get().fetchTasks();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新任务失败' });
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    try {
      // Optimistic removal for snappy UX
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      // Best-effort DELETE — API may not support it; swallow gracefully
      try {
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      } catch {
        // If DELETE fails, re-fetch to restore correct state
        await get().fetchTasks();
        return;
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除任务失败' });
      throw err;
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
  setGroupBy: (groupBy: 'date' | 'none' | 'project' | 'priority') => set({ groupBy }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));
