import React from 'react';
import { Map, MonitorPlay, Building2, ChevronDown } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { StatusVariant } from '../ui/StatusBadge';
import type { Project } from '../../types';

// Map status to StatusBadge variant
function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'active': return 'success';
    case 'risk': return 'danger';
    case 'planning': return 'info';
    case 'completed': return 'default';
    default: return 'default';
  }
}

// Map project type to icon + color
function getProjectIcon(projectType: string): { icon: React.ReactNode; color: string } {
  if (projectType.includes('EPC') || projectType.includes('展馆')) {
    return { icon: <Map size={16} />, color: '#00C875' };
  }
  if (projectType.includes('信息化')) {
    return { icon: <MonitorPlay size={16} />, color: '#E2445C' };
  }
  return { icon: <Building2 size={16} />, color: '#0086C0' };
}

const avatarColors = [
  '#6161FF', '#00C875', '#FDAB3D', '#E2445C',
  '#0086C0', '#9B51E0', '#FF7A59', '#37B4E3',
];

// Team avatar stack component
const TeamStack: React.FC<{ teamSize: number; projectName: string }> = ({ teamSize, projectName }) => {
  const visibleCount = Math.min(teamSize, 3);
  const remainder = teamSize - visibleCount;
  return (
    <div className="team-stack">
      {Array.from({ length: visibleCount }).map((_, i) => (
        <div
          key={i}
          className="team-avatar-circle"
          style={{ background: avatarColors[i % avatarColors.length] }}
          title={`${projectName} 成员 ${i + 1}`}
        >
          {String.fromCharCode(65 + (projectName.charCodeAt(0) + i) % 26)}
        </div>
      ))}
      {remainder > 0 && (
        <div className="team-avatar-circle team-avatar-count">+{remainder}</div>
      )}
    </div>
  );
};

// Single project row
const ProjectRow: React.FC<{ project: Project }> = ({ project }) => {
  const { icon, color } = getProjectIcon(project.project_type);
  const progressColor =
    project.status === 'active' ? 'var(--color-success)' :
    project.status === 'risk' ? 'var(--color-danger)' :
    'var(--color-info)';

  return (
    <div className="board-row">
      <div className="board-cell board-cell--name">
        <span className="project-row-icon" style={{ background: color + '1A', color }}>
          {icon}
        </span>
        <span className="project-row-title">{project.name}</span>
      </div>
      <div className="board-cell board-cell--type">
        <span className="cell-text-muted">{project.project_type}</span>
      </div>
      <div className="board-cell board-cell--status">
        <StatusBadge status={getStatusVariant(project.status)} label={project.status_label} size="sm" />
      </div>
      <div className="board-cell board-cell--progress">
        <div className="progress-bar-inline">
          <div className="progress-bar-fill" style={{ width: `${project.progress_pct}%`, background: progressColor }} />
        </div>
        <span className="progress-bar-pct">{project.progress_pct}%</span>
      </div>
      <div className="board-cell board-cell--due">
        <span className="cell-text-muted">{project.due_date || '-'}</span>
      </div>
      <div className="board-cell board-cell--budget">
        <span className="cell-text-main">{project.budget || '-'}</span>
      </div>
      <div className="board-cell board-cell--team">
        <TeamStack teamSize={project.team_size} projectName={project.name} />
        <span className="team-count-label">{project.team_size}人</span>
      </div>
    </div>
  );
};

// Group section with header
const GroupSection: React.FC<{
  label: string;
  color: string;
  bgTint: string;
  projects: Project[];
}> = ({ label, color, bgTint, projects }) => (
  <div className="board-group">
    <div className="group-header" style={{ borderLeftColor: color, background: bgTint }}>
      <ChevronDown size={14} style={{ color }} />
      <span className="group-header-label" style={{ color }}>{label}</span>
      <span className="group-header-count">{projects.length}</span>
    </div>
    {projects.map((project) => (
      <ProjectRow key={project.id} project={project} />
    ))}
  </div>
);

// Main table component
interface ProjectTableProps {
  projects: Project[];
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects }) => {
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'risk');
  const planningProjects = projects.filter((p) => p.status === 'planning');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  return (
    <div className="projects-board">
      <div className="board-header-row">
        <div className="board-cell board-cell--name">项目名称</div>
        <div className="board-cell board-cell--type">类型</div>
        <div className="board-cell board-cell--status">状态</div>
        <div className="board-cell board-cell--progress">进度</div>
        <div className="board-cell board-cell--due">截止日期</div>
        <div className="board-cell board-cell--budget">预算</div>
        <div className="board-cell board-cell--team">团队</div>
      </div>

      {activeProjects.length > 0 && (
        <GroupSection label="活跃项目" color="#00C875" bgTint="rgba(0, 200, 117, 0.06)" projects={activeProjects} />
      )}
      {planningProjects.length > 0 && (
        <GroupSection label="规划中" color="#0086C0" bgTint="rgba(0, 134, 192, 0.06)" projects={planningProjects} />
      )}
      {completedProjects.length > 0 && (
        <GroupSection label="已完成" color="#676879" bgTint="rgba(103, 104, 121, 0.06)" projects={completedProjects} />
      )}
    </div>
  );
};
