import React, { useMemo, useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronRight, User } from 'lucide-react';
import type { TaskWithProject } from '../../types';
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/constants';

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

export interface WorkloadViewProps {
  data?: { tasks?: TaskWithProject[] };
}

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];

const OVERLOAD_THRESHOLD = 8;
const UNDERLOAD_THRESHOLD = 2;

// ---------------------------------------------------------------------------
// Assignee avatar
// ---------------------------------------------------------------------------

const AssigneeAvatar: React.FC<{ assignee: string }> = ({ assignee }) => {
  const seed = encodeURIComponent(assignee);
  const url = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`;
  return (
    <img
      src={url}
      alt={assignee}
      title={assignee}
      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"
      loading="lazy"
    />
  );
};

// ---------------------------------------------------------------------------
// Stacked bar segment
// ---------------------------------------------------------------------------

const BarSegment: React.FC<{
  status: TaskStatus;
  count: number;
  pct: number;
  onClick: () => void;
  isActive: boolean;
}> = ({ status, count, pct, onClick, isActive }) => {
  if (count === 0) return null;
  const color = TASK_STATUS_COLORS[status] ?? '#C4C4C4';
  const label = TASK_STATUS_LABELS[status] ?? status;

  return (
    <button
      className="relative flex items-center justify-center transition-all group"
      style={{
        width: `${pct}%`,
        minWidth: count > 0 ? '28px' : '0',
        backgroundColor: color,
        opacity: isActive ? 1 : 0.85,
        outline: isActive ? `2px solid ${color}` : 'none',
        outlineOffset: '2px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${label}: ${count} 个`}
      aria-pressed={isActive}
    >
      <span className="text-[11px] font-bold text-white select-none">{count}</span>
      {/* Tooltip on hover */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
        {label}: {count}
      </span>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Expanded task list for a given assignee + status
// ---------------------------------------------------------------------------

const ExpandedTaskList: React.FC<{
  tasks: TaskWithProject[];
  status: TaskStatus | null;
}> = ({ tasks, status }) => {
  const filtered = status ? tasks.filter((t) => t.status === status) : tasks;
  if (filtered.length === 0) return null;

  return (
    <div className="mt-2 pl-12 pr-3">
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.map((task, idx) => {
          const color = TASK_STATUS_COLORS[task.status] ?? '#C4C4C4';
          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-3 py-2 text-[13px] ${
                idx < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="flex-1 font-medium text-gray-800 dark:text-gray-100 truncate">
                {task.name}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                {task.project_name}
              </span>
              {task.due_date && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                  {task.due_date}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Single assignee row
// ---------------------------------------------------------------------------

const AssigneeRow: React.FC<{ assignee: string; tasks: TaskWithProject[] }> = ({
  assignee,
  tasks,
}) => {
  const [expandedStatus, setExpandedStatus] = useState<TaskStatus | null>(null);

  const total = tasks.length;
  const isOverloaded = total > OVERLOAD_THRESHOLD;
  const isUnderutilized = total < UNDERLOAD_THRESHOLD;

  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
      blocked: 0,
    };
    for (const t of tasks) {
      const s = t.status as TaskStatus;
      if (s in counts) counts[s]++;
    }
    return counts;
  }, [tasks]);

  const handleSegmentClick = (status: TaskStatus) => {
    setExpandedStatus((prev) => (prev === status ? null : status));
  };

  return (
    <div className="mb-1">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg transition-colors">
        {/* Avatar */}
        <AssigneeAvatar assignee={assignee} />

        {/* Name + badges */}
        <div className="w-28 shrink-0">
          <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">
            {assignee}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isOverloaded && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                <AlertTriangle size={10} />
                过载
              </span>
            )}
            {isUnderutilized && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 dark:text-blue-400">
                <Info size={10} />
                空闲
              </span>
            )}
            {!isOverloaded && !isUnderutilized && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{total} 个任务</span>
            )}
          </div>
        </div>

        {/* Stacked bar */}
        <div className="flex-1 relative">
          {total === 0 ? (
            <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] text-gray-400">
              无任务
            </div>
          ) : (
            <div className="flex h-8 rounded-lg overflow-hidden w-full border border-gray-200 dark:border-gray-700">
              {STATUS_ORDER.map((status) => (
                <BarSegment
                  key={status}
                  status={status}
                  count={statusCounts[status]}
                  pct={(statusCounts[status] / total) * 100}
                  onClick={() => handleSegmentClick(status)}
                  isActive={expandedStatus === status}
                />
              ))}
            </div>
          )}
        </div>

        {/* Total count badge */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
            isOverloaded
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : isUnderutilized
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
          title={`共 ${total} 个任务`}
        >
          {total}
        </div>

        {/* Expand toggle */}
        <button
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
          onClick={() => setExpandedStatus((prev) => (prev === null ? 'todo' : null))}
          aria-label={expandedStatus ? '收起' : '展开'}
        >
          {expandedStatus ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Expanded task list */}
      {expandedStatus && <ExpandedTaskList tasks={tasks} status={expandedStatus} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const WorkloadView: React.FC<WorkloadViewProps> = ({ data }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks);
  const tasks: TaskWithProject[] = data?.tasks ?? storeTasks;

  // Group tasks by assignee
  const assigneeGroups = useMemo(() => {
    const map = new Map<string, TaskWithProject[]>();
    for (const task of tasks) {
      const key = task.assignee ?? '未分配';
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, task]);
    }
    // Sort: overloaded first, then by count desc
    return Array.from(map.entries()).sort(([, a], [, b]) => b.length - a.length);
  }, [tasks]);

  const overloadedCount = assigneeGroups.filter(([, t]) => t.length > OVERLOAD_THRESHOLD).length;
  const underCount = assigneeGroups.filter(([, t]) => t.length < UNDERLOAD_THRESHOLD).length;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500 gap-2">
        <User size={36} className="opacity-40" />
        <p className="text-[14px]">暂无任务数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">
              工作量视图
            </h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
              {assigneeGroups.length} 名成员 · {tasks.length} 个任务
            </p>
          </div>
          <div className="flex items-center gap-3">
            {overloadedCount > 0 && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                <AlertTriangle size={12} />
                {overloadedCount} 人过载
              </span>
            )}
            {underCount > 0 && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
                <Info size={12} />
                {underCount} 人空闲
              </span>
            )}
          </div>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: TASK_STATUS_COLORS[s] ?? '#C4C4C4' }}
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {TASK_STATUS_LABELS[s] ?? s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Assignee rows */}
      <div className="flex-1 overflow-auto px-2 py-2">
        {assigneeGroups.map(([assignee, assigneeTasks]) => (
          <AssigneeRow key={assignee} assignee={assignee} tasks={assigneeTasks} />
        ))}
      </div>
    </div>
  );
};

export default WorkloadView;
