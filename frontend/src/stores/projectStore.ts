import { create } from 'zustand';
import type { Project, ProjectDetail, ProjectTask, ActivityEvent, ViewType } from '../types';
import { projectService } from '../services/api';
import { useToastStore } from './toastStore';

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
  createTask: (
    projectId: string,
    data: { name: string; assignee?: string; priority?: string; due_date?: string }
  ) => Promise<void>;
  deleteProject: (id: string, navigate: (path: string) => void) => Promise<void>;
  createMilestone: (
    projectId: string,
    data: { name: string; date?: string; status?: string }
  ) => Promise<void>;
  updateMilestone: (
    projectId: string,
    milestoneId: string,
    data: Record<string, unknown>
  ) => Promise<void>;
  deleteMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  createRisk: (
    projectId: string,
    data: { description: string; level?: string; mitigation?: string }
  ) => Promise<void>;
  updateRisk: (projectId: string, riskId: string, data: Record<string, unknown>) => Promise<void>;
  deleteRisk: (projectId: string, riskId: string) => Promise<void>;
  addTeamMember: (projectId: string, name: string) => Promise<void>;
  removeTeamMember: (projectId: string, name: string) => Promise<void>;
  deleteTask: (taskId: string, projectId: string) => Promise<void>;
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
          newTasks[projectId] = newTasks[projectId].map((t) => (t.id === taskId ? updated : t));
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
    const toast = useToastStore.getState().addToast;
    try {
      const updated = await projectService.transition(id, targetStage);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        projectDetail:
          state.projectDetail?.id === id
            ? { ...state.projectDetail, ...updated }
            : state.projectDetail,
      }));
      toast(`阶段已切换至 ${targetStage}`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '阶段转换失败';
      set({ error: msg });
      toast(msg, 'error');
    }
  },

  createTask: async (projectId: string, data) => {
    const toast = useToastStore.getState().addToast;
    try {
      const created = await projectService.createTask(projectId, data);
      set((state) => ({
        tasks: {
          ...state.tasks,
          [projectId]: [...(state.tasks[projectId] || []), created],
        },
      }));
      toast(`任务「${data.name}」已创建`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建任务失败';
      set({ error: msg });
      toast(msg, 'error');
    }
  },

  deleteProject: async (id: string, navigate: (path: string) => void) => {
    const toast = useToastStore.getState().addToast;
    set({ isLoading: true, error: null });
    try {
      await projectService.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        projectDetail: state.projectDetail?.id === id ? null : state.projectDetail,
        isLoading: false,
      }));
      toast('项目已删除', 'success');
      navigate('/projects');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除项目失败';
      set({ isLoading: false, error: msg });
      toast(msg, 'error');
    }
  },

  createMilestone: async (projectId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.createMilestone(projectId, data);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '创建里程碑失败' });
    }
  },

  updateMilestone: async (projectId: string, milestoneId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateMilestone(projectId, milestoneId, data);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '更新里程碑失败' });
    }
  },

  deleteMilestone: async (projectId: string, milestoneId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteMilestone(projectId, milestoneId);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '删除里程碑失败' });
    }
  },

  createRisk: async (projectId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.createRisk(projectId, data);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '创建风险失败' });
    }
  },

  updateRisk: async (projectId: string, riskId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.updateRisk(projectId, riskId, data);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '更新风险失败' });
    }
  },

  deleteRisk: async (projectId: string, riskId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteRisk(projectId, riskId);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '删除风险失败' });
    }
  },

  addTeamMember: async (projectId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.addTeamMember(projectId, name);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '添加团队成员失败' });
    }
  },

  removeTeamMember: async (projectId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.removeTeamMember(projectId, name);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '移除团队成员失败' });
    }
  },

  deleteTask: async (taskId: string, projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteTask(taskId);
      const detail = await projectService.get(projectId);
      set((state) => ({
        projectDetail: detail,
        tasks: { ...state.tasks, [projectId]: detail.tasks },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '删除任务失败' });
    }
  },

  setViewType: (view: ViewType) => set({ viewType: view }),
  selectProject: (id: string | null) => set({ selectedProjectId: id }),
  clearError: () => set({ error: null }),
}));
