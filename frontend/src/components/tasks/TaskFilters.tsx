import React from 'react';
import { LayoutList, Columns } from 'lucide-react';
import type { TaskWithProject } from '../../types';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';

interface TaskFiltersProps {
  tasks: TaskWithProject[];
  filterStatus: string | null;
  filterPriority: string | null;
  filterProjectId: string | null;
  viewMode: 'list' | 'kanban';
  groupBy: 'none' | 'project' | 'priority';
  onFilterStatus: (value: string | null) => void;
  onFilterPriority: (value: string | null) => void;
  onFilterProjectId: (value: string | null) => void;
  onViewMode: (mode: 'list' | 'kanban') => void;
  onGroupBy: (groupBy: 'none' | 'project' | 'priority') => void;
}

const selectClass =
  'rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-3 py-2 text-sm font-medium text-light-text dark:text-dark-text cursor-pointer outline-none transition-shadow duration-100 focus:ring-2 focus:ring-primary/50 appearance-auto';

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  tasks,
  filterStatus,
  filterPriority,
  filterProjectId,
  viewMode,
  groupBy,
  onFilterStatus,
  onFilterPriority,
  onFilterProjectId,
  onViewMode,
  onGroupBy,
}) => {
  // Derive unique project names from all tasks (unfiltered)
  const uniqueProjects = React.useMemo(() => {
    const names = Array.from(new Set(tasks.map((t) => t.project_name))).sort();
    return names;
  }, [tasks]);

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 shadow-sm"
      role="toolbar"
      aria-label="任务过滤器"
    >
      {/* Status filter */}
      <select
        className={selectClass}
        value={filterStatus ?? ''}
        onChange={(e) => onFilterStatus(e.target.value || null)}
        aria-label="按状态过滤"
      >
        <option value="">全部状态</option>
        {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        className={selectClass}
        value={filterPriority ?? ''}
        onChange={(e) => onFilterPriority(e.target.value || null)}
        aria-label="按优先级过滤"
      >
        <option value="">全部优先级</option>
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}优先级</option>
        ))}
      </select>

      {/* Project filter */}
      <select
        className={selectClass}
        value={filterProjectId ?? ''}
        onChange={(e) => onFilterProjectId(e.target.value || null)}
        aria-label="按项目过滤"
      >
        <option value="">全部项目</option>
        {uniqueProjects.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Spacer */}
      <div className="flex-1 min-w-2" />

      {/* Group-by (only in list view) */}
      {viewMode === 'list' && (
        <select
          className={selectClass}
          value={groupBy}
          onChange={(e) => onGroupBy(e.target.value as 'none' | 'project' | 'priority')}
          aria-label="分组方式"
        >
          <option value="none">不分组</option>
          <option value="project">按项目</option>
          <option value="priority">按优先级</option>
        </select>
      )}

      {/* View toggle */}
      <div
        className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-0.5"
        role="group"
        aria-label="视图切换"
      >
        <button
          className={[
            'inline-flex items-center justify-center px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-100',
            viewMode === 'list'
              ? 'bg-primary text-white shadow-sm'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text',
          ].join(' ')}
          onClick={() => onViewMode('list')}
          aria-label="列表视图"
          title="列表视图"
        >
          <LayoutList size={16} />
        </button>
        <button
          className={[
            'inline-flex items-center justify-center px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-100',
            viewMode === 'kanban'
              ? 'bg-primary text-white shadow-sm'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text',
          ].join(' ')}
          onClick={() => onViewMode('kanban')}
          aria-label="看板视图"
          title="看板视图"
        >
          <Columns size={16} />
        </button>
      </div>
    </div>
  );
};
