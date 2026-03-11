import React from 'react';
import {
  Building2,
  MonitorPlay,
  Map,
  Plus,
  Filter,
  Sparkles,
  Zap
} from 'lucide-react';

const mockProjects = [
  {
    id: 1,
    title: '省立博物馆EPC工程',
    type: 'EPC / 展馆设计与施工',
    status: 'active',
    statusLabel: '施工中',
    progress: 68,
    dueDate: '2026-10-15',
    budget: '1.2亿',
    icon: <Map size={20} />,
    color: '#00ca72', // Avocado Green
    teamSize: 12
  },
  {
    id: 2,
    title: '发改委平台信息化二期',
    type: '政府信息化开发',
    status: 'risk',
    statusLabel: '延期风险',
    progress: 35,
    dueDate: '2026-06-30',
    budget: '450万',
    icon: <MonitorPlay size={20} />,
    color: '#e2445c', // Red meaning alert
    teamSize: 8
  },
  {
    id: 3,
    title: '智慧园区专项债可研',
    type: '咨询 / 评审准备',
    status: 'planning',
    statusLabel: '立项评估',
    progress: 15,
    dueDate: '2026-04-20',
    budget: '80万',
    icon: <Building2 size={20} />,
    color: '#0086c0', // Blue
    teamSize: 5
  }
];

const statusBadgeClasses: Record<string, string> = {
  active: 'bg-success/10 text-success',
  risk: 'bg-danger/10 text-danger',
  planning: 'bg-info/10 text-info',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export const ProjectsDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-light-text dark:text-dark-text mb-1">
            项目集概览
          </h2>
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            3 个活跃项目 · 智能调度进行中状态正常
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-light-border dark:border-dark-border text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-light-text dark:text-dark-text">
            <Filter size={16} />
            筛选与视图
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
            <Plus size={16} />
            新建智能立项
          </button>
        </div>
      </div>

      {/* AI insight banner */}
      <div className="bg-gradient-to-r from-primary/5 to-info/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-success/10 text-primary-dark shrink-0 mt-0.5">
            <Sparkles size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold flex items-center gap-2 mb-1 text-light-text dark:text-dark-text">
              智能调度洞察
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-info/10 text-info font-semibold">
                AI 预判
              </span>
            </h4>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">
              发改委平台信息化二期后端进度延后3天，已导致测试产生瓶颈。建议将博物馆项目空闲的1名全栈工程师调配至本组，匹配度 92%。
            </p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
                <Zap size={14} />
                一键执行资源调配
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-light-border dark:border-dark-border text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-light-text dark:text-dark-text">
                查看风险影响面
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8 overflow-y-auto">
        {mockProjects.map(project => (
          <div
            key={project.id}
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-px transition-all duration-200 cursor-pointer group flex flex-col"
          >
            {/* Colored top accent bar */}
            <div className="h-1 w-full shrink-0" style={{ backgroundColor: project.color }} />

            {/* Card body */}
            <div className="p-5 flex flex-col gap-4 flex-1">
              {/* Icon + status badge row */}
              <div className="flex items-start justify-between">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.icon}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${statusBadgeClasses[project.status] ?? statusBadgeClasses.completed}`}
                >
                  {project.statusLabel}
                </span>
              </div>

              {/* Title + type */}
              <div>
                <h3 className="text-lg font-semibold leading-snug mb-0.5 text-light-text dark:text-dark-text">
                  {project.title}
                </h3>
                <p className="text-[13px] text-light-text-secondary dark:text-dark-text-secondary">
                  {project.type}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-lg p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wide">
                    截止日期
                  </span>
                  <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                    {project.dueDate}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wide">
                    预算总额
                  </span>
                  <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                    {project.budget}
                  </span>
                </div>
              </div>

              {/* Footer: avatars + progress */}
              <div className="flex items-end justify-between mt-auto">
                {/* Avatar group */}
                <div className="flex">
                  {[...Array(Math.min(project.teamSize, 4))].map((_, i) => (
                    <img
                      key={i}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.title}${i}&backgroundColor=e6e9ef`}
                      alt="Team member"
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-surface bg-slate-100 dark:bg-slate-700 -ml-2 first:ml-0"
                    />
                  ))}
                  {project.teamSize > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-surface bg-slate-100 dark:bg-slate-700 -ml-2 flex items-center justify-center text-[10px] font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                      +{project.teamSize - 4}
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="flex flex-col items-end gap-1.5 flex-1 ml-4">
                  <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                    {project.progress}%
                  </span>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
