import { useEffect, useState } from 'react';
import { Scale, FileCheck, AlertTriangle, DollarSign } from 'lucide-react';
import { useLegalStore } from '../stores/legalStore';
import { StatCard, DataTable, LoadingSpinner } from '../widgets/atomic';
import type { Column } from '../widgets/atomic/DataTable';
import type { LegalContract } from '../types';

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '执行中',
  completed: '已完成',
  terminated: '已终止',
  expired: '已过期',
};

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: '#919AA3',
  active: '#00C875',
  completed: '#0F79F3',
  terminated: '#E74C3C',
  expired: '#FFB264',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  service: '服务合同',
  construction: '施工合同',
  procurement: '采购合同',
  consulting: '咨询合同',
  design: '设计合同',
};

const RISK_LEVEL_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#00C875',
  medium: '#FFB264',
  high: '#E74C3C',
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

function formatCNY(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString('zh-CN')}`;
}

type TabKey = 'all' | 'active' | 'expiring';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部合同' },
  { key: 'active', label: '执行中' },
  { key: 'expiring', label: '即将到期' },
];

export const LegalDashboard = () => {
  const { contracts, summary, isLoading, error, fetchContracts, fetchSummary } = useLegalStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    fetchContracts();
    fetchSummary();
  }, [fetchContracts, fetchSummary]);

  const [now] = useState(() => Date.now());

  const filtered =
    activeTab === 'all'
      ? contracts
      : activeTab === 'active'
        ? contracts.filter((c) => c.status === 'active')
        : contracts.filter((c) => {
            if (!c.end_date) return false;
            const daysLeft = (new Date(c.end_date).getTime() - now) / (1000 * 86400);
            return daysLeft >= 0 && daysLeft <= 30;
          });

  const columns: Column<LegalContract>[] = [
    { key: 'title', label: '合同名称', sortable: true },
    { key: 'contract_type', label: '类型', render: (v) => CONTRACT_TYPE_LABELS[v] ?? v },
    { key: 'party_b', label: '乙方' },
    { key: 'amount', label: '金额', sortable: true, render: (v) => formatCNY(v) },
    { key: 'sign_date', label: '签署日期', sortable: true },
    { key: 'end_date', label: '到期日期', sortable: true },
    {
      key: 'risk_level',
      label: '风险',
      render: (v) => statusBadge(v, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS),
    },
    {
      key: 'status',
      label: '状态',
      render: (v) => statusBadge(v, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS),
    },
    { key: 'responsible', label: '负责人' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[18px] font-medium text-light-text">法务管理</h1>

      {error && (
        <div className="bg-[#FFEBEE] border border-[#E74C3C]/20 rounded-[10px] p-3">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="合同总数"
          value={summary?.total ?? '-'}
          icon={<Scale size={20} />}
          iconColor="bg-[#00CAE3] text-white"
        />
        <StatCard
          label="执行中"
          value={summary?.active ?? '-'}
          icon={<FileCheck size={20} />}
          iconColor="bg-[#00C875] text-white"
        />
        <StatCard
          label="即将到期"
          value={summary?.expiring_soon ?? '-'}
          icon={<AlertTriangle size={20} />}
          iconColor="bg-[#FFB264] text-white"
        />
        <StatCard
          label="合同总额"
          value={summary ? formatCNY(summary.total_amount) : '-'}
          icon={<DollarSign size={20} />}
          iconColor="bg-[#2E37A4] text-white"
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
        <DataTable<LegalContract> columns={columns} rows={filtered} emptyMessage="暂无合同记录" />
      )}
    </div>
  );
};
