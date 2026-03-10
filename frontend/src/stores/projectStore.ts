import { create } from 'zustand';
import type { Project, ProjectTask, ViewType } from '../types';
import { projectService } from '../services/api';

interface ProjectState {
  projects: Project[];
  tasks: Record<string, ProjectTask[]>;
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  viewType: ViewType;

  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  setViewType: (view: ViewType) => void;
  selectProject: (id: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, _get) => ({
  projects: [],
  tasks: {},
  selectedProjectId: null,
  isLoading: false,
  error: null,
  viewType: 'table',

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.list();
      set({ projects, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载项目失败',
      });
    }
  },

  fetchTasks: async (projectId: string) => {
    try {
      const tasks = await projectService.listTasks(projectId);
      set((state) => ({
        tasks: { ...state.tasks, [projectId]: tasks },
      }));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    try {
      const updated = await projectService.update(id, updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '更新项目失败',
      });
    }
  },

  updateTask: async (taskId: string, updates: Partial<ProjectTask>) => {
    try {
      const updated = await projectService.updateTask(taskId, updates);
      set((state) => {
        const newTasks = { ...state.tasks };
        for (const projectId of Object.keys(newTasks)) {
          newTasks[projectId] = newTasks[projectId].map((t) =>
            t.id === taskId ? updated : t
          );
        }
        return { tasks: newTasks };
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  },

  setViewType: (view: ViewType) => set({ viewType: view }),
  selectProject: (id: string | null) => set({ selectedProjectId: id }),
  clearError: () => set({ error: null }),
}));
