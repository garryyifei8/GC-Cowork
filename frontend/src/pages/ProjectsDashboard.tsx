import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ViewSwitcher } from '../widgets/atomic'
import { ProjectTable, ProjectKanban, GanttChart } from '../widgets/views'
import { LoadingSpinner } from '../widgets/atomic'
import { ProjectCreateDrawer } from '../components/projects/ProjectCreateDrawer'
import { useProjectStore } from '../stores/projectStore'
import { projectService } from '../services/api'

export const ProjectsDashboard = () => {
  const navigate = useNavigate()
  const { projects, isLoading, viewType, setViewType, fetchProjects } = useProjectStore()
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async (data: {
    name: string
    project_type?: string
    budget_display?: string
    due_date?: string
    description?: string
    manager?: string
  }) => {
    const created = await projectService.create(data)
    await fetchProjects()
    navigate(`/projects/${created.id}`)
  }

  if (isLoading && projects.length === 0) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-light-text">项目管理</h1>
        <div className="flex items-center gap-3">
          <ViewSwitcher active={viewType} onChange={setViewType} />
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            新建项目
          </button>
        </div>
      </div>

      {/* View */}
      {viewType === 'table' && <ProjectTable onProjectClick={(p) => navigate(`/projects/${p.id}`)} />}
      {viewType === 'kanban' && <ProjectKanban onProjectClick={(p) => navigate(`/projects/${p.id}`)} />}
      {viewType === 'gantt' && <GanttChart />}

      {/* Create project drawer */}
      <ProjectCreateDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
