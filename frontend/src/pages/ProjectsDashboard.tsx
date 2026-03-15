import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { ViewSwitcher } from '../widgets/atomic'
import { ProjectTable, ProjectKanban, GanttChart } from '../widgets/views'
import { LoadingSpinner } from '../widgets/atomic'
import { useProjectStore } from '../stores/projectStore'
import { projectService } from '../services/api'

export const ProjectsDashboard = () => {
  const navigate = useNavigate()
  const { projects, isLoading, viewType, setViewType, fetchProjects } = useProjectStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const created = await projectService.create({
        name: newName.trim(),
        project_type: newType.trim() || undefined,
      })
      setShowCreate(false)
      setNewName('')
      setNewType('')
      await fetchProjects()
      navigate(`/projects/${created.id}`)
    } finally {
      setCreating(false)
    }
  }

  if (isLoading && projects.length === 0) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">项目管理</h1>
        <div className="flex items-center gap-3">
          <ViewSwitcher active={viewType} onChange={setViewType} />
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            新建项目
          </button>
        </div>
      </div>

      {/* Create project inline form */}
      {showCreate && (
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-blue-500/30 rounded-xl">
          <input
            type="text"
            placeholder="项目名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            autoFocus
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="项目类型 (可选)"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            className="w-48 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {creating ? '创建中...' : '创建'}
          </button>
          <button
            onClick={() => { setShowCreate(false); setNewName(''); setNewType('') }}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* View */}
      {viewType === 'table' && <ProjectTable onProjectClick={(p) => navigate(`/projects/${p.id}`)} />}
      {viewType === 'kanban' && <ProjectKanban onProjectClick={(p) => navigate(`/projects/${p.id}`)} />}
      {viewType === 'gantt' && <GanttChart />}
    </div>
  )
}
