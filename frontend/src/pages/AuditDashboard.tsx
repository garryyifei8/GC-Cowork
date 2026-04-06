import { useEffect, useState } from 'react';
import { ShieldCheck, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuditStore } from '../stores/auditStore';
import { StatCard, DataTable, LoadingSpinner } from '../widgets/atomic';
import type { Column } from '../widgets/atomic/DataTable';
import type { AuditReport } from '../types';

const AUDIT_STATUS_LABELS: Record<string, string> = {
  planned: '已计划',
  in_progress: '进行中',
  completed: '已完成',
  follow_up: '跟踪中',
};

const AUDIT_STATUS_COLORS: Record<string, string> = {
  planned: '#919AA3',
  in_progress: '#0086C0',
  completed: '#00C875',
  follow_up: '#FFB264',
};

const AUDIT_TYPE_LABELS: Record<string, string> = {
  financial: '财务审计',
  compliance: '合规审计',
  project: '项目审计',
  safety: '安全审计',
};

const RISK_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '极高',
};
const RISK_COLORS: Record<string, string> = {
  low: '#00C875',
  medium: '#FFB264',
  high: '#E74C3C',
  critical: '#9B1B30',
};

function statusBadge(
  value: string,
  labels: Record<string, string>,
  colors: Record<string, string>
) {
  const label = labels[value] ?? value;
  const color = colors[value] ?? '#919AA3';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {label}
    </span>
  );
}

type TabKey = 'all' | 'in_progress' | 'completed';

export const AuditDashboard = () => {
  const { reports, summary, isLoading, error, fetchReports, fetchSummary } = useAuditStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    fetchReports();
    fetchSummary();
  }, [fetchReports, fetchSummary]);

  const filtered = activeTab === 'all' ? reports : reports.filter((r) => r.status === activeTab);

  const columns: Column<AuditReport>[] = [
    { key: 'title', label: '审计名称', sortable: true },
    { key: 'audit_type', label: '类型', render: (v) => AUDIT_TYPE_LABELS[v] ?? v },
    { key: 'auditor', label: '审计人员' },
    { key: 'start_date', label: '开始日期', sortable: true },
    { key: 'end_date', label: '结束日期', render: (v) => v ?? '—' },
    {
      key: 'findings_count',
      label: '问题数',
      sortable: true,
      render: (v) => (
        <span className={`font-medium ${v > 0 ? 'text-red-600' : 'text-light-text-secondary'}`}>
          {v}
        </span>
      ),
    },
    { key: 'risk_level', label: '风险', render: (v) => statusBadge(v, RISK_LABELS, RISK_COLORS) },
    {
      key: 'status',
      label: '状态',
      render: (v) => statusBadge(v, AUDIT_STATUS_LABELS, AUDIT_STATUS_COLORS),
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'in_progress', label: '进行中' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[18px] font-medium text-light-text">审计管理</h1>

      {error && (
        <div className="bg-[#FFEBEE] border border-[#E74C3C]/20 rounded-[10px] p-3">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="审计总数"
          value={summary?.total ?? '-'}
          icon={<ShieldCheck size={20} />}
          iconColor="bg-[#00CAE3] text-white"
        />
        <StatCard
          label="进行中"
          value={summary?.in_progress ?? '-'}
          icon={<Search size={20} />}
          iconColor="bg-[#FFB264] text-white"
        />
        <StatCard
          label="发现问题"
          value={summary?.findings_count ?? '-'}
          icon={<AlertTriangle size={20} />}
          iconColor="bg-[#E74C3C] text-white"
        />
        <StatCard
          label="合规率"
          value={summary ? `${(summary.compliance_rate * 100).toFixed(1)}%` : '-'}
          icon={<CheckCircle size={20} />}
          iconColor="bg-[#27AE60] text-white"
        />
      </div>

      <div
        className="flex items-center gap-1 bg-[#EFF3F9] rounded-[10px] p-1 self-start"
        role="tablist"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={
              activeTab === key
                ? 'px-4 py-2 rounded-md text-sm font-medium bg-white text-[#00C875] transition-colors'
                : 'px-4 py-2 rounded-md text-sm font-medium text-light-text-secondary hover:text-light-text transition-colors'
            }
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner text="加载中..." />}

      {!isLoading && (
        <DataTable<AuditReport> columns={columns} rows={filtered} emptyMessage="暂无审计记录" />
      )}
    </div>
  );
};
