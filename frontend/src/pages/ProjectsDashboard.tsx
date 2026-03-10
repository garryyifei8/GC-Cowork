import React, { useEffect } from 'react';
import { Filter, Plus, Sparkles, AlertCircle, FolderOpen } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { ViewSwitcher } from '../components/projects/ViewSwitcher';
import { ProjectTable } from '../components/projects/ProjectTable';
import { KanbanBoard } from '../components/projects/KanbanBoard';
import { GanttChart } from '../components/projects/GanttChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import './ProjectsDashboard.css';

export const ProjectsDashboard: React.FC = () => {
  const { projects, isLoading, error, viewType, fetchProjects, setViewType } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const renderView = () => {
    if (isLoading) {
      return <LoadingSpinner text="加载项目数据..." />;
    }
    if (error) {
      return (
        <EmptyState
          icon={<AlertCircle size={40} />}
          title="加载失败"
          description={error}
          action={{ label: '重试', onClick: fetchProjects }}
        />
      );
    }
    if (projects.length === 0) {
      return (
        <EmptyState
          icon={<FolderOpen size={40} />}
          title="暂无项目"
          description='点击上方"新建立项"按钮创建第一个项目'
        />
      );
    }

    switch (viewType) {
      case 'table':
        return <ProjectTable projects={projects} />;
      case 'kanban':
        return <KanbanBoard projects={projects} />;
      case 'gantt':
        return <GanttChart projects={projects} />;
      default:
        return <ProjectTable projects={projects} />;
    }
  };

  const riskProject = projects.find((p) => p.status === 'risk');

  return (
    <div className="projects-dashboard animate-fade-in">
      {/* Header */}
      <div className="projects-header">
        <div className="projects-title">
          <h2>项目集概览</h2>
          <span className="projects-subtitle">
            {projects.length} 个项目 · 智能调度进行中
          </span>
        </div>
        <div className="projects-actions">
          <ViewSwitcher active={viewType} onChange={setViewType} />
          <button className="btn btn-outline hover-lift">
            <Filter size={16} /> 筛选
          </button>
          <button className="btn btn-primary">
            <Plus size={16} /> 新建立项
          </button>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="ai-insights-card hover-lift">
        <div className="insight-icon-wrap">
          <Sparkles size={18} />
        </div>
        <div className="insight-body">
          <h4 className="insight-title">智能调度洞察</h4>
          <p className="insight-desc">
            {riskProject
              ? `${riskProject.name}进度延后，建议关注并调配资源。已生成调整方案。`
              : '所有项目进度正常，暂无需要关注的风险项。'}
          </p>
          <div className="insight-actions">
            <button className="btn btn-primary btn--sm">一键调配资源</button>
            <button className="btn btn-outline btn--sm">查看详情</button>
          </div>
        </div>
      </div>

      {/* View content */}
      {renderView()}
    </div>
  );
};
