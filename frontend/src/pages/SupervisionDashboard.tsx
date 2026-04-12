import { useEffect, useState } from 'react';
import { HardHat, AlertCircle, Calendar } from 'lucide-react';
import { useSupervisionStore } from '../stores/supervisionStore';
import { StatCard, DataTable, LoadingSpinner } from '../widgets/atomic';
import type { Column } from '../widgets/atomic/DataTable';
import type { SupervisionRecord } from '../types';

const RECORD_TYPE_LABELS: Record<string, string> = {
  patrol: '巡视检查',
  witness: '旁站监理',
  issue: '问题跟踪',
  meeting: '监理例会',
};

const RECORD_TYPE_ICONS: Record<string, string> = {
  patrol: '👷',
  witness: '👁️',
  issue: '⚠️',
  meeting: '📋',
};

const STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  issue: '存在问题',
  resolved: '已整改',
  closed: '已关闭',
};

const STATUS_COLORS: Record<string, string> = {
  normal: '#00C875',
  issue: '#E74C3C',
  resolved: '#0F79F3',
  closed: '#919AA3',
};

function statusBadge(value: string) {
  const label = STATUS_LABELS[value] ?? value;
  const color = STATUS_COLORS[value] ?? '#919AA3';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {label}
    </span>
  );
}

type TabKey = 'all' | 'patrol' | 'witness' | 'issue' | 'meeting';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'patrol', label: '巡视检查' },
  { key: 'witness', label: '旁站监理' },
  { key: 'issue', label: '问题跟踪' },
  { key: 'meeting', label: '监理例会' },
];

export const SupervisionDashboard = () => {
  const { records, summary, isLoading, error, fetchRecords, fetchSummary } = useSupervisionStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, [fetchRecords, fetchSummary]);

  const filtered =
    activeTab === 'all' ? records : records.filter((r) => r.record_type === activeTab);

  const columns: Column<SupervisionRecord>[] = [
    {
      key: 'record_type',
      label: '类型',
      render: (v) => (
        <span className="inline-flex items-center gap-1">
          <span>{RECORD_TYPE_ICONS[v] ?? '📄'}</span>
          <span>{RECORD_TYPE_LABELS[v] ?? v}</span>
        </span>
      ),
    },
    { key: 'title', label: '标题', sortable: true },
    { key: 'date', label: '日期', sortable: true },
    { key: 'inspector', label: '监理人员' },
    { key: 'location', label: '检查位置' },
    {
      key: 'issues_found',
      label: '问题数',
      sortable: true,
      render: (v) => (
        <span className={`font-medium ${v > 0 ? 'text-red-600' : 'text-light-text-secondary'}`}>
          {v}
        </span>
      ),
    },
    { key: 'status', label: '状态', render: (v) => statusBadge(v) },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[18px] font-medium text-light-text">监理管理</h1>

      {error && (
        <div className="bg-[#FFEBEE] border border-[#E74C3C]/20 rounded-[10px] p-3">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="监理记录"
          value={summary?.total ?? '-'}
          icon={<HardHat size={20} />}
          iconColor="bg-[#00CAE3] text-white"
        />
        <StatCard
          label="未解决问题"
          value={summary?.issues_open ?? '-'}
          icon={<AlertCircle size={20} />}
          iconColor="bg-[#E74C3C] text-white"
        />
        <StatCard
          label="本月检查"
          value={summary?.inspections_this_month ?? '-'}
          icon={<Calendar size={20} />}
          iconColor="bg-[#00C875] text-white"
        />
      </div>

      <div
        className="flex items-center gap-1 bg-[#EFF3F9] rounded-[10px] p-1 self-start"
        role="tablist"
      >
        {TABS.map(({ key, label }) => (
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
        <DataTable<SupervisionRecord>
          columns={columns}
          rows={filtered}
          emptyMessage="暂无监理记录"
        />
      )}
    </div>
  );
};
