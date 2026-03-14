import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Calendar, User } from 'lucide-react'
import { EmptyState } from '../atomic'
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore'
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../../utils/constants'
import type { TaskWithProject } from '../../types'

// ---------------------------------------------------------------------------
// Grid columns
// ---------------------------------------------------------------------------

const GRID_COLS_PROJECT = 'grid-cols-[1fr_80px_160px_110px_140px_140px]'
const GRID_COLS_NO_PROJECT = 'grid-cols-[1fr_80px_110px_140px_140px]'

// ---------------------------------------------------------------------------
// Status cell (inline editable)
// ---------------------------------------------------------------------------

const ALL_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked']

const StatusCell: React.FC<{
  status: string
  onSelect?: (status: string) => void
}> = ({ status, onSelect }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const color = TASK_STATUS_COLORS[status] ?? '#C4C4C4'
  const label = TASK_STATUS_LABELS[status] ?? status

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative h-full" ref={ref}>
      <button
        className="flex items-center justify-center w-full h-full text-[13px] font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-85 cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        title={`状态: ${label}`}
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]">
          {ALL_STATUSES.map((s) => {
            const c = TASK_STATUS_COLORS[s] ?? '#C4C4C4'
            const l = TASK_STATUS_LABELS[s] ?? s
            return (
              <button
                key={s}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => { e.stopPropagation(); onSelect?.(s); setOpen(false) }}
              >
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: c }} />
                <span className={s === status ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>{l}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Priority cell (inline editable)
// ---------------------------------------------------------------------------

const ALL_PRIORITIES = ['high', 'medium', 'low']

const PriorityCell: React.FC<{
  priority: string
  onSelect?: (priority: string) => void
}> = ({ priority, onSelect }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const color = PRIORITY_COLORS[priority] ?? '#C4C4C4'
  const label = PRIORITY_LABELS[priority] ?? priority

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative h-full" ref={ref}>
      <button
        className="flex items-center justify-center w-full h-full text-[13px] font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-85 cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        title={`优先级: ${label}`}
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[100px]">
          {ALL_PRIORITIES.map((p) => {
            const c = PRIORITY_COLORS[p] ?? '#C4C4C4'
            const l = PRIORITY_LABELS[p] ?? p
            return (
              <button
                key={p}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => { e.stopPropagation(); onSelect?.(p); setOpen(false) }}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c }} />
                <span className={p === priority ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>{l}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assignee avatar
// ---------------------------------------------------------------------------

const AssigneeAvatar: React.FC<{ assignee: string | null }> = ({ assignee }) => {
  if (!assignee) {
    return (
      <div className="w-[26px] h-[26px] rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center" title="未分配">
        <User size={13} className="text-gray-500 dark:text-gray-400" />
      </div>
    )
  }
  const seed = encodeURIComponent(assignee)
  const url = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`
  return (
    <img src={url} alt={assignee} title={assignee} className="w-[26px] h-[26px] rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" loading="lazy" />
  )
}

// ---------------------------------------------------------------------------
// Column header row
// ---------------------------------------------------------------------------

const ColumnHeader: React.FC<{ showProject: boolean }> = ({ showProject }) => (
  <div className={`grid items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${showProject ? GRID_COLS_PROJECT : GRID_COLS_NO_PROJECT}`}>
    <div className="px-3 py-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">任务</div>
    <div className="px-2 py-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 text-center border-r border-gray-200 dark:border-gray-700">负责人</div>
    {showProject && <div className="px-2 py-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">所属项目</div>}
    <div className="px-2 py-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 text-center border-r border-gray-200 dark:border-gray-700">截止日期</div>
    <div className="px-2 py-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 text-center border-r border-gray-200 dark:border-gray-700">状态</div>
    <div className="px-2 py-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 text-center">优先级</div>
  </div>
)

// ---------------------------------------------------------------------------
// Table row
// ---------------------------------------------------------------------------

const TableRow: React.FC<{
  task: TaskWithProject
  showProject: boolean
  onStatusChange: (taskId: string, status: string) => void
  onPriorityChange: (taskId: string, priority: string) => void
  onTaskClick?: (task: TaskWithProject) => void
}> = ({ task, showProject, onStatusChange, onPriorityChange, onTaskClick }) => {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = !!task.due_date && task.due_date < today && task.status !== 'done'
  const isDone = task.status === 'done'

  const dueDateDisplay = (() => {
    if (!task.due_date) return '\u2014'
    const diff = Math.ceil((new Date(task.due_date).getTime() - new Date(today).getTime()) / 86400000)
    if (isDone) return task.due_date
    if (diff < 0) return `逾期 ${Math.abs(diff)} 天`
    if (diff === 0) return '今天'
    if (diff === 1) return '明天'
    return task.due_date
  })()

  return (
    <div
      className={`grid items-stretch border-b border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${
        onTaskClick ? 'cursor-pointer' : ''
      } ${isDone ? 'opacity-60' : ''} ${showProject ? GRID_COLS_PROJECT : GRID_COLS_NO_PROJECT}`}
      style={{ height: '36px' }}
      onClick={() => onTaskClick?.(task)}
      role={onTaskClick ? 'button' : undefined}
      tabIndex={onTaskClick ? 0 : undefined}
      onKeyDown={onTaskClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onTaskClick(task) } : undefined}
    >
      <div className="flex items-center gap-2 px-3 py-1 min-w-0 border-r border-gray-200/60 dark:border-gray-700/60">
        <span className={`text-[14px] font-medium truncate ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
          {task.name}
        </span>
      </div>
      <div className="flex items-center justify-center px-2 py-1 border-r border-gray-200/60 dark:border-gray-700/60">
        <AssigneeAvatar assignee={task.assignee} />
      </div>
      {showProject && (
        <div className="flex items-center px-2 py-1 min-w-0 border-r border-gray-200/60 dark:border-gray-700/60">
          <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{task.project_name}</span>
        </div>
      )}
      <div className="flex items-center justify-center px-2 py-1 border-r border-gray-200/60 dark:border-gray-700/60">
        <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${isOverdue && !isDone ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {task.due_date && <Calendar size={11} />}
          {dueDateDisplay}
        </span>
      </div>
      <div className="border-r border-gray-200/60 dark:border-gray-700/60">
        <StatusCell status={task.status} onSelect={(s) => onStatusChange(task.id, s)} />
      </div>
      <div>
        <PriorityCell priority={task.priority} onSelect={(p) => onPriorityChange(task.id, p)} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add-task inline
// ---------------------------------------------------------------------------

const AddTaskRow: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) { onAdd(trimmed); setValue('') }
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        className="flex items-center gap-1.5 w-full px-3 py-2 text-[12px] text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setEditing(true)}
      >
        <Plus size={13} />
        <span>添加任务</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <Plus size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        placeholder="输入任务名称，按回车创建"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setValue(''); setEditing(false) }
        }}
        onBlur={handleSubmit}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Group section
// ---------------------------------------------------------------------------

interface GroupSectionProps {
  label: string
  count: number
  accentColor: string
  tasks: TaskWithProject[]
  showProject: boolean
  onStatusChange: (taskId: string, status: string) => void
  onPriorityChange: (taskId: string, priority: string) => void
  onTaskClick?: (task: TaskWithProject) => void
  onQuickAdd?: (name: string) => void
  defaultCollapsed?: boolean
}

const GroupSection: React.FC<GroupSectionProps> = ({
  label, count, accentColor, tasks, showProject,
  onStatusChange, onPriorityChange, onTaskClick, onQuickAdd,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-1.5 px-0.5 py-1 text-left transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-sm w-full"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span style={{ color: accentColor }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </span>
        <span className="text-[18px] font-medium leading-6" style={{ color: accentColor }}>
          {label}
        </span>
        <span className="text-[13px] text-gray-500 dark:text-gray-400 ml-1">{count} 个任务</span>
      </button>

      {!collapsed && (
        <div
          className="border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ borderLeftWidth: '4px', borderLeftColor: accentColor, borderRadius: '0 4px 4px 0' }}
        >
          <ColumnHeader showProject={showProject} />
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              task={task}
              showProject={showProject}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-[12px] text-gray-500 dark:text-gray-400 py-4">暂无任务</div>
          )}
          {onQuickAdd && <AddTaskRow onAdd={onQuickAdd} />}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

type DateBucket = '已过期' | '今天' | '本周' | '下周' | '以后' | '无日期'

function getDateBucket(dueDate: string | null, todayStr: string): DateBucket {
  if (!dueDate) return '无日期'
  const today = new Date(todayStr); today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return '已过期'
  if (diffDays === 0) return '今天'
  const todayDow = today.getDay()
  const daysUntilEndOfWeek = todayDow === 0 ? 0 : 7 - todayDow
  if (diffDays <= daysUntilEndOfWeek) return '本周'
  if (diffDays <= daysUntilEndOfWeek + 7) return '下周'
  return '以后'
}

const DATE_BUCKET_ORDER: DateBucket[] = ['已过期', '今天', '本周', '下周', '以后', '无日期']
const DATE_BUCKET_COLORS: Record<DateBucket, string> = {
  '已过期': '#7f5347',
  '今天': '#037f4c',
  '本周': '#007eb5',
  '下周': '#4eccc6',
  '以后': '#9b51e0',
  '无日期': '#676879',
}

const GROUP_ACCENT_COLORS = [
  '#0086C0', '#6BBF59', '#9B51E0', '#FDAB3D', '#E2445C',
  '#00C875', '#FF7A59', '#37B4E3', '#676879', '#34C759',
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TaskListProps {
  data?: {
    tasks?: TaskWithProject[]
    groupBy?: 'date' | 'none' | 'project' | 'priority'
  }
  onTaskClick?: (task: TaskWithProject) => void
  onQuickAdd?: (name: string, groupKey: string) => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TaskList: React.FC<TaskListProps> = ({ data, onTaskClick, onQuickAdd }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks)
  const storeGroupBy = useTaskWorkbenchStore((s) => s.groupBy)
  const updateTaskStatus = useTaskWorkbenchStore((s) => s.updateTaskStatus)
  const updateTaskPriority = useTaskWorkbenchStore((s) => s.updateTaskPriority)

  const tasks: TaskWithProject[] = data?.tasks ?? storeTasks
  const groupBy = data?.groupBy ?? storeGroupBy
  const today = new Date().toISOString().slice(0, 10)

  const onStatusChange = (taskId: string, status: string) => updateTaskStatus(taskId, status)
  const onPriorityChange = (taskId: string, priority: string) => updateTaskPriority(taskId, priority)

  if (tasks.length === 0) {
    return <EmptyState icon="clipboard" title="暂无符合条件的任务" description="调整筛选条件或创建新任务" />
  }

  // Date grouping
  if (groupBy === 'date') {
    const bucketMap = new Map<DateBucket, TaskWithProject[]>()
    for (const bucket of DATE_BUCKET_ORDER) bucketMap.set(bucket, [])
    for (const task of tasks) bucketMap.get(getDateBucket(task.due_date, today))!.push(task)

    return (
      <div>
        {DATE_BUCKET_ORDER.map((bucket) => {
          const bucketTasks = bucketMap.get(bucket) ?? []
          if (bucketTasks.length === 0 && bucket !== '今天') return null
          return (
            <GroupSection
              key={bucket}
              label={bucket}
              count={bucketTasks.length}
              accentColor={DATE_BUCKET_COLORS[bucket]}
              tasks={bucketTasks}
              showProject={true}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
              onQuickAdd={onQuickAdd ? (name) => onQuickAdd(name, bucket) : undefined}
              defaultCollapsed={bucket === '已过期' && bucketTasks.length > 5}
            />
          )
        })}
      </div>
    )
  }

  // No grouping
  if (groupBy === 'none') {
    return (
      <div
        className="border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ borderLeftWidth: '4px', borderLeftColor: '#0086C0', borderRadius: '0 4px 4px 0' }}
      >
        <ColumnHeader showProject={true} />
        {tasks.map((task) => (
          <TableRow
            key={task.id}
            task={task}
            showProject={true}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onTaskClick={onTaskClick}
          />
        ))}
        {onQuickAdd && <AddTaskRow onAdd={(name) => onQuickAdd(name, 'none')} />}
      </div>
    )
  }

  // Project grouping
  if (groupBy === 'project') {
    const projectMap = new Map<string, TaskWithProject[]>()
    for (const task of tasks) {
      const existing = projectMap.get(task.project_name) ?? []
      projectMap.set(task.project_name, [...existing, task])
    }
    const sortedProjects = Array.from(projectMap.keys()).sort()

    return (
      <div>
        {sortedProjects.map((projectName, idx) => {
          const groupTasks = projectMap.get(projectName) ?? []
          return (
            <GroupSection
              key={projectName}
              label={projectName}
              count={groupTasks.length}
              accentColor={GROUP_ACCENT_COLORS[idx % GROUP_ACCENT_COLORS.length]}
              tasks={groupTasks}
              showProject={false}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
              onQuickAdd={onQuickAdd ? (name) => onQuickAdd(name, projectName) : undefined}
            />
          )
        })}
      </div>
    )
  }

  // Priority grouping
  const PRIORITY_ORDER = ['high', 'medium', 'low']
  const PRIORITY_GROUP_COLORS: Record<string, string> = { high: '#E2445C', medium: '#FDAB3D', low: '#579BFC' }
  const priorityMap = new Map<string, TaskWithProject[]>()
  for (const task of tasks) {
    const existing = priorityMap.get(task.priority) ?? []
    priorityMap.set(task.priority, [...existing, task])
  }

  return (
    <div>
      {PRIORITY_ORDER.map((priority) => {
        const groupTasks = priorityMap.get(priority)
        if (!groupTasks || groupTasks.length === 0) return null
        return (
          <GroupSection
            key={priority}
            label={`${PRIORITY_LABELS[priority] ?? priority}优先级`}
            count={groupTasks.length}
            accentColor={PRIORITY_GROUP_COLORS[priority]}
            tasks={groupTasks}
            showProject={true}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onTaskClick={onTaskClick}
            onQuickAdd={onQuickAdd ? (name) => onQuickAdd(name, priority) : undefined}
          />
        )
      })}
    </div>
  )
}

export default TaskList
