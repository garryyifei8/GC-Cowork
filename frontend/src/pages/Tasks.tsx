import React, { useEffect, useState, useMemo } from 'react'
import { List, LayoutGrid, CalendarDays } from 'lucide-react'
import TaskFilters from '../widgets/atomic/TaskFilters'
import TaskKanban from '../widgets/views/TaskKanban'
import TaskList from '../widgets/views/TaskList'
import CalendarView from '../widgets/views/CalendarView'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { TaskCreateDrawer } from '../components/tasks/TaskCreateDrawer'
import { useTaskWorkbenchStore } from '../stores/taskWorkbenchStore'
import type { ProjectTask, TaskWithProject } from '../types'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../utils/constants'

export const Tasks = () => {
  const tasks = useTaskWorkbenchStore((s) => s.tasks)
  const isLoading = useTaskWorkbenchStore((s) => s.isLoading)
  const viewMode = useTaskWorkbenchStore((s) => s.viewMode)
  const setViewMode = useTaskWorkbenchStore((s) => s.setViewMode)
  const searchQuery = useTaskWorkbenchStore((s) => s.searchQuery)
  const filterProjectId = useTaskWorkbenchStore((s) => s.filterProjectId)
  const filterStatus = useTaskWorkbenchStore((s) => s.filterStatus)
  const filterPriority = useTaskWorkbenchStore((s) => s.filterPriority)
  const sortBy = useTaskWorkbenchStore((s) => s.sortBy)
  const sortDir = useTaskWorkbenchStore((s) => s.sortDir)
  const fetchTasks = useTaskWorkbenchStore((s) => s.fetchTasks)
  const fetchProjects = useTaskWorkbenchStore((s) => s.fetchProjects)
  const updateTask = useTaskWorkbenchStore((s) => s.updateTask)
  const deleteTask = useTaskWorkbenchStore((s) => s.deleteTask)
  const createTask = useTaskWorkbenchStore((s) => s.createTask)
  const projects = useTaskWorkbenchStore((s) => s.projects)
  const selectedTaskIds = useTaskWorkbenchStore((s) => s.selectedTaskIds)
  const clearSelection = useTaskWorkbenchStore((s) => s.clearSelection)
  const batchUpdateStatus = useTaskWorkbenchStore((s) => s.batchUpdateStatus)
  const batchUpdatePriority = useTaskWorkbenchStore((s) => s.batchUpdatePriority)
  const batchDelete = useTaskWorkbenchStore((s) => s.batchDelete)

  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks, fetchProjects])

  // Client-side filtering for search and project
  const filteredTasks = useMemo(() => {
    let result = tasks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.assignee && t.assignee.toLowerCase().includes(q)) ||
          t.project_name.toLowerCase().includes(q)
      )
    }
    if (filterProjectId) {
      result = result.filter((t) => t.project_name === filterProjectId)
    }
    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus)
    }
    if (filterPriority) {
      result = result.filter((t) => t.priority === filterPriority)
    }
    // Sorting
    if (sortBy) {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      const statusOrder: Record<string, number> = { todo: 0, in_progress: 1, review: 2, blocked: 3, done: 4 }
      const dir = sortDir === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        let cmp = 0
        switch (sortBy) {
          case 'name':
            cmp = a.name.localeCompare(b.name, 'zh')
            break
          case 'status':
            cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
            break
          case 'priority':
            cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
            break
          case 'due_date':
            cmp = (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
            break
          case 'assignee':
            cmp = (a.assignee ?? '').localeCompare(b.assignee ?? '', 'zh')
            break
        }
        return cmp * dir
      })
    }
    return result
  }, [tasks, searchQuery, filterProjectId, filterStatus, filterPriority, sortBy, sortDir])

  // Stats bar counts
  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of filteredTasks) {
      counts[t.status] = (counts[t.status] || 0) + 1
    }
    return counts
  }, [filteredTasks])

  const today = new Date().toISOString().slice(0, 10)
  const overdueCount = filteredTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'done'
  ).length

  const handleQuickAdd = async (name: string, _groupKey: string) => {
    const defaultProjectId = projects[0]?.id
    if (!defaultProjectId) return
    await createTask(defaultProjectId, { name })
  }

  const handleCreateTask = async (data: {
    name: string
    projectId: string
    assignee?: string
    priority?: string
    due_date?: string
    description?: string
  }) => {
    await createTask(data.projectId, {
      name: data.name,
      assignee: data.assignee,
      priority: data.priority,
      due_date: data.due_date,
      description: data.description,
    })
  }

  const handleTaskClick = (task: ProjectTask | TaskWithProject) => {
    setSelectedTask(task as TaskWithProject)
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-text">
          任务工作台
        </h1>
        <div className="flex items-center gap-1 bg-[#F4F6FC] rounded-[10px] p-0.5">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-light-text shadow-sm'
                : 'text-light-text-secondary hover:text-light-text'
            }`}
            onClick={() => setViewMode('list')}
          >
            <List size={15} />
            列表
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-light-text shadow-sm'
                : 'text-light-text-secondary hover:text-light-text'
            }`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={15} />
            看板
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-light-text shadow-sm'
                : 'text-light-text-secondary hover:text-light-text'
            }`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays size={15} />
            日历
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-light-text-secondary font-medium">
          共 {filteredTasks.length} 个任务
        </span>
        {Object.entries(stats).map(([status, count]) => (
          <span
            key={status}
            className="text-xs px-2 py-1 rounded-[3px] font-medium"
            style={{
              color: TASK_STATUS_COLORS[status],
              backgroundColor: `${TASK_STATUS_COLORS[status]}15`,
            }}
          >
            {TASK_STATUS_LABELS[status] ?? status} {count}
          </span>
        ))}
        {overdueCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-[3px] font-medium text-red-600 bg-red-50">
            逾期 {overdueCount}
          </span>
        )}
        {isLoading && (
          <span className="text-xs text-[#919AA3] animate-pulse">
            加载中...
          </span>
        )}
      </div>

      {/* Filters toolbar */}
      <TaskFilters onNewTask={() => setShowCreateDrawer(true)} />

      {/* Main view */}
      <div className="flex-1 min-h-0">
        {viewMode === 'calendar' ? (
          <CalendarView data={{ tasks: filteredTasks }} />
        ) : viewMode === 'kanban' ? (
          <TaskKanban
            data={{ tasks: filteredTasks }}
            onTaskClick={handleTaskClick}
            onQuickAdd={handleQuickAdd}
          />
        ) : (
          <TaskList
            data={{ tasks: filteredTasks }}
            onTaskClick={handleTaskClick}
            onQuickAdd={handleQuickAdd}
          />
        )}
      </div>

      {/* Task create drawer */}
      <TaskCreateDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateTask}
        projects={projects}
      />

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}

      {/* Batch action bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-[#475569] text-white rounded-xl shadow-2xl animate-slide-in-up">
          <span className="text-sm font-medium">
            已选 {selectedTaskIds.size} 项
          </span>
          <div className="w-px h-5 bg-white/20" />
          <BatchDropdown
            label="改状态"
            items={[
              { key: 'todo', label: '待办' },
              { key: 'in_progress', label: '进行中' },
              { key: 'review', label: '评审中' },
              { key: 'done', label: '已完成' },
            ]}
            onSelect={batchUpdateStatus}
          />
          <BatchDropdown
            label="改优先级"
            items={[
              { key: 'high', label: '高' },
              { key: 'medium', label: '中' },
              { key: 'low', label: '低' },
            ]}
            onSelect={batchUpdatePriority}
          />
          <button
            className="px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            onClick={batchDelete}
          >
            删除
          </button>
          <div className="w-px h-5 bg-white/20" />
          <button
            className="text-xs text-white/60 hover:text-white transition-colors"
            onClick={clearSelection}
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Batch dropdown helper
// ---------------------------------------------------------------------------

const BatchDropdown: React.FC<{
  label: string
  items: Array<{ key: string; label: string }>
  onSelect: (key: string) => void
}> = ({ label, items, onSelect }) => {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        className="px-3 py-1.5 text-xs font-medium bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[100px]">
          {items.map((item) => (
            <button
              key={item.key}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { onSelect(item.key); setOpen(false) }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
