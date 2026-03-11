import { create } from 'zustand';
import type { Project, ProjectDetail, ProjectTask, ActivityEvent, ViewType } from '../types';
import { projectService } from '../services/api';

interface ProjectState {
  projects: Project[];
  projectDetail: ProjectDetail | null;
  tasks: Record<string, ProjectTask[]>;
  activities: Record<string, ActivityEvent[]>;
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  viewType: ViewType;

  fetchProjects: () => Promise<void>;
  fetchProjectDetail: (id: string) => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  fetchActivities: (projectId: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  transitionProject: (id: string, targetStage: string) => Promise<void>;
  createTask: (projectId: string, data: { name: string; assignee?: string; priority?: string; due_date?: string }) => Promise<void>;
  setViewType: (view: ViewType) => void;
  selectProject: (id: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, _get) => ({
  projects: [],
  projectDetail: null,
  tasks: {},
  activities: {},
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

  fetchProjectDetail: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const detail = await projectService.get(id);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [id]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载项目详情失败',
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

  fetchActivities: async (projectId: string) => {
    try {
      const activities = await projectService.getActivities(projectId);
      set((state) => ({
        activities: { ...state.activities, [projectId]: activities },
      }));
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  },

  transitionProject: async (id: string, targetStage: string) => {
    try {
      const updated = await projectService.transition(id, targetStage);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        projectDetail: state.projectDetail?.id === id
          ? { ...state.projectDetail, ...updated }
          : state.projectDetail,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '阶段转换失败',
      });
    }
  },

  createTask: async (projectId: string, data) => {
    try {
      const created = await projectService.createTask(projectId, data);
      set((state) => ({
        tasks: {
          ...state.tasks,
          [projectId]: [...(state.tasks[projectId] || []), created],
        },
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '创建任务失败',
      });
    }
  },

  setViewType: (view: ViewType) => set({ viewType: view }),
  selectProject: (id: string | null) => set({ selectedProjectId: id }),
  clearError: () => set({ error: null }),
}));
