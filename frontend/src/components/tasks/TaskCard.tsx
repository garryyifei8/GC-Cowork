import React from 'react';
import type { TaskWithProject } from '../../types';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, STAGE_COLORS } from '../../utils/constants';

const STATUS_CYCLE: string[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITY_CYCLE: string[] = ['low', 'medium', 'high'];

interface TaskCardProps {
  task: TaskWithProject;
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onPriorityChange }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = !!task.due_date && task.due_date < today && task.status !== 'done';

  const statusColor = TASK_STATUS_COLORS[task.status] ?? '#676879';
  const statusLabel = TASK_STATUS_LABELS[task.status] ?? task.status;
  const priorityColor = PRIORITY_COLORS[task.priority] ?? '#676879';
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority;
  const stageColor = STAGE_COLORS[task.project_name] ?? '#676879';

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(task.id, next);
  };

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = PRIORITY_CYCLE.indexOf(task.priority);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    onPriorityChange(task.id, next);
  };

  return (
    <div
      className={[
        'bg-light-surface dark:bg-dark-surface border rounded-xl p-3 flex flex-col gap-1.5',
        'transition-all duration-150 cursor-default hover:shadow-md hover:-translate-y-px',
        'border-l-[3px]',
        isOverdue
          ? 'bg-danger/[0.04] border-danger/35 border-l-danger'
          : 'border-light-border dark:border-dark-border',
      ].join(' ')}
      style={isOverdue ? undefined : { borderLeftColor: priorityColor }}
    >
      {/* Line 1: task name + status badge */}
      <div className="flex items-start gap-2">
        <span className="flex-1 text-sm font-semibold text-light-text dark:text-dark-text leading-snug">
          {task.name}
        </span>
        <button
          className="flex-shrink-0 text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full cursor-pointer whitespace-nowrap transition-opacity duration-100 hover:opacity-75 hover:scale-[0.97]"
          style={{
            background: statusColor + '22',
            color: statusColor,
            border: `1px solid ${statusColor}44`,
          }}
          onClick={cycleStatus}
          title="点击切换状态"
          aria-label={`状态: ${statusLabel}, 点击切换`}
        >
          {statusLabel}
        </button>
      </div>

      {/* Line 2: project name with stage color dot */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: stageColor }}
          aria-hidden="true"
        />
        <span className="text-[0.775rem] font-medium text-light-text-secondary dark:text-dark-text-secondary">
          {task.project_name}
        </span>
      </div>

      {/* Line 3: due date + assignee + priority */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {task.due_date && (
            <span
              className={
                isOverdue
                  ? 'text-xs text-danger font-semibold'
                  : 'text-xs text-light-text-secondary dark:text-dark-text-secondary'
              }
            >
              {isOverdue ? '逾期: ' : ''}{task.due_date}
            </span>
          )}
          {task.assignee && (
            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary bg-slate-100 dark:bg-slate-700 px-1.5 py-px rounded-full">
              {task.assignee}
            </span>
          )}
        </div>
        <button
          className="flex-shrink-0 text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full cursor-pointer whitespace-nowrap transition-opacity duration-100 hover:opacity-75 hover:scale-[0.97]"
          style={{
            background: priorityColor + '22',
            color: priorityColor,
            border: `1px solid ${priorityColor}44`,
          }}
          onClick={cyclePriority}
          title="点击切换优先级"
          aria-label={`优先级: ${priorityLabel}, 点击切换`}
        >
          {priorityLabel}
        </button>
      </div>
    </div>
  );
};
