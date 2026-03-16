import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { TaskCard } from '../business'
import { EmptyState } from '../atomic'
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore'
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/constants'
import type { ProjectTask, TaskWithProject } from '../../types'

// ---------------------------------------------------------------------------
// Kanban column definitions
// ---------------------------------------------------------------------------

const KANBAN_COLUMNS: Array<{ key: string }> = [
  { key: 'todo' },
  { key: 'in_progress' },
  { key: 'review' },
  { key: 'blocked' },
  { key: 'done' },
]

// ---------------------------------------------------------------------------
// Quick-add input at column bottom
// ---------------------------------------------------------------------------

const KanbanQuickAdd: React.FC<{
  color: string
  onAdd: (name: string) => void
}> = ({ color, onAdd }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onAdd(trimmed)
      setValue('')
    }
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-100 hover:bg-white dark:hover:bg-gray-700"
        style={{ color }}
        onClick={() => setEditing(true)}
      >
        <Plus size={13} />
        <span>添加任务</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <Plus size={13} style={{ color }} className="flex-shrink-0" />
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-xs text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        placeholder="输入任务名称，回车创建"
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
// Props
// ---------------------------------------------------------------------------

export interface TaskKanbanProps {
  data?: { tasks?: TaskWithProject[] }
  onTaskClick?: (task: ProjectTask | TaskWithProject) => void
  onQuickAdd?: (name: string, groupKey: string) => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TaskKanban: React.FC<TaskKanbanProps> = ({ data, onTaskClick, onQuickAdd }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks)
  const updateTaskStatus = useTaskWorkbenchStore((s) => s.updateTaskStatus)
  const tasks: TaskWithProject[] = data?.tasks ?? storeTasks

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

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
    if (draggedId) {
      updateTaskStatus(draggedId, targetStatus)
      setDraggedId(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverCol(null)
  }

  if (tasks.length === 0) {
    return <EmptyState icon="clipboard" title="暂无任务" description="创建任务开始管理工作" />
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4 items-start"
      style={{ scrollbarWidth: 'thin' }}
      role="region"
      aria-label="任务看板"
    >
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key)
        const color = TASK_STATUS_COLORS[col.key] ?? '#C4C4C4'
        const label = TASK_STATUS_LABELS[col.key] ?? col.key

        return (
          <div
            key={col.key}
            className="min-w-[268px] max-w-[300px] flex-[1_0_268px] flex flex-col"
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-t-xl text-white font-bold text-sm"
              style={{ backgroundColor: color }}
            >
              <span>{label}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Column body */}
            <div
              className={[
                'flex flex-col gap-2 p-2 bg-gray-100 dark:bg-gray-800/60 rounded-b-xl flex-1 overflow-y-auto transition-colors',
                dragOverCol === col.key ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : '',
              ].join(' ')}
              style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '120px' }}
            >
              {colTasks.length === 0 ? (
                <div
                  className="flex items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-500 border-2 border-dashed rounded-lg transition-colors"
                  style={{ borderColor: color + '40' }}
                >
                  暂无任务
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={draggedId === task.id ? 'opacity-50' : ''}
                  >
                    <TaskCard
                      task={task}
                      onClick={onTaskClick}
                    />
                  </div>
                ))
              )}

              {/* Quick-add */}
              {onQuickAdd && (
                <KanbanQuickAdd
                  color={color}
                  onAdd={(name) => onQuickAdd(name, col.key)}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TaskKanban
