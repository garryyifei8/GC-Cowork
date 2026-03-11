import React from 'react';
import type { TaskWithProject } from '../../types';

interface TaskStatsBarProps {
  tasks: TaskWithProject[];
}

export const TaskStatsBar: React.FC<TaskStatsBarProps> = ({ tasks }) => {
  const today = new Date().toISOString().slice(0, 10);

  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue = tasks.filter(
    (t) => !!t.due_date && t.due_date < today && t.status !== 'done'
  ).length;
  const done = tasks.filter((t) => t.status === 'done').length;

  const stats = [
    { label: '全部任务', value: total, valueClass: 'text-light-text dark:text-dark-text' },
    { label: '进行中', value: inProgress, valueClass: 'text-info' },
    { label: '已逾期', value: overdue, valueClass: 'text-danger' },
    { label: '已完成', value: done, valueClass: 'text-success' },
  ];

  return (
    <div className="flex items-center gap-2.5 flex-wrap" role="region" aria-label="任务统计">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-[0.8125rem] font-semibold whitespace-nowrap select-none"
        >
          <span className={`text-base font-bold ${stat.valueClass}`}>{stat.value}</span>
          <span className="font-medium opacity-85 text-light-text-secondary dark:text-dark-text-secondary">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};
