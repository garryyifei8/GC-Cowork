import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import type { Project, ProjectRiskSummary } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import { dashboardService } from '../../services/api';

const COLUMNS = [
  { key: 'active' as const, label: '进行中', color: '#00C875' },
  { key: 'risk' as const, label: '有风险', color: '#E2445C' },
  { key: 'planning' as const, label: '规划中', color: '#0086C0' },
  { key: 'completed' as const, label: '已完成', color: '#676879' },
];

const avatarColors = [
  '#6BBF59', '#00C875', '#FDAB3D', '#E2445C',
  '#0086C0', '#9B51E0', '#FF7A59', '#37B4E3',
];

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#00C875',
  medium: '#FDAB3D',
  high: '#E2445C',
  critical: '#9B1B30',
};

interface KanbanBoardProps {
  projects: Project[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects }) => {
  const navigate = useNavigate();
  const { updateProject, tasks, fetchTasks } = useProjectStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [riskMap, setRiskMap] = useState<Record<string, ProjectRiskSummary>>({});

  // Fetch tasks and risk data
  useEffect(() => {
    projects.forEach((p) => fetchTasks(p.id));
    dashboardService.getMetrics().then((m) => {
      const map: Record<string, ProjectRiskSummary> = {};
      m.project_risks.forEach((r) => { map[r.project_id] = r; });
      setRiskMap(map);
    }).catch(() => {});
  }, [projects, fetchTasks]);

  // Task stats per project
  const taskStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; overdue: number; blocked: number }> = {};
    const today = new Date().toISOString().slice(0, 10);
    for (const project of projects) {
      const ptasks = tasks[project.id] || [];
      stats[project.id] = {
        total: ptasks.length,
        done: ptasks.filter((t) => t.status === 'done').length,
        overdue: ptasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done').length,
        blocked: ptasks.filter((t) => t.status === 'blocked').length,
      };
    }
    return stats;
  }, [projects, tasks]);

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedId) {
      const labelMap: Record<string, string> = {
        active: '进行中',
        risk: '有风险',
        planning: '规划中',
        completed: '已完成',
      };
      updateProject(draggedId, {
        status: targetStatus as Project['status'],
        status_label: labelMap[targetStatus] || targetStatus,
      });
      setDraggedId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.key);
        return (
          <div
            key={col.key}
            className={
              `flex flex-col gap-3 min-h-[100px] rounded-xl p-3 border transition-colors duration-200 ` +
              (dragOverCol === col.key
                ? 'border-dashed border-primary bg-primary/5'
                : 'border-light-border dark:border-dark-border bg-slate-50 dark:bg-slate-800/50')
            }
            style={{ borderTopWidth: 4, borderTopColor: col.color, borderTopStyle: 'solid' }}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {colProjects.length}
              </span>
            </div>

            {/* Cards */}
            {colProjects.map((project) => {
              const risk = riskMap[project.id];
              const stats = taskStats[project.id] || { total: 0, done: 0, overdue: 0, blocked: 0 };
              const members = project.team_members || [];
              const shown = members.slice(0, 3);
              const remainder = project.team_size - shown.length;

              return (
                <div
                  key={project.id}
                  className={
                    `bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-3.5 transition-colors duration-200 cursor-grab active:cursor-grabbing hover:shadow-md ` +
                    (draggedId === project.id ? 'opacity-50 cursor-grabbing' : '')
                  }
                  draggable
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/projects/${project.id}`); }}
                >
                  {/* Title + Risk badge */}
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <h4 className="text-[13px] font-semibold flex-1 min-w-0">{project.name}</h4>
                    {risk && risk.risk_level !== 'low' && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
                        style={{
                          background: RISK_LEVEL_COLORS[risk.risk_level] + '1A',
                          color: RISK_LEVEL_COLORS[risk.risk_level],
                        }}
                        title={risk.top_risk}
                      >
                        <AlertTriangle size={10} />
                        {risk.risk_level === 'critical' ? '极高' : risk.risk_level === 'high' ? '高' : '中'}
                      </span>
                    )}
                  </div>

                  <span className="block text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2.5">
                    {project.project_type}
                  </span>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${project.progress_pct}%`,
                          backgroundColor: col.color,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-light-text-secondary dark:text-dark-text-secondary font-medium shrink-0">
                      {project.progress_pct}%
                    </span>
                  </div>

                  {/* Task stats row */}
                  {stats.total > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2 text-[11px]">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">
                        {stats.done}/{stats.total} 任务
                      </span>
                      {stats.overdue > 0 && (
                        <span className="text-danger flex items-center gap-0.5">
                          <Clock size={10} /> {stats.overdue} 逾期
                        </span>
                      )}
                      {stats.blocked > 0 && (
                        <span className="text-warning">
                          {stats.blocked} 阻塞
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer: date + team avatars */}
                  <div className="flex justify-between items-center text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {project.due_date && (
                      <span className="flex items-center gap-1">{project.due_date}</span>
                    )}
                    <div className="flex items-center ml-auto">
                      {shown.map((member, i) => (
                        <div
                          key={i}
                          className="w-[22px] h-[22px] rounded-full text-white text-[10px] font-semibold flex items-center justify-center border-2 border-light-surface dark:border-dark-surface -ml-1 first:ml-0"
                          style={{ background: avatarColors[(member.charCodeAt(0) + i) % avatarColors.length] }}
                          title={member}
                        >
                          {member[0]}
                        </div>
                      ))}
                      {remainder > 0 && (
                        <div className="w-[22px] h-[22px] rounded-full bg-slate-200 dark:bg-slate-600 text-light-text-secondary dark:text-dark-text-secondary text-[9px] font-semibold flex items-center justify-center border-2 border-light-surface dark:border-dark-surface -ml-1">
                          +{remainder}
                        </div>
                      )}
                      {shown.length === 0 && (
                        <span className="font-medium">{project.team_size}人</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
