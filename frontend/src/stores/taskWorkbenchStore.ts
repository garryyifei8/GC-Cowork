import { create } from 'zustand';
import type { TaskWithProject } from '../types';
import { taskService, projectService, apiFetch } from '../services/api';
import { useToastStore } from './toastStore';

export type SortField = 'name' | 'status' | 'priority' | 'due_date' | 'assignee';
export type SortDir = 'asc' | 'desc';

interface TaskWorkbenchState {
  tasks: TaskWithProject[];
  isLoading: boolean;
  error: string | null;
  filterStatus: string | null;
  filterPriority: string | null;
  filterProjectId: string | null;
  viewMode: 'list' | 'kanban' | 'calendar';
  groupBy: 'date' | 'none' | 'project' | 'priority';
  searchQuery: string;
  sortBy: SortField | null;
  sortDir: SortDir;
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
  setViewMode: (mode: 'list' | 'kanban' | 'calendar') => void;
  setGroupBy: (groupBy: 'date' | 'none' | 'project' | 'priority') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (field: SortField | null) => void;
  toggleSortDir: () => void;
  selectedTaskIds: Set<string>;
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  batchUpdateStatus: (status: string) => Promise<void>;
  batchUpdatePriority: (priority: string) => Promise<void>;
  batchDelete: () => Promise<void>;
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
  sortBy: null,
  sortDir: 'asc',
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
    const toast = useToastStore.getState().addToast;
    try {
      await projectService.createTask(projectId, data);
      await get().fetchTasks();
      toast(`任务「${data.name}」已创建`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建任务失败';
      set({ error: msg });
      toast(msg, 'error');
      throw err;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      await projectService.updateTask(taskId, data as any);
      await get().fetchTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '更新任务失败';
      set({ error: msg });
      useToastStore.getState().addToast(msg, 'error');
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    const toast = useToastStore.getState().addToast;
    try {
      // Optimistic removal for snappy UX
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      try {
        await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      } catch {
        await get().fetchTasks();
        return;
      }
      toast('任务已删除', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除任务失败';
      set({ error: msg });
      toast(msg, 'error');
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

  setFilterStatus: (value: string | null) => {
    set({ filterStatus: value });
    // Re-fetch with new server-side filter
    setTimeout(() => get().fetchTasks(), 0);
  },
  setFilterPriority: (value: string | null) => {
    set({ filterPriority: value });
    setTimeout(() => get().fetchTasks(), 0);
  },
  setFilterProjectId: (value: string | null) => set({ filterProjectId: value }),
  setViewMode: (mode: 'list' | 'kanban' | 'calendar') => set({ viewMode: mode }),
  setGroupBy: (groupBy: 'date' | 'none' | 'project' | 'priority') => set({ groupBy }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSortBy: (field: SortField | null) => set({ sortBy: field }),
  toggleSortDir: () => set((state) => ({ sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' })),

  selectedTaskIds: new Set<string>(),
  toggleTaskSelection: (taskId: string) =>
    set((state) => {
      const next = new Set(state.selectedTaskIds);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return { selectedTaskIds: next };
    }),
  selectAllTasks: (taskIds: string[]) => set({ selectedTaskIds: new Set(taskIds) }),
  clearSelection: () => set({ selectedTaskIds: new Set<string>() }),

  batchUpdateStatus: async (status: string) => {
    const { selectedTaskIds, fetchTasks } = get();
    const toast = useToastStore.getState().addToast;
    try {
      await Promise.all(
        Array.from(selectedTaskIds).map((id) => projectService.updateTask(id, { status }))
      );
      toast(`已批量更新 ${selectedTaskIds.size} 个任务状态`, 'success');
      set({ selectedTaskIds: new Set<string>() });
      await fetchTasks();
    } catch {
      toast('批量更新状态失败', 'error');
    }
  },

  batchUpdatePriority: async (priority: string) => {
    const { selectedTaskIds, fetchTasks } = get();
    const toast = useToastStore.getState().addToast;
    try {
      await Promise.all(
        Array.from(selectedTaskIds).map((id) => projectService.updateTask(id, { priority }))
      );
      toast(`已批量更新 ${selectedTaskIds.size} 个任务优先级`, 'success');
      set({ selectedTaskIds: new Set<string>() });
      await fetchTasks();
    } catch {
      toast('批量更新优先级失败', 'error');
    }
  },

  batchDelete: async () => {
    const { selectedTaskIds, fetchTasks } = get();
    const toast = useToastStore.getState().addToast;
    try {
      await Promise.all(
        Array.from(selectedTaskIds).map((id) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }))
      );
      toast(`已批量删除 ${selectedTaskIds.size} 个任务`, 'success');
      set({ selectedTaskIds: new Set<string>() });
      await fetchTasks();
    } catch {
      toast('批量删除失败', 'error');
    }
  },
}));
