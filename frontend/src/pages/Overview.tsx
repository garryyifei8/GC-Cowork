import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useProjectStore } from '../stores/projectStore'
import StagePipeline from '../widgets/views/StagePipeline'
import TaskDonut from '../widgets/views/TaskDonut'
import ProjectProgress from '../widgets/views/ProjectProgress'
import BudgetOverview from '../widgets/views/BudgetOverview'
import RiskHeatmap from '../widgets/views/RiskHeatmap'
import ActivityFeed from '../widgets/views/ActivityFeed'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function getChineseDate(): string {
  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · ${weekdays[now.getDay()]}`
}

interface MetricCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconColor: string
  onClick?: () => void
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, iconColor, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : ''}`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
  </div>
)

export const Overview: React.FC = () => {
  const { metrics, fetchMetrics, fetchRecentActivities } = useDashboardStore()
  const { fetchProjects } = useProjectStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchMetrics()
    fetchRecentActivities()
    fetchProjects()
  }, [fetchMetrics, fetchRecentActivities, fetchProjects])

  const aiInsights = useMemo(() => metrics?.ai_insights ?? [], [metrics])

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}，用户 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getChineseDate()}</p>
      </div>

      {/* AI Insights Banner */}
      {aiInsights.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-semibold text-primary">AI 洞察</span>
          </div>
          <div className="space-y-2">
            {aiInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${insight.severity === 'critical' ? 'text-red-500' : insight.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                <div>
                  <span className="font-medium">{insight.title}</span>
                  <span className="text-gray-500 dark:text-gray-400"> — {insight.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="项目总数"
          value={metrics?.total_projects ?? 0}
          icon={<FolderKanban size={20} />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          label="活跃项目"
          value={metrics?.active_projects ?? 0}
          icon={<Activity size={20} />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          label="风险项目"
          value={metrics?.at_risk_projects ?? 0}
          icon={<AlertTriangle size={20} />}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <MetricCard
          label="逾期任务"
          value={metrics?.overdue_tasks ?? 0}
          icon={<Clock size={20} />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Stage Pipeline */}
      <div className="mb-6">
        <StagePipeline />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <TaskDonut />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <ProjectProgress />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <BudgetOverview />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <RiskHeatmap />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">活动动态</h3>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
