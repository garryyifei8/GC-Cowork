import React from 'react';
import type { Project } from '../../types';

const MONTH_WIDTH = 120;

function getMonthsBetween(start: Date, end: Date): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push({
      key: `${current.getFullYear()}-${current.getMonth()}`,
      label: `${current.getFullYear()}年${current.getMonth() + 1}月`,
    });
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#00C875';
    case 'risk': return '#E2445C';
    case 'planning': return '#0086C0';
    case 'completed': return '#676879';
    default: return '#6BBF59';
  }
}

interface GanttChartProps {
  projects: Project[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ projects }) => {
  if (projects.length === 0) return null;

  // Calculate time range
  const now = new Date();
  // Start from 3 months ago
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  // End at max due date + 1 month, or 6 months from now if no due dates
  const dueDates = projects
    .map((p) => p.due_date ? new Date(p.due_date) : null)
    .filter((d): d is Date => d !== null);

  const maxDue = dueDates.length > 0
    ? new Date(Math.max(...dueDates.map((d) => d.getTime())))
    : new Date(now.getFullYear(), now.getMonth() + 6, 1);

  const rangeEnd = new Date(maxDue.getFullYear(), maxDue.getMonth() + 2, 1);

  const months = getMonthsBetween(rangeStart, rangeEnd);
  const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const totalWidth = months.length * MONTH_WIDTH;

  // Calculate bar position for a project
  const getBarStyle = (project: Project) => {
    const endDate = project.due_date
      ? new Date(project.due_date)
      : new Date(now.getFullYear(), now.getMonth() + 3, 1);

    // Estimate start date based on progress
    // If 68% done and due in X days from range start, start was roughly at (now - progress% * total_duration)
    const totalDuration = 180; // assume ~6 months duration as default
    const elapsedDays = (project.progress_pct / 100) * totalDuration;
    const startDate = new Date(now.getTime() - elapsedDays * 24 * 60 * 60 * 1000);

    const startOffset = Math.max(0, (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const endOffset = Math.min(totalDays, (endDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const barWidth = Math.max(30, endOffset - startOffset); // minimum 30px width

    const leftPct = (startOffset / totalDays) * 100;
    const widthPct = (barWidth / totalDays) * 100;

    return {
      left: `${leftPct}%`,
      width: `${widthPct}%`,
      backgroundColor: getStatusColor(project.status),
    };
  };

  // Today marker position
  const todayOffset = (now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const todayPct = (todayOffset / totalDays) * 100;

  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl transition-colors duration-200 overflow-x-auto p-0">
      {/* Header */}
      <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border sticky top-0 z-10">
        <div className="w-48 shrink-0 px-4 py-3 text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary border-r border-light-border dark:border-dark-border">
          项目
        </div>
        <div className="flex overflow-x-auto" style={{ width: totalWidth }}>
          {months.map((m) => (
            <div
              key={m.key}
              className="px-2 py-3 text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary text-center border-r border-light-border dark:border-dark-border shrink-0"
              style={{ width: MONTH_WIDTH }}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-x-auto">
        {projects.map((project) => {
          const barStyle = getBarStyle(project);
          return (
            <div
              key={project.id}
              className="flex items-center border-b border-light-border/50 dark:border-dark-border/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 last:border-b-0"
            >
              <div className="w-48 shrink-0 px-4 py-3 border-r border-light-border dark:border-dark-border flex flex-col justify-center gap-0.5">
                <span className="text-sm font-medium truncate">{project.name}</span>
                <span className="text-[11px] text-light-text-secondary dark:text-dark-text-secondary">{project.status_label}</span>
              </div>
              <div className="flex-1 relative h-10 shrink-0" style={{ width: totalWidth }}>
                {/* Today marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-danger z-10 opacity-60"
                  style={{ left: `${todayPct}%`, borderLeft: '2px dashed' }}
                />
                {/* Bar */}
                <div
                  className="absolute top-1 h-8 rounded-md flex items-center justify-end px-2 opacity-90 hover:opacity-100 transition-opacity min-w-[40px]"
                  style={barStyle}
                >
                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                    {project.progress_pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
