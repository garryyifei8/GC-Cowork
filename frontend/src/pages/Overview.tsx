import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Activity, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { useDashboardStore } from '../stores/dashboardStore';
import { useProjectStore } from '../stores/projectStore';
import StagePipeline from '../widgets/views/StagePipeline';
import TaskDonut from '../widgets/views/TaskDonut';
import ProjectProgress from '../widgets/views/ProjectProgress';
import BudgetOverview from '../widgets/views/BudgetOverview';
import RiskHeatmap from '../widgets/views/RiskHeatmap';
import ActivityFeed from '../widgets/views/ActivityFeed';
import ProjectHealthMatrix from '../widgets/views/ProjectHealthMatrix';
import ResourceHeatmap from '../widgets/views/ResourceHeatmap';

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
}

function getChineseDate(): string {
  const now = new Date();
  const wd = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · ${wd[now.getDay()]}`;
}

/* Preclinic-style KPI card */
interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon, iconBg, trend, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-[#E8ECF4] rounded-[10px] p-5 transition-all ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[22px] font-medium text-light-text leading-none">{value}</div>
        <div className="text-[13px] text-light-text-secondary mt-1">{label}</div>
      </div>
      {trend && (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            trend.startsWith('+') || trend.startsWith('↑')
              ? 'bg-[#E8F5E9] text-[#27AE60]'
              : 'bg-[#FFEBEE] text-[#E74C3C]'
          }`}
        >
          {trend}
        </span>
      )}
    </div>
  </div>
);

/* Card wrapper — Preclinic style */
const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({
  children,
  title,
  className = '',
}) => (
  <div className={`bg-white border border-[#E8ECF4] rounded-[10px] p-5 ${className}`}>
    {title && <h3 className="text-[16px] font-medium text-light-text mb-4">{title}</h3>}
    {children}
  </div>
);

export const Overview: React.FC = () => {
  const { metrics, fetchMetrics, fetchRecentActivities } = useDashboardStore();
  const { fetchProjects } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivities();
    fetchProjects();
  }, [fetchMetrics, fetchRecentActivities, fetchProjects]);

  const aiInsights = useMemo(() => metrics?.ai_insights ?? [], [metrics]);

  return (
    <div className="p-6 animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-[18px] font-bold text-light-text">{getGreeting()}，用户</h1>
        <p className="text-[13px] text-light-text-secondary mt-0.5">{getChineseDate()}</p>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="mb-6 p-4 rounded-[10px] bg-gradient-to-r from-[#00C875]/5 to-[#2E37A4]/5 border border-[#00C875]/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[13px] font-semibold text-primary">AI 洞察</span>
          </div>
          <div className="space-y-1.5">
            {aiInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] text-light-text">
                <AlertTriangle
                  size={13}
                  className={`mt-0.5 shrink-0 ${insight.severity === 'critical' ? 'text-[#E74C3C]' : insight.severity === 'warning' ? 'text-[#FFB264]' : 'text-[#00CAE3]'}`}
                />
                <span>
                  <span className="font-medium">{insight.title}</span>
                  <span className="text-light-text-secondary"> — {insight.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="项目总数"
          value={metrics?.total_projects ?? 0}
          icon={<FolderKanban size={22} className="text-[#00C875]" />}
          iconBg="bg-[#E6FAF0]"
          onClick={() => navigate('/projects')}
        />
        <KPICard
          label="活跃项目"
          value={metrics?.active_projects ?? 0}
          icon={<Activity size={22} className="text-[#0F79F3]" />}
          iconBg="bg-[#F4F9FE]"
          onClick={() => navigate('/projects')}
        />
        <KPICard
          label="风险项目"
          value={metrics?.at_risk_projects ?? 0}
          icon={<AlertTriangle size={22} className="text-[#E74C3C]" />}
          iconBg="bg-[#FEF4F4]"
        />
        <KPICard
          label="逾期任务"
          value={metrics?.overdue_tasks ?? 0}
          icon={<Clock size={22} className="text-[#FFB264]" />}
          iconBg="bg-[#FEFBF5]"
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Stage Pipeline */}
      <div className="mb-6">
        <StagePipeline />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <Card>
          <TaskDonut />
        </Card>
        <Card>
          <ProjectProgress />
        </Card>
        <Card>
          <BudgetOverview />
        </Card>
      </div>

      {/* Management Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <ProjectHealthMatrix />
        </Card>
        <Card>
          <ResourceHeatmap />
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RiskHeatmap />
        <Card title="活动动态">
          <ActivityFeed />
        </Card>
      </div>
    </div>
  );
};
