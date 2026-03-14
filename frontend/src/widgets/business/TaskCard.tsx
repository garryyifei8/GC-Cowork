import React from 'react'
import { Calendar, User } from 'lucide-react'
import { StatusBadge } from '../atomic'
import type { StatusVariant } from '../atomic'
import type { ProjectTask, TaskWithProject } from '../../types'

export interface TaskCardProps {
  task: ProjectTask | TaskWithProject
  onClick?: (task: ProjectTask | TaskWithProject) => void
}

const STATUS_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  todo: { variant: 'info', label: '待办' },
  in_progress: { variant: 'success', label: '进行中' },
  review: { variant: 'warning', label: '审核中' },
  done: { variant: 'default', label: '已完成' },
  blocked: { variant: 'danger', label: '已阻塞' },
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-500/10 text-red-600 dark:text-red-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = !!task.due_date && task.due_date < today && task.status !== 'done'
  const isDone = task.status === 'done'

  const statusInfo = STATUS_MAP[task.status] ?? { variant: 'default' as StatusVariant, label: task.status }

  const dueDateDisplay = (() => {
    if (!task.due_date) return null
    const diff = Math.ceil(
      (new Date(task.due_date).getTime() - new Date(today).getTime()) / 86400000
    )
    if (isDone) return task.due_date
    if (diff < 0) return `逾期 ${Math.abs(diff)} 天`
    if (diff === 0) return '今天'
    if (diff === 1) return '明天'
    return task.due_date
  })()

  const avatarSeed = encodeURIComponent(task.assignee ?? 'unassigned')
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${avatarSeed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`

  return (
    <div
      className={[
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3',
        'flex flex-col gap-2 transition-all duration-150 group',
        onClick ? 'cursor-pointer' : 'cursor-default',
        'hover:shadow-md hover:-translate-y-px',
        isOverdue ? 'border-l-[3px] border-l-red-500' : isDone ? 'border-l-[3px] border-l-emerald-500 opacity-80' : '',
      ].join(' ')}
      onClick={() => onClick?.(task)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(task) } : undefined}
    >
      {/* Task name */}
      <p
        className={`text-sm font-semibold leading-snug ${
          isDone
            ? 'line-through text-gray-400 dark:text-gray-500'
            : 'text-gray-800 dark:text-gray-100'
        }`}
      >
        {task.name}
      </p>

      {/* Status + due date row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatusBadge status={statusInfo.variant} label={statusInfo.label} size="sm" />

        {dueDateDisplay && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
              isOverdue
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Calendar size={10} />
            {dueDateDisplay}
          </span>
        )}
      </div>

      {/* Priority badge */}
      <div>
        <span
          className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
            PRIORITY_STYLES[task.priority] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
          }`}
        >
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
      </div>

      {/* Footer: assignee */}
      <div className="flex items-center pt-1.5 border-t border-gray-200/60 dark:border-gray-700/60">
        {task.assignee ? (
          <div className="flex items-center gap-1" title={task.assignee}>
            <img
              src={avatarUrl}
              alt={task.assignee}
              className="w-5 h-5 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-700"
              loading="lazy"
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[80px]">
              {task.assignee}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <User size={12} />
            <span className="text-[11px]">未分配</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard
