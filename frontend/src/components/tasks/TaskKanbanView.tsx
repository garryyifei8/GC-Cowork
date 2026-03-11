import React from 'react';
import type { TaskWithProject } from '../../types';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/constants';
import { TaskCard } from './TaskCard';

const KANBAN_COLUMNS: Array<{ key: string }> = [
  { key: 'todo' },
  { key: 'in_progress' },
  { key: 'review' },
  { key: 'done' },
  { key: 'blocked' },
];

interface TaskKanbanViewProps {
  tasks: TaskWithProject[];
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  onStatusChange,
  onPriorityChange,
}) => {
  return (
    <div
      className="flex gap-3.5 overflow-x-auto pb-2 items-start scrollbar-thin"
      role="region"
      aria-label="任务看板"
    >
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        const color = TASK_STATUS_COLORS[col.key] ?? '#676879';
        const label = TASK_STATUS_LABELS[col.key] ?? col.key;

        return (
          <div
            key={col.key}
            className="min-w-[260px] max-w-[300px] flex-[1_0_260px] bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden flex flex-col"
          >
            {/* Column header with top color accent via inline borderTopColor */}
            <div
              className="flex items-center gap-1.5 px-3.5 pt-3 pb-2.5 border-t-[3px] border-b border-b-light-border dark:border-b-dark-border bg-light-surface dark:bg-dark-surface"
              style={{ borderTopColor: color }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: color }}
                aria-hidden="true"
              />
              <span className="flex-1 text-[0.8125rem] font-bold text-light-text dark:text-dark-text">
                {label}
              </span>
              <span
                className="text-[0.72rem] font-bold px-2 py-0.5 rounded-full"
                style={{ background: color + '22', color }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Column body */}
            <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[calc(100vh-300px)]">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center text-light-text-secondary dark:text-dark-text-secondary text-[0.8rem] py-4 px-2 border border-dashed border-light-border dark:border-dark-border rounded-lg">
                  暂无任务
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
