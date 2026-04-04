import React, { useEffect, useRef, useState } from 'react'
import {
  Plus,
  MoreHorizontal,
  MoreVertical,
  MessageCircle,
  Paperclip,
  Search,
} from 'lucide-react'
import { EmptyState } from '../atomic'
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore'
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/constants'
import type { ProjectTask, TaskWithProject } from '../../types'

// ---------------------------------------------------------------------------
// Kanban columns
// ---------------------------------------------------------------------------

const KANBAN_COLUMNS: Array<{ key: string }> = [
  { key: 'todo' },
  { key: 'in_progress' },
  { key: 'review' },
  { key: 'blocked' },
  { key: 'done' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`
}

// ---------------------------------------------------------------------------
// Quick-add (Preclinic full-width primary button style)
// ---------------------------------------------------------------------------

const KanbanQuickAdd: React.FC<{ color: string; onAdd: (name: string) => void }> = ({ color, onAdd }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const handleSubmit = () => {
    const t = value.trim()
    if (t) { onAdd(t); setValue('') }
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full py-2.5 rounded-[10px] text-[15px] font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: color }}
      >
        + 新建任务
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-[10px] border border-[#E8ECF4]">
      <Plus size={13} style={{ color }} className="shrink-0" />
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-[15px] text-light-text outline-none placeholder:text-[#919AA3]"
        placeholder="输入名称，回车创建"
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
// Kanban card — Preclinic exact spec
// ---------------------------------------------------------------------------

const KanbanCard: React.FC<{
  task: TaskWithProject
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick?: () => void
}> = ({ task, isDragging, onDragStart, onDragEnd, onClick }) => {
  const priority = task.priority ?? 'low'

  const priorityBadge = {
    high:   { bg: 'bg-[#E74C3C1A]', text: 'text-[#E74C3C]', border: 'border-[#E74C3C]/20', dot: 'bg-[#E74C3C]', label: 'High' },
    medium: { bg: 'bg-[#FFB2641A]', text: 'text-[#FFB264]', border: 'border-[#FFB264]/20', dot: 'bg-[#FFB264]', label: 'Medium' },
    low:    { bg: 'bg-[#2ED47E1A]', text: 'text-[#2ED47E]', border: 'border-[#2ED47E]/20', dot: 'bg-[#2ED47E]', label: 'Low' },
  }[priority] ?? { bg: 'bg-[#F4F6FC]', text: 'text-light-text-secondary', border: 'border-[#E8ECF4]', dot: 'bg-[#919AA3]', label: priority }

  // Assignee list (up to 2 shown + "+N" overflow)
  const assigneeNames = task.assignee
    ? task.assignee.split(',').map((n) => n.trim()).filter(Boolean)
    : []
  const shownAvatars = assigneeNames.slice(0, 2)
  const extraCount = Math.max(0, assigneeNames.length - 2)

  const projectInitial = ('project_name' in task && task.project_name)
    ? task.project_name.charAt(0).toUpperCase()
    : '?'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group bg-white border border-[#E8ECF4] rounded-[10px] p-4 hover:border-primary/30 transition-shadow cursor-pointer select-none${
        isDragging ? ' opacity-40' : ''
      }`}
    >
      {/* Row 1: Priority badge + more button */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium rounded-[5px] px-2 py-1 border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}
        >
          <span className={`w-[6px] h-[6px] rounded-full ${priorityBadge.dot}`} />
          {priorityBadge.label}
        </span>
        <MoreVertical
          size={14}
          className="text-[#E8ECF4] group-hover:text-[#919AA3] transition-colors"
        />
      </div>

      {/* Row 2: Project avatar + task title */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#F4F6FC] flex items-center justify-center text-xs font-medium text-light-text shrink-0">
          {projectInitial}
        </div>
        <h6 className="text-[15px] font-medium text-light-text line-clamp-2 leading-snug">
          {task.name}
        </h6>
      </div>

      {/* Row 3: Assignee / Project / Due date grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <span className="text-xs text-light-text-secondary block">负责人</span>
          <p className="text-[15px] font-medium text-light-text m-0 truncate">
            {task.assignee ?? '未分配'}
          </p>
        </div>
        <div>
          <span className="text-xs text-light-text-secondary block">项目</span>
          <p className="text-[15px] font-medium text-light-text m-0 truncate">
            {'project_name' in task ? (task.project_name || '--') : '--'}
          </p>
        </div>
        <div>
          <span className="text-xs text-light-text-secondary block">截止日</span>
          <p className="text-[15px] font-medium text-light-text m-0">
            {task.due_date ?? '--'}
          </p>
        </div>
      </div>

      {/* Row 4: Avatars + action icons (border-top separator) */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E8ECF4]">
        <div className="flex -space-x-1.5">
          {shownAvatars.map((name, i) => (
            <img
              key={i}
              src={getAvatarUrl(name)}
              alt={name}
              title={name}
              className="w-6 h-6 rounded-full border-2 border-white"
              loading="lazy"
              style={{ zIndex: shownAvatars.length - i }}
            />
          ))}
          {extraCount > 0 && (
            <span className="w-6 h-6 rounded-full bg-[#00C875] text-white text-xs font-medium flex items-center justify-center border-2 border-white">
              {extraCount}+
            </span>
          )}
          {assigneeNames.length === 0 && (
            <span className="w-6 h-6 rounded-full bg-[#F4F6FC] text-[#919AA3] text-xs flex items-center justify-center border-2 border-white">
              ?
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 text-[#919AA3]">
          <MessageCircle size={14} className="hover:text-light-text transition-colors" />
          <Paperclip size={14} className="hover:text-light-text transition-colors" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TaskKanbanProps {
  data?: { tasks?: TaskWithProject[] }
  onTaskClick?: (task: ProjectTask | TaskWithProject) => void
  onQuickAdd?: (name: string, groupKey: string) => void
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const TaskKanban: React.FC<TaskKanbanProps> = ({ data, onTaskClick, onQuickAdd }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks)
  const updateTaskStatus = useTaskWorkbenchStore((s) => s.updateTaskStatus)
  const tasks: TaskWithProject[] = data?.tasks ?? storeTasks

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }
  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colKey)
  }
  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setDragOverCol(null)
    if (draggedId) { updateTaskStatus(draggedId, targetStatus); setDraggedId(null) }
  }
  const handleDragEnd = () => { setDraggedId(null); setDragOverCol(null) }

  // Summary stats
  const totalTasks = tasks.length
  const pending = tasks.filter(t => t.status !== 'done').length
  const completed = tasks.filter(t => t.status === 'done').length

  // Filtered tasks
  const filteredTasks = searchQuery.trim()
    ? tasks.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.project_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks

  if (tasks.length === 0) {
    return <EmptyState icon="clipboard" title="暂无任务" description="创建任务开始管理工作" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats + search bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 text-[15px] text-light-text-secondary">
          <span>Total Task : <strong className="text-light-text font-medium">{totalTasks}</strong></span>
          <span>Pending : <strong className="text-light-text font-medium">{pending}</strong></span>
          <span>Completed : <strong className="text-light-text font-medium">{completed}</strong></span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-[10px] bg-white">
          <Search size={14} className="text-light-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="搜索任务"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[15px] text-light-text outline-none w-32 placeholder:text-[#919AA3]"
          />
        </div>
      </div>

      {/* Kanban columns */}
      <div
        className="flex gap-4 overflow-x-auto pb-4 items-start"
        style={{ scrollbarWidth: 'thin' }}
        role="region"
        aria-label="任务看板"
      >
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key)
          const color = TASK_STATUS_COLORS[col.key] ?? '#C4C4C4'
          const label = TASK_STATUS_LABELS[col.key] ?? col.key
          const isDragTarget = dragOverCol === col.key

          return (
            <div
              key={col.key}
              className="min-w-[260px] max-w-[300px] flex-[1_0_260px] flex flex-col"
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header — Preclinic exact */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-white border border-[#E8ECF4] rounded-t-[10px]"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <h6 className="text-[15px] font-medium text-light-text">{label}</h6>
                  <span className="bg-[#F4F6FC] text-light-text text-xs font-medium rounded-full px-2 py-0.5">
                    {String(colTasks.length).padStart(2, '0')}
                  </span>
                </div>
                <button className="p-1 rounded hover:bg-[#F4F6FC] transition-colors text-[#919AA3]">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* Column body */}
              <div
                className={`flex flex-col gap-3 p-3 rounded-b-[10px] border border-t-0 border-[#E8ECF4] flex-1 overflow-y-auto transition-all${
                  isDragTarget ? ' bg-[#E8F8F1] ring-2 ring-[#00C875]/30' : ' bg-[#F4F6FC]'
                }`}
                style={{ maxHeight: 'calc(100vh - 300px)', minHeight: 140 }}
              >
                {colTasks.length === 0 && !isDragTarget ? (
                  <div className="flex items-center justify-center py-8 text-[15px] text-[#919AA3] border-2 border-dashed border-[#E8ECF4] rounded-[10px]">
                    拖拽任务至此
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      isDragging={draggedId === task.id}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick?.(task)}
                    />
                  ))
                )}

                {/* "New Task" button */}
                {onQuickAdd && (
                  <div className="mt-1">
                    <KanbanQuickAdd
                      color={color}
                      onAdd={(name) => onQuickAdd(name, col.key)}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TaskKanban
