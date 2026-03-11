import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  '#6BBF59', '#00C875', '#FDAB3D', '#E2445C',
  '#0086C0', '#9B51E0', '#FF7A59', '#37B4E3',
];

// Team avatar stack component
const TeamStack: React.FC<{ teamSize: number; projectName: string }> = ({ teamSize, projectName }) => {
  const visibleCount = Math.min(teamSize, 3);
  const remainder = teamSize - visibleCount;
  return (
    <div className="flex items-center">
      {Array.from({ length: visibleCount }).map((_, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center border-2 border-light-surface dark:border-dark-surface -ml-1 first:ml-0"
          style={{ background: avatarColors[i % avatarColors.length] }}
          title={`${projectName} 成员 ${i + 1}`}
        >
          {String.fromCharCode(65 + (projectName.charCodeAt(0) + i) % 26)}
        </div>
      ))}
      {remainder > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 text-light-text-secondary dark:text-dark-text-secondary text-[10px] font-semibold flex items-center justify-center border-2 border-light-surface dark:border-dark-surface -ml-1">
          +{remainder}
        </div>
      )}
    </div>
  );
};

// Single project row
const ProjectRow: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  const { icon, color } = getProjectIcon(project.project_type);
  const progressColor =
    project.status === 'active' ? 'var(--color-success)' :
    project.status === 'risk' ? 'var(--color-danger)' :
    'var(--color-info)';

  return (
    <tr
      className="border-t border-light-border/50 dark:border-dark-border/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`查看项目: ${project.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/projects/${project.id}`); }}
    >
      {/* Name */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: color + '1A', color }}
          >
            {icon}
          </span>
          <span className="font-medium truncate">{project.name}</span>
        </div>
      </td>
      {/* Type */}
      <td className="px-4 py-3 text-sm">
        <span className="text-light-text-secondary dark:text-dark-text-secondary">{project.project_type}</span>
      </td>
      {/* Status */}
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={getStatusVariant(project.status)} label={project.status_label} size="sm" />
      </td>
      {/* Progress */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${project.progress_pct}%`, background: progressColor }}
            />
          </div>
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary shrink-0">
            {project.progress_pct}%
          </span>
        </div>
      </td>
      {/* Due date */}
      <td className="px-4 py-3 text-sm">
        <span className="text-light-text-secondary dark:text-dark-text-secondary">{project.due_date || '-'}</span>
      </td>
      {/* Budget */}
      <td className="px-4 py-3 text-sm">
        <span>{project.budget || '-'}</span>
      </td>
      {/* Team */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <TeamStack teamSize={project.team_size} projectName={project.name} />
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{project.team_size}人</span>
        </div>
      </td>
    </tr>
  );
};

// Group section with header
const GroupSection: React.FC<{
  label: string;
  color: string;
  bgTint: string;
  projects: Project[];
}> = ({ label, color, bgTint, projects }) => (
  <>
    <tr>
      <td
        colSpan={7}
        className="px-4 py-2 text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase"
        style={{ background: bgTint, borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown size={14} style={{ color }} />
          <span style={{ color }}>{label}</span>
          <span className="text-light-text-secondary dark:text-dark-text-secondary font-normal normal-case ml-1">
            ({projects.length})
          </span>
        </div>
      </td>
    </tr>
    {projects.map((project) => (
      <ProjectRow key={project.id} project={project} />
    ))}
  </>
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
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl transition-colors duration-200 overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            {['项目名称', '类型', '状态', '进度', '截止日期', '预算', '团队'].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeProjects.length > 0 && (
            <GroupSection label="活跃项目" color="#00C875" bgTint="rgba(0, 200, 117, 0.06)" projects={activeProjects} />
          )}
          {planningProjects.length > 0 && (
            <GroupSection label="规划中" color="#0086C0" bgTint="rgba(0, 134, 192, 0.06)" projects={planningProjects} />
          )}
          {completedProjects.length > 0 && (
            <GroupSection label="已完成" color="#676879" bgTint="rgba(103, 104, 121, 0.06)" projects={completedProjects} />
          )}
        </tbody>
      </table>
    </div>
  );
};
