import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, User, Calendar, Loader2 } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { projectService } from '../../services/api';
import { useNotificationStore } from '../../stores/notificationStore';

interface TaskListCardProps {
  card: InteractiveCard;
  compact?: boolean;
}

interface TaskItem {
  id?: string;
  name: string;
  status: string;
  priority?: string;
  assignee?: string;
  due_date?: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={14} className="text-[#00C875]" />,
  done: <CheckCircle2 size={14} className="text-[#00C875]" />,
  '已完成': <CheckCircle2 size={14} className="text-[#00C875]" />,
  in_progress: <Clock size={14} className="text-[#FDAB3D]" />,
  '进行中': <Clock size={14} className="text-[#FDAB3D]" />,
  blocked: <AlertCircle size={14} className="text-[#E2445C]" />,
  '已阻塞': <AlertCircle size={14} className="text-[#E2445C]" />,
  overdue: <AlertCircle size={14} className="text-[#E2445C]" />,
  '已逾期': <AlertCircle size={14} className="text-[#E2445C]" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#E2445C',
  '高': '#E2445C',
  critical: '#E2445C',
  '紧急': '#E2445C',
  medium: '#FDAB3D',
  '中': '#FDAB3D',
  low: '#00C875',
  '低': '#00C875',
};

const STATUS_OPTIONS = [
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'blocked', label: '已阻塞' },
];

function parseTasks(data: Record<string, any>): TaskItem[] {
  if (data.tasks && Array.isArray(data.tasks)) return data.tasks;
  if (data.items && Array.isArray(data.items)) return data.items;
  const tasks: TaskItem[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && !['severity', 'total', 'count', 'summary'].includes(key)) {
      tasks.push({ name: key, status: val });
    }
  }
  return tasks;
}

export const TaskListCard: React.FC<TaskListCardProps> = ({ card, compact = true }) => {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [tasks, setTasks] = useState(() => parseTasks(card.data || {}));
  const [updatingIdx, setUpdatingIdx] = useState<number | null>(null);

  const displayTasks = compact ? tasks.slice(0, 5) : tasks;
  const remaining = tasks.length - displayTasks.length;

  const handleStatusChange = async (task: TaskItem, idx: number, newStatus: string) => {
    if (!task.id) {
      // No ID — update local state only
      setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, status: newStatus } : t));
      addNotification({ title: '状态更新', message: `${task.name} → ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus}`, type: 'success' });
      return;
    }

    setUpdatingIdx(idx);
    try {
      await projectService.updateTask(task.id, { status: newStatus } as any);
      setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, status: newStatus } : t));
      addNotification({ title: '状态更新', message: `${task.name} → ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus}`, type: 'success' });
    } catch (err) {
      addNotification({
        title: '更新失败',
        message: err instanceof Error ? err.message : '请稍后重试',
        type: 'error',
      });
    } finally {
      setUpdatingIdx(null);
    }
  };

  return (
    <div className="bg-white border border-[#d0d4e4] border-l-4 border-l-[#0073ea] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f6f7fb]">
        <span className="text-[13px] font-semibold text-[#323338]">{card.title}</span>
        <span className="text-[11px] text-[#676879] bg-white px-2 py-0.5 rounded-full border border-[#d0d4e4]">
          {tasks.length} 项
        </span>
      </div>

      {/* Task list */}
      <div className="divide-y divide-[#e6e9ef]">
        {displayTasks.map((task, idx) => (
          <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f6f7fb] transition-colors group">
            {/* Status icon — clickable to cycle */}
            <button
              type="button"
              className="shrink-0 hover:scale-110 transition-transform"
              title="点击切换状态"
              disabled={updatingIdx === idx}
              onClick={() => {
                const currentIdx = STATUS_OPTIONS.findIndex((s) => s.value === task.status);
                const nextStatus = STATUS_OPTIONS[(currentIdx + 1) % STATUS_OPTIONS.length].value;
                handleStatusChange(task, idx, nextStatus);
              }}
            >
              {updatingIdx === idx ? (
                <Loader2 size={14} className="animate-spin text-[#0073ea]" />
              ) : (
                STATUS_ICON[task.status] || <Circle size={14} className="text-[#c3c6d4]" />
              )}
            </button>

            {/* Task name */}
            <span className={`flex-1 text-[13px] truncate min-w-0 ${
              task.status === 'completed' || task.status === 'done' || task.status === '已完成'
                ? 'text-[#c3c6d4] line-through'
                : 'text-[#323338]'
            }`}>{task.name}</span>

            {/* Status dropdown — visible on hover */}
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task, idx, e.target.value)}
              disabled={updatingIdx === idx}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[10px] bg-white border border-[#d0d4e4] rounded px-1 py-0.5 cursor-pointer focus:opacity-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Priority badge */}
            {task.priority && (
              <span
                className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#c3c6d4' }}
              >
                {task.priority}
              </span>
            )}

            {/* Assignee */}
            {task.assignee && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] text-[#676879]">
                <User size={11} />
                {task.assignee}
              </span>
            )}

            {/* Due date */}
            {task.due_date && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] text-[#676879]">
                <Calendar size={11} />
                {task.due_date}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Remaining count */}
      {remaining > 0 && compact && (
        <div className="px-4 py-2 text-center text-[11px] text-[#0073ea] bg-[#f6f7fb] border-t border-[#e6e9ef]">
          还有 {remaining} 项，点击展开查看全部
        </div>
      )}

      {/* Content / summary */}
      {card.content && (
        <div className="px-4 py-2.5 text-[12px] text-[#676879] border-t border-[#e6e9ef] bg-[#f6f7fb]">
          {card.content}
        </div>
      )}
    </div>
  );
};
