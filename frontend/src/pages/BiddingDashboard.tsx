import { useEffect, useState } from 'react';
import { Target, TrendingUp, Clock, Award, X } from 'lucide-react';
import { useBiddingStore } from '../stores/biddingStore';
import { StatCard, DataTable, LoadingSpinner } from '../widgets/atomic';
import type { Column } from '../widgets/atomic/DataTable';
import type { BiddingOpportunity } from '../types';

const BIDDING_STATUS_LABELS: Record<string, string> = {
  monitoring: '跟踪中',
  analyzing: '分析中',
  preparing: '准备中',
  submitted: '已投标',
  won: '已中标',
  lost: '未中标',
};

const BIDDING_STATUS_COLORS: Record<string, string> = {
  monitoring: '#0086C0',
  analyzing: '#796DF6',
  preparing: '#FFB264',
  submitted: '#0F79F3',
  won: '#00C875',
  lost: '#919AA3',
};

function statusBadge(value: string) {
  const label = BIDDING_STATUS_LABELS[value] ?? value;
  const color = BIDDING_STATUS_COLORS[value] ?? '#919AA3';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {label}
    </span>
  );
}

function matchScoreBadge(score: number) {
  const color = score >= 85 ? '#00C875' : score >= 70 ? '#FFB264' : '#E74C3C';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {score}分
    </span>
  );
}

const STATUS_FILTERS = [
  { value: '', label: '全部状态' },
  { value: 'monitoring', label: '跟踪中' },
  { value: 'analyzing', label: '分析中' },
  { value: 'preparing', label: '准备中' },
  { value: 'submitted', label: '已投标' },
];

export const BiddingDashboard = () => {
  const { opportunities, selectedOpportunity, isLoading, error, fetchOpportunities, setSelected } =
    useBiddingStore();

  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const filtered = statusFilter
    ? opportunities.filter((o) => o.status === statusFilter)
    : opportunities;

  const stats = {
    total: opportunities.length,
    highMatch: opportunities.filter((o) => o.match_score >= 85).length,
    preparing: opportunities.filter((o) => o.status === 'preparing' || o.status === 'submitted')
      .length,
    avgScore:
      opportunities.length > 0
        ? Math.round(opportunities.reduce((s, o) => s + o.match_score, 0) / opportunities.length)
        : 0,
  };

  const columns: Column<BiddingOpportunity>[] = [
    { key: 'title', label: '项目名称', sortable: true },
    { key: 'category', label: '类别' },
    { key: 'region', label: '区域' },
    { key: 'budget_amount', label: '预算金额', render: (v) => v ?? '—' },
    { key: 'deadline', label: '截止日期', sortable: true },
    { key: 'match_score', label: '匹配度', sortable: true, render: (v) => matchScoreBadge(v) },
    { key: 'status', label: '状态', render: (v) => statusBadge(v) },
    { key: 'source', label: '来源' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[18px] font-medium text-light-text">投标管理</h1>

      {error && (
        <div className="bg-[#FFEBEE] border border-[#E74C3C]/20 rounded-[10px] p-3">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="投标机会"
          value={stats.total}
          icon={<Target size={20} />}
          iconColor="bg-[#00CAE3] text-white"
        />
        <StatCard
          label="高匹配度"
          value={stats.highMatch}
          icon={<TrendingUp size={20} />}
          iconColor="bg-[#00C875] text-white"
        />
        <StatCard
          label="准备/已投"
          value={stats.preparing}
          icon={<Clock size={20} />}
          iconColor="bg-[#FFB264] text-white"
        />
        <StatCard
          label="平均匹配分"
          value={`${stats.avgScore}分`}
          icon={<Award size={20} />}
          iconColor="bg-[#2E37A4] text-white"
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-[#EFF3F9] rounded-[10px] p-1" role="tablist">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={statusFilter === value}
              className={
                statusFilter === value
                  ? 'px-4 py-2 rounded-md text-sm font-medium bg-white text-[#00C875] transition-colors'
                  : 'px-4 py-2 rounded-md text-sm font-medium text-light-text-secondary hover:text-light-text transition-colors'
              }
              onClick={() => setStatusFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingSpinner text="加载中..." />}

      {!isLoading && (
        <DataTable<BiddingOpportunity>
          columns={columns}
          rows={filtered}
          emptyMessage="暂无投标机会"
          onRowClick={(row) => setSelected(row)}
        />
      )}

      {/* Detail drawer */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-white border-b border-[#E8ECF4] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-light-text">投标详情</h2>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-[10px] hover:bg-[#EFF3F9] transition-colors"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-medium text-light-text mb-2">
                  {selectedOpportunity.title}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  {statusBadge(selectedOpportunity.status)}
                  {matchScoreBadge(selectedOpportunity.match_score)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-light-text-secondary">来源</span>
                  <p className="font-medium text-light-text">{selectedOpportunity.source}</p>
                </div>
                <div>
                  <span className="text-light-text-secondary">区域</span>
                  <p className="font-medium text-light-text">{selectedOpportunity.region}</p>
                </div>
                <div>
                  <span className="text-light-text-secondary">类别</span>
                  <p className="font-medium text-light-text">{selectedOpportunity.category}</p>
                </div>
                <div>
                  <span className="text-light-text-secondary">预算金额</span>
                  <p className="font-medium text-light-text">
                    {selectedOpportunity.budget_amount ?? '未公开'}
                  </p>
                </div>
                <div>
                  <span className="text-light-text-secondary">发布日期</span>
                  <p className="font-medium text-light-text">{selectedOpportunity.publish_date}</p>
                </div>
                <div>
                  <span className="text-light-text-secondary">截止日期</span>
                  <p className="font-medium text-light-text">{selectedOpportunity.deadline}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
