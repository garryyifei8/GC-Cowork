import React, { useMemo, useEffect } from 'react';
import {
  FolderKanban,
  Sparkles,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  Users,
  Wallet,
  ShieldAlert,
} from 'lucide-react';
import { useDashboardStore } from '../stores/dashboardStore';
import { useProjectStore } from '../stores/projectStore';
import { hrService, financeService } from '../services/api';
import type { AIInsight, ActivityEvent, HRSummary, FinanceSummary } from '../types';
import { StagePipeline } from '../components/dashboard/StagePipeline';
import { TaskStatusDonut } from '../components/dashboard/TaskStatusDonut';
import { ProjectProgressChart } from '../components/dashboard/ProjectProgressChart';
import { BudgetOverview } from '../components/dashboard/BudgetOverview';
import { RiskHeatmap } from '../components/dashboard/RiskHeatmap';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function getChineseDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];
  return `${year}年${month}月${day}日 · ${weekday}`;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  const d = new Date(isoString);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// Maps event_type to a Tailwind color name used for bg-{color}/10 and text-{color}
function getActivityDotColorClass(eventType: string): string {
  switch (eventType) {
    case 'task_created':    return 'bg-primary';
    case 'task_updated':    return 'bg-info';
    case 'stage_transition': return 'bg-success';
    case 'status_changed':  return 'bg-warning';
    default:                return 'bg-slate-400';
  }
}

// ── ProgressRing ──────────────────────────────────────────────────────────────

interface ProgressRingProps {
  rate: number;
  size?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ rate, size = 48 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  let color = '#e2445c'; // danger
  if (rate >= 80) color = '#00ca72';      // success
  else if (rate >= 50) color = '#f59e0b'; // warning

  return (
    <svg
      width={size}
      height={size}
      className="block"
      aria-label={`完成率 ${rate}%`}
      role="img"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={5}
        fill="none"
        className="stroke-slate-200 dark:stroke-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={5}
        fill="none"
        stroke={color}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 700, fontFamily: 'inherit', fill: color }}
      >
        {Math.round(rate)}%
      </text>
    </svg>
  );
};

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  /** Inline hex/rgb color for the icon tint — used via inline style since arbitrary values aren't always safe */
  accentColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, value, label, accentColor }) => (
  <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 flex flex-col gap-2 transition-colors duration-200 hover:-translate-y-px">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-1"
      style={{ color: accentColor, backgroundColor: `${accentColor}1a` }}
      aria-hidden="true"
    >
      {icon}
    </div>
    {value != null && (
      <div className="text-2xl font-bold font-heading leading-none min-h-8 flex items-center">
        {value}
      </div>
    )}
    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium">
      {label}
    </div>
  </div>
);

// ── InsightCard ───────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: AIInsight;
  projectNameMap: Map<string, string>;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, projectNameMap }) => {
  const borderColor =
    insight.severity === 'critical'
      ? '#9B1B30'
      : insight.severity === 'warning'
      ? '#f59e0b'
      : '#0086c0';

  const iconColorClass =
    insight.severity === 'critical'
      ? 'text-danger'
      : insight.severity === 'warning'
      ? 'text-warning'
      : 'text-primary';

  const IconComponent =
    insight.severity === 'critical'
      ? ShieldAlert
      : insight.severity === 'warning'
      ? AlertTriangle
      : Sparkles;

  const projectName = insight.project_id
    ? (projectNameMap.get(insight.project_id) ?? insight.project_id)
    : null;

  return (
    <div
      className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-2 last:mb-0 border-l-[3px] relative"
      style={{ borderLeftColor: borderColor }}
    >
      <div className={`flex-shrink-0 mt-0.5 ${iconColorClass}`} aria-hidden="true">
        <IconComponent size={18} />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="text-sm font-semibold">{insight.title}</div>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
          {insight.description}
        </p>
        {projectName && (
          <span className="inline-block text-[11px] font-semibold text-info bg-info/10 px-2 py-0.5 rounded-full mt-1 self-start">
            {projectName}
          </span>
        )}
      </div>
    </div>
  );
};

// ── ActivityRow ───────────────────────────────────────────────────────────────

interface ActivityRowProps {
  activity: ActivityEvent;
  isLast: boolean;
  projectNameMap: Map<string, string>;
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, isLast, projectNameMap }) => {
  const dotColorClass = getActivityDotColorClass(activity.event_type);
  const relTime = formatRelativeTime(activity.created_at);
  const projectName = projectNameMap.get(activity.project_id);

  return (
    <div className="flex gap-3 relative">
      {/* Timeline connector line — shown on all rows except the last */}
      {!isLast && (
        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
      )}
      {/* Dot */}
      <div
        className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 ${dotColorClass}`}
        aria-hidden="true"
      />
      {/* Content */}
      <div className="flex-1 flex flex-col gap-0.5 pb-4">
        <span className="text-sm leading-snug flex items-baseline flex-wrap gap-1">
          {projectName && (
            <span className="inline-flex items-center text-[11px] font-semibold text-primary bg-primary/10 px-1.5 py-px rounded-full whitespace-nowrap flex-shrink-0">
              {projectName}
            </span>
          )}
          {activity.summary}
        </span>
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
          {relTime}
        </span>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const Overview: React.FC = () => {
  const {
    metrics,
    recentActivities,
    isLoading,
    error,
    fetchMetrics,
    fetchRecentActivities,
  } = useDashboardStore();

  const { projects, fetchProjects } = useProjectStore();

  const [hrSummary, setHrSummary] = React.useState<HRSummary | null>(null);
  const [financeSummary, setFinanceSummary] = React.useState<FinanceSummary | null>(null);

  const greeting = useMemo(() => getGreeting(), []);
  const chineseDate = useMemo(() => getChineseDate(), []);

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivities(8);
    fetchProjects();
    hrService.getSummary().then(setHrSummary).catch(() => {});
    financeService.getSummary().then(setFinanceSummary).catch(() => {});
  }, [fetchMetrics, fetchRecentActivities, fetchProjects]);

  // Build project name map (project_id -> project_name)
  const projectNameMap = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    if (metrics?.project_risks) {
      for (const risk of metrics.project_risks) {
        map.set(risk.project_id, risk.project_name);
      }
    }
    for (const p of projects) {
      if (!map.has(p.id)) {
        map.set(p.id, p.name);
      }
    }
    return map;
  }, [metrics?.project_risks, projects]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center py-20" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-light-text-secondary dark:text-dark-text-secondary">
          <Loader2 size={36} className="animate-spin text-primary" aria-label="加载中" />
          <span className="text-sm">正在加载仪表盘数据…</span>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !metrics) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 min-h-[60vh] text-light-text-secondary dark:text-dark-text-secondary"
        role="alert"
      >
        <AlertTriangle size={32} className="text-danger" aria-hidden="true" />
        <p className="text-sm text-danger max-w-sm text-center">{error}</p>
        <button
          className="px-5 py-1.5 text-sm font-medium text-white bg-primary border border-primary rounded-md cursor-pointer hover:bg-primary-dark hover:border-primary-dark transition-colors duration-150"
          type="button"
          onClick={() => { fetchMetrics(); fetchRecentActivities(8); fetchProjects(); }}
        >
          重新加载
        </button>
      </div>
    );
  }

  const m = metrics;

  return (
    <div className="flex flex-col gap-6 px-10 py-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ── Compact greeting — single line ──────────────────────────────────── */}
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl px-8 py-4 flex flex-row items-center gap-4 flex-wrap transition-colors duration-200">
        <h1 className="text-[1.375rem] font-bold font-heading tracking-tight whitespace-nowrap">
          {greeting}, 用户 👋
        </h1>
        <span className="ml-auto text-sm text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
          {chineseDate}
        </span>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4"
        role="list"
        aria-label="项目统计指标"
      >
        <MetricCard
          icon={<FolderKanban size={22} />}
          value={m?.total_projects ?? '—'}
          label="项目总数"
          accentColor="#3b82f6"
        />
        <MetricCard
          icon={<Activity size={22} />}
          value={m?.active_projects ?? '—'}
          label="活跃项目"
          accentColor="#00ca72"
        />
        <MetricCard
          icon={<AlertTriangle size={22} />}
          value={m?.at_risk_projects ?? '—'}
          label="风险项目"
          accentColor="#e2445c"
        />
        <MetricCard
          icon={<Clock size={22} />}
          value={m?.overdue_tasks ?? '—'}
          label="逾期任务"
          accentColor="#f59e0b"
        />
        <MetricCard
          icon={
            m ? (
              <ProgressRing rate={m.completion_rate} size={48} />
            ) : (
              <CheckCircle2 size={22} />
            )
          }
          value={m ? null : '—'}
          label="完成率"
          accentColor="#0086c0"
        />
        <MetricCard
          icon={<Users size={22} />}
          value={hrSummary?.active_count ?? '—'}
          label="员工在岗"
          accentColor="#009688"
        />
        <MetricCard
          icon={<Wallet size={22} />}
          value={financeSummary?.pending_approvals ?? '—'}
          label="待审报销"
          accentColor="#FF9800"
        />
      </div>

      {/* ── Stage pipeline — full width ──────────────────────────────────────── */}
      <StagePipeline stageDistribution={m?.stage_distribution ?? {}} />

      {/* ── Three-column chart row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskStatusDonut
          distribution={m?.task_status_distribution ?? {}}
          totalTasks={m?.total_tasks ?? 0}
        />
        <ProjectProgressChart projects={projects} />
        <BudgetOverview budgetSummary={m?.budget_summary ?? []} />
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left column (3/5): risk heatmap + AI insights */}
        <div className="lg:col-span-3 space-y-4">

          <RiskHeatmap risks={m?.project_risks ?? []} />

          {m && m.ai_insights.length > 0 && (
            <section
              className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200"
              aria-labelledby="insights-heading"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary" aria-hidden="true" />
                <h2 className="text-base font-heading font-semibold" id="insights-heading">
                  AI 洞察
                </h2>
              </div>
              <div className="flex flex-col">
                {m.ai_insights.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} projectNameMap={projectNameMap} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column (2/5): activity timeline */}
        <div className="lg:col-span-2">
          <section
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200"
            aria-labelledby="activity-heading"
          >
            <div className="mb-4">
              <h2 className="text-base font-heading font-semibold" id="activity-heading">
                最近活动
              </h2>
            </div>
            <div className="space-y-0" role="log" aria-label="最近活动列表">
              {recentActivities.length === 0 ? (
                <p className="text-[13px] text-light-text-secondary dark:text-dark-text-secondary text-center py-6">
                  暂无活动记录
                </p>
              ) : (
                recentActivities.map((item, idx) => (
                  <ActivityRow
                    key={item.id}
                    activity={item}
                    isLast={idx === recentActivities.length - 1}
                    projectNameMap={projectNameMap}
                  />
                ))
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};
