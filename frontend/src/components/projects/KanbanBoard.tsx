import React, { useState } from 'react';
import type { Project } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import './KanbanBoard.css';

const COLUMNS = [
  { key: 'active' as const, label: '进行中', color: '#00C875' },
  { key: 'risk' as const, label: '有风险', color: '#E2445C' },
  { key: 'planning' as const, label: '规划中', color: '#0086C0' },
  { key: 'completed' as const, label: '已完成', color: '#676879' },
];

interface KanbanBoardProps {
  projects: Project[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects }) => {
  const { updateProject } = useProjectStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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
      // Map status to status_label
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
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.key);
        return (
          <div
            key={col.key}
            className={`kanban-column${dragOverCol === col.key ? ' kanban-column--drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="kanban-column-header" style={{ borderTopColor: col.color }}>
              <span className="kanban-column-title">{col.label}</span>
              <span className="kanban-column-count">{colProjects.length}</span>
            </div>
            <div className="kanban-column-body">
              {colProjects.map((project) => (
                <div
                  key={project.id}
                  className={`kanban-card${draggedId === project.id ? ' kanban-card--dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  onDragEnd={handleDragEnd}
                >
                  <h4 className="kanban-card-title">{project.name}</h4>
                  <span className="kanban-card-type">{project.project_type}</span>
                  <div className="kanban-card-progress">
                    <div className="kanban-progress-bar">
                      <div
                        className="kanban-progress-fill"
                        style={{
                          width: `${project.progress_pct}%`,
                          background: col.color,
                        }}
                      />
                    </div>
                    <span className="kanban-progress-text">{project.progress_pct}%</span>
                  </div>
                  <div className="kanban-card-footer">
                    {project.due_date && (
                      <span className="kanban-card-date">{project.due_date}</span>
                    )}
                    <span className="kanban-card-team">{project.team_size}人</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
