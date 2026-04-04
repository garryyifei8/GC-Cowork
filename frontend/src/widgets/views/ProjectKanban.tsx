import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProjectCard } from '../business'
import { EmptyState } from '../atomic'
import { useProjectStore } from '../../stores/projectStore'
import type { Project } from '../../types'

// ---------------------------------------------------------------------------
// Column definitions (group by project status / stage)
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: 'active' as const, label: '进行中', color: '#00C875' },
  { key: 'risk' as const, label: '有风险', color: '#E74C3C' },
  { key: 'planning' as const, label: '规划中', color: '#0086C0' },
  { key: 'completed' as const, label: '已完成', color: '#919AA3' },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProjectKanbanProps {
  data?: { projects?: Project[] }
  onProjectClick?: (project: Project) => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ProjectKanban: React.FC<ProjectKanbanProps> = ({ data, onProjectClick }) => {
  const navigate = useNavigate()
  const storeProjects = useProjectStore((s) => s.projects)
  const updateProject = useProjectStore((s) => s.updateProject)
  const projects = data?.projects ?? storeProjects

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedId(projectId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', projectId)
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
      const labelMap: Record<string, string> = {
        active: '进行中',
        risk: '有风险',
        planning: '规划中',
        completed: '已完成',
      }
      updateProject(draggedId, {
        status: targetStatus as Project['status'],
        status_label: labelMap[targetStatus] || targetStatus,
      })
      setDraggedId(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverCol(null)
  }

  const handleCardClick = (project: Project) => {
    if (onProjectClick) onProjectClick(project)
    else navigate(`/projects/${project.id}`)
  }

  if (projects.length === 0) {
    return <EmptyState icon="folder" title="暂无项目" description="创建项目开始管理" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.key)
        return (
          <div
            key={col.key}
            className={[
              'flex flex-col gap-3 min-h-[100px] rounded-[10px] p-3 border transition-colors duration-200',
              dragOverCol === col.key
                ? 'border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-[#E8ECF4]  bg-[#F4F6FC] /60',
            ].join(' ')}
            style={{ borderTopWidth: 4, borderTopColor: col.color, borderTopStyle: 'solid' }}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-light-text ">{col.label}</span>
              <span className="text-xs text-light-text-secondary  bg-[#E8ECF4]  px-2 py-0.5 rounded-full">
                {colProjects.length}
              </span>
            </div>

            {/* Cards */}
            {colProjects.map((project) => (
              <div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                onDragEnd={handleDragEnd}
                className={draggedId === project.id ? 'opacity-50 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
              >
                <ProjectCard
                  project={project}
                  onClick={handleCardClick}
                />
              </div>
            ))}

            {colProjects.length === 0 && (
              <div className="flex items-center justify-center py-8 text-xs text-[#919AA3]  border-2 border-dashed border-[#E8ECF4]  rounded-[10px]">
                暂无项目
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProjectKanban
