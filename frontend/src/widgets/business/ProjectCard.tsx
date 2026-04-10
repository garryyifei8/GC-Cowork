import React from 'react';
import { Clock } from 'lucide-react';
import { ProgressBar, StatusBadge, AvatarGroup } from '../atomic';
import type { StatusVariant } from '../atomic';
import type { Project } from '../../types';

export interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  active: 'success',
  risk: 'danger',
  planning: 'info',
  completed: 'default',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  active: '进行中',
  risk: '有风险',
  planning: '规划中',
  completed: '已完成',
};

function memberToAvatar(name: string): { src: string; alt: string } {
  const seed = encodeURIComponent(name);
  return {
    src: `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`,
    alt: name,
  };
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const avatars = (project.team_members ?? []).slice(0, 5).map(memberToAvatar);

  return (
    <div
      className={[
        'bg-white border border-[#E8ECF4] rounded-[10px] p-3.5',
        'transition-all duration-200 hover:shadow-md',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={() => onClick?.(project)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter') onClick(project);
            }
          : undefined
      }
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <h4 className="text-[13px] font-semibold flex-1 min-w-0 text-light-text truncate">
          {project.name}
        </h4>
        <StatusBadge
          status={STATUS_VARIANT_MAP[project.status] ?? 'default'}
          label={project.status_label || STATUS_LABEL_MAP[project.status] || project.status}
          size="sm"
        />
      </div>

      <span className="block text-xs text-light-text-secondary mb-2.5">{project.project_type}</span>

      {/* Progress bar */}
      <div className="mb-2">
        <ProgressBar value={project.progress_pct} size="sm" showLabel />
      </div>

      {/* Footer: due date + team avatars */}
      <div className="flex justify-between items-center text-xs text-light-text-secondary">
        {project.due_date && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {project.due_date}
          </span>
        )}
        <div className="ml-auto">
          {avatars.length > 0 ? (
            <AvatarGroup avatars={avatars} max={3} size="sm" />
          ) : (
            <span className="font-medium">{project.team_size}人</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
