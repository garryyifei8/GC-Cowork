import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, MonitorPlay, Building2, ChevronDown } from 'lucide-react'
import { StatusBadge, ProgressBar, AvatarGroup } from '../atomic'
import type { StatusVariant } from '../atomic'
import { useProjectStore } from '../../stores/projectStore'
import type { Project } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'active': return 'success'
    case 'risk': return 'danger'
    case 'planning': return 'info'
    case 'completed': return 'default'
    default: return 'default'
  }
}

function getProjectIcon(projectType: string): { icon: React.ReactNode; color: string } {
  if (projectType.includes('EPC') || projectType.includes('展馆'))
    return { icon: <Map size={16} />, color: '#00C875' }
  if (projectType.includes('信息化'))
    return { icon: <MonitorPlay size={16} />, color: '#E74C3C' }
  return { icon: <Building2 size={16} />, color: '#0086C0' }
}

function memberToAvatar(name: string) {
  const seed = encodeURIComponent(name)
  return {
    src: `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`,
    alt: name,
  }
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

const ProjectRow: React.FC<{ project: Project; onClick?: (p: Project) => void }> = ({ project, onClick }) => {
  const navigate = useNavigate()
  const { icon, color } = getProjectIcon(project.project_type)

  const handleClick = () => {
    if (onClick) onClick(project)
    else navigate(`/projects/${project.id}`)
  }

  const avatars = (project.team_members ?? []).slice(0, 5).map(memberToAvatar)

  return (
    <tr
      className="border-t border-[#E8ECF4]/50 /50 hover:bg-[#EFF3F9]  cursor-pointer transition-colors"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`查看项目: ${project.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: color + '1A', color }}>
            {icon}
          </span>
          <span className="font-medium truncate text-light-text ">{project.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-light-text-secondary ">{project.project_type}</td>
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={getStatusVariant(project.status)} label={project.status_label} size="sm" />
      </td>
      <td className="px-4 py-3 text-sm">
        <ProgressBar value={project.progress_pct} size="sm" showLabel />
      </td>
      <td className="px-4 py-3 text-sm text-light-text-secondary ">{project.due_date || '-'}</td>
      <td className="px-4 py-3 text-sm text-light-text ">{project.budget || '-'}</td>
      <td className="px-4 py-3 text-sm">
        {avatars.length > 0 ? (
          <AvatarGroup avatars={avatars} max={3} size="sm" />
        ) : (
          <span className="text-xs text-light-text-secondary ">{project.team_size}人</span>
        )}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Group section
// ---------------------------------------------------------------------------

const GroupSection: React.FC<{
  label: string
  color: string
  bgTint: string
  projects: Project[]
  onProjectClick?: (p: Project) => void
}> = ({ label, color, bgTint, projects, onProjectClick }) => (
  <>
    <tr>
      <td
        colSpan={7}
        className="px-4 py-2 text-xs font-semibold text-light-text-secondary  uppercase"
        style={{ background: bgTint, borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown size={14} style={{ color }} />
          <span style={{ color }}>{label}</span>
          <span className="text-light-text-secondary  font-normal normal-case ml-1">({projects.length})</span>
        </div>
      </td>
    </tr>
    {projects.map((project) => (
      <ProjectRow key={project.id} project={project} onClick={onProjectClick} />
    ))}
  </>
)

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProjectTableProps {
  data?: { projects?: Project[] }
  onProjectClick?: (project: Project) => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ProjectTable: React.FC<ProjectTableProps> = ({ data, onProjectClick }) => {
  const storeProjects = useProjectStore((s) => s.projects)
  const projects = data?.projects ?? storeProjects

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'risk')
  const planningProjects = projects.filter((p) => p.status === 'planning')
  const completedProjects = projects.filter((p) => p.status === 'completed')

  return (
    <div className="bg-white  border border-[#E8ECF4]  rounded-[10px] transition-colors duration-200 overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="bg-[#E6FAF0] ">
            {['项目名称', '类型', '状态', '进度', '截止日期', '预算', '团队'].map((heading) => (
              <th key={heading} className="px-5 py-[18px] text-left text-xs font-medium text-light-text-secondary  uppercase tracking-wider">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeProjects.length > 0 && (
            <GroupSection label="活跃项目" color="#00C875" bgTint="rgba(0, 200, 117, 0.06)" projects={activeProjects} onProjectClick={onProjectClick} />
          )}
          {planningProjects.length > 0 && (
            <GroupSection label="规划中" color="#0086C0" bgTint="rgba(0, 134, 192, 0.06)" projects={planningProjects} onProjectClick={onProjectClick} />
          )}
          {completedProjects.length > 0 && (
            <GroupSection label="已完成" color="#919AA3" bgTint="rgba(145, 154, 163, 0.06)" projects={completedProjects} onProjectClick={onProjectClick} />
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ProjectTable
