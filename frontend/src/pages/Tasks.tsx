import { useEffect, useState, useMemo } from 'react'
import { List, LayoutGrid } from 'lucide-react'
import TaskFilters from '../widgets/atomic/TaskFilters'
import TaskKanban from '../widgets/views/TaskKanban'
import TaskList from '../widgets/views/TaskList'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { useTaskWorkbenchStore } from '../stores/taskWorkbenchStore'
import type { ProjectTask, TaskWithProject } from '../types'
import { TASK_STATUS_LABELS } from '../utils/constants'

export const Tasks = () => {
  const tasks = useTaskWorkbenchStore((s) => s.tasks)
  const isLoading = useTaskWorkbenchStore((s) => s.isLoading)
  const viewMode = useTaskWorkbenchStore((s) => s.viewMode)
  const setViewMode = useTaskWorkbenchStore((s) => s.setViewMode)
  const searchQuery = useTaskWorkbenchStore((s) => s.searchQuery)
  const filterProjectId = useTaskWorkbenchStore((s) => s.filterProjectId)
  const fetchTasks = useTaskWorkbenchStore((s) => s.fetchTasks)
  const fetchProjects = useTaskWorkbenchStore((s) => s.fetchProjects)
  const updateTask = useTaskWorkbenchStore((s) => s.updateTask)
  const deleteTask = useTaskWorkbenchStore((s) => s.deleteTask)
  const createTask = useTaskWorkbenchStore((s) => s.createTask)
  const projects = useTaskWorkbenchStore((s) => s.projects)

  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)

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
    return result
  }, [tasks, searchQuery, filterProjectId])

  // Stats bar counts
  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of filteredTasks) {
      counts[t.status] = (counts[t.status] || 0) + 1
    }
    return counts
  }, [filteredTasks])

  const handleQuickAdd = async (name: string, _groupKey: string) => {
    const defaultProjectId = projects[0]?.id
    if (!defaultProjectId) return
    await createTask(defaultProjectId, { name })
  }

  const handleTaskClick = (task: ProjectTask | TaskWithProject) => {
    setSelectedTask(task as TaskWithProject)
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          任务工作台
        </h1>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setViewMode('list')}
          >
            <List size={15} />
            列表
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={15} />
            看板
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500 dark:text-gray-400 font-medium">
          共 {filteredTasks.length} 个任务
        </span>
        {Object.entries(stats).map(([status, count]) => (
          <span
            key={status}
            className="text-gray-500 dark:text-gray-400"
          >
            {TASK_STATUS_LABELS[status] ?? status}: {count}
          </span>
        ))}
        {isLoading && (
          <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
            加载中...
          </span>
        )}
      </div>

      {/* Filters toolbar */}
      <TaskFilters />

      {/* Main view */}
      <div className="flex-1 min-h-0">
        {viewMode === 'kanban' ? (
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

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  )
}
