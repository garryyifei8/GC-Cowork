import type { ChatResponse, Project, ProjectTask, BiddingOpportunity } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const chatService = {
  sendMessage: (message: string, context?: Array<{ role: string; content: string }>) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

export const projectService = {
  list: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Project[]>(`/projects${params}`);
  },
  get: (id: string) => request<Project & { tasks: ProjectTask[] }>(`/projects/${id}`),
  create: (data: { name: string; project_type?: string; budget_display?: string }) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  transition: (id: string, targetStage: string) =>
    request<Project>(`/projects/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ target_stage: targetStage }),
    }),
  listTasks: (projectId: string) =>
    request<ProjectTask[]>(`/projects/${projectId}/tasks`),
  createTask: (projectId: string, data: { name: string; assignee?: string; priority?: string; due_date?: string }) =>
    request<ProjectTask>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (taskId: string, data: Partial<ProjectTask>) =>
    request<ProjectTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const biddingService = {
  list: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    const qs = params.toString();
    return request<BiddingOpportunity[]>(`/bidding/opportunities${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<BiddingOpportunity>(`/bidding/opportunities/${id}`),
};
