import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { TaskWithProject } from '../../types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';
import { TaskCard } from './TaskCard';

interface TaskListViewProps {
  tasks: TaskWithProject[];
  groupBy: 'none' | 'project' | 'priority';
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
}

interface GroupSectionProps {
  label: string;
  count: number;
  accent?: string;
  tasks: TaskWithProject[];
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  label,
  count,
  accent,
  tasks,
  onStatusChange,
  onPriorityChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
      <button
        className="flex items-center gap-2 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none cursor-pointer text-sm font-semibold text-light-text dark:text-dark-text text-left transition-colors duration-100 hover:bg-slate-100 dark:hover:bg-slate-700/50"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="flex items-center text-light-text-secondary dark:text-dark-text-secondary">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
        {accent && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: accent }}
            aria-hidden="true"
          />
        )}
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold bg-white dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary border border-light-border dark:border-dark-border px-2 py-px rounded-full">
          {count}
        </span>
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-2 p-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-2">
              暂无任务
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  groupBy,
  onStatusChange,
  onPriorityChange,
}) => {
  if (groupBy === 'none') {
    return (
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-12 text-sm">
            暂无符合条件的任务
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
            />
          ))
        )}
      </div>
    );
  }

  if (groupBy === 'project') {
    const projectMap = new Map<string, TaskWithProject[]>();
    for (const task of tasks) {
      const existing = projectMap.get(task.project_name) ?? [];
      projectMap.set(task.project_name, [...existing, task]);
    }
    const sortedProjects = Array.from(projectMap.keys()).sort();

    return (
      <div className="flex flex-col gap-2">
        {sortedProjects.length === 0 ? (
          <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-12 text-sm">
            暂无符合条件的任务
          </div>
        ) : (
          sortedProjects.map((projectName) => {
            const groupTasks = projectMap.get(projectName) ?? [];
            return (
              <GroupSection
                key={projectName}
                label={projectName}
                count={groupTasks.length}
                tasks={groupTasks}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
              />
            );
          })
        )}
      </div>
    );
  }

  // groupBy === 'priority'
  const PRIORITY_ORDER = ['high', 'medium', 'low'];
  const priorityMap = new Map<string, TaskWithProject[]>();
  for (const task of tasks) {
    const existing = priorityMap.get(task.priority) ?? [];
    priorityMap.set(task.priority, [...existing, task]);
  }

  return (
    <div className="flex flex-col gap-2">
      {PRIORITY_ORDER.filter((p) => priorityMap.has(p)).length === 0 && tasks.length === 0 ? (
        <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-12 text-sm">
          暂无符合条件的任务
        </div>
      ) : (
        PRIORITY_ORDER.map((priority) => {
          const groupTasks = priorityMap.get(priority);
          if (!groupTasks || groupTasks.length === 0) return null;
          return (
            <GroupSection
              key={priority}
              label={`${PRIORITY_LABELS[priority] ?? priority}优先级`}
              count={groupTasks.length}
              accent={PRIORITY_COLORS[priority]}
              tasks={groupTasks}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
            />
          );
        })
      )}
    </div>
  );
};
