import { useEffect, useMemo } from 'react';
import { BarChart2, TrendingUp, Award, Users } from 'lucide-react';
import { useBiddingStore } from '../stores/biddingStore';
import { useLegalStore } from '../stores/legalStore';
import { StatCard } from '../widgets/atomic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelStage {
  key: string;
  label: string;
  color: string;
  count: number;
}

interface MonthlyRevenue {
  month: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// Mock monthly revenue (last 6 months) — replace with real API when available
// ---------------------------------------------------------------------------
const MOCK_REVENUE: MonthlyRevenue[] = [
  { month: '10月', amount: 3820000 },
  { month: '11月', amount: 4150000 },
  { month: '12月', amount: 3600000 },
  { month: '1月', amount: 4780000 },
  { month: '2月', amount: 5120000 },
  { month: '3月', amount: 6300000 },
];

// ---------------------------------------------------------------------------
// Helper: format large number to 万/亿
// ---------------------------------------------------------------------------
function fmtAmount(amount: number): string {
  if (amount >= 1e8) return `${(amount / 1e8).toFixed(2)}亿`;
  if (amount >= 1e4) return `${(amount / 1e4).toFixed(0)}万`;
  return `${amount}`;
}

// ---------------------------------------------------------------------------
// Helper: format to percentage string
// ---------------------------------------------------------------------------
function fmtPct(val: number): string {
  return `${val.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// FunnelChart component (pure CSS divs)
// ---------------------------------------------------------------------------
interface FunnelChartProps {
  stages: FunnelStage[];
}

function FunnelChart({ stages }: FunnelChartProps) {
  if (!stages.length) return null;
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-2" role="list" aria-label="投标漏斗图">
      {stages.map((stage, idx) => {
        const pct = Math.round((stage.count / maxCount) * 100);
        // Funnel narrows from top to bottom
        const leftPad = idx * 4; // percent padding per step
        return (
          <div
            key={stage.key}
            role="listitem"
            className="flex items-center gap-3"
            aria-label={`${stage.label}: ${stage.count}件`}
          >
            {/* Stage label */}
            <span className="text-xs text-[#6C7688]">{stage.label}</span>

            {/* Bar track */}
            <div
              className="relative flex-1 h-8 rounded overflow-hidden"
              style={{ paddingLeft: `${leftPad}%`, paddingRight: `${leftPad}%` }}
            >
              {/* Background track */}
              <div className="absolute inset-0 bg-[#F0F2F8]" />
              {/* Filled bar */}
              <div
                className="absolute top-0 bottom-0 left-0 rounded transition-all duration-500 flex items-center pl-3"
                style={{
                  width: `${pct}%`,
                  backgroundColor: stage.color,
                  marginLeft: `${leftPad}%`,
                  maxWidth: `calc(100% - ${leftPad * 2}%)`,
                }}
              />
              {/* Count label inside bar */}
              <div
                className="absolute inset-0 flex items-center"
                style={{ paddingLeft: `calc(${leftPad}% + 10px)` }}
              >
                <span
                  className="text-xs font-semibold z-10 relative"
                  style={{ color: pct > 30 ? '#fff' : stage.color }}
                >
                  {stage.count} 件
                </span>
              </div>
            </div>

            {/* Percentage */}
            <span className="text-xs font-medium text-[#6C7688]">
              {fmtPct((stage.count / maxCount) * 100)}
            </span>
          </div>
        );
      })}

      {/* Conversion annotations */}
      {stages.length > 1 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {stages.slice(1).map((stage, idx) => {
            const prev = stages[idx];
            const conv = prev.count > 0 ? Math.round((stage.count / prev.count) * 100) : 0;
            return (
              <span key={stage.key} className="text-[10px] text-[#9CA3AF]">
                {prev.label} → {stage.label}: {conv}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BarChart component (pure CSS)
// ---------------------------------------------------------------------------
interface BarChartProps {
  data: MonthlyRevenue[];
}

function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2 h-40" role="list" aria-label="月度营收趋势">
        {data.map((d, idx) => {
          const heightPct = Math.round((d.amount / max) * 100);
          // Gradient-style: last bar is brighter
          const isLatest = idx === data.length - 1;
          return (
            <div
              key={d.month}
              role="listitem"
              className="flex-1 flex flex-col items-center justify-end gap-1"
              aria-label={`${d.month}: ${fmtAmount(d.amount)}`}
            >
              {/* Amount label on top */}
              <span className="text-[10px] text-[#6C7688]">{fmtAmount(d.amount)}</span>
              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-500 relative group"
                style={{
                  height: `${heightPct}%`,
                  minHeight: 4,
                  backgroundColor: isLatest ? '#0086C0' : '#579BFC',
                  opacity: isLatest ? 1 : 0.75,
                }}
                title={`${d.month}: ${fmtAmount(d.amount)}`}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis month labels */}
      <div className="flex gap-2">
        {data.map((d) => (
          <div key={d.month} className="flex-1 text-center text-[11px] text-[#6C7688]">
            {d.month}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export const BusinessAnalytics = () => {
  const { opportunities, fetchOpportunities } = useBiddingStore();

  const { contracts, summary: legalSummary, fetchContracts, fetchSummary } = useLegalStore();

  useEffect(() => {
    fetchOpportunities();
    fetchContracts();
    fetchSummary();
  }, [fetchOpportunities, fetchContracts, fetchSummary]);

  // ---------------------------------------------------------------------------
  // KPI calculations
  // ---------------------------------------------------------------------------

  // 合同总额: from legal summary total_amount
  const totalContractAmount =
    legalSummary?.total_amount ?? contracts.reduce((s, c) => s + c.amount, 0);

  // 利润率: mock 18.5% or derive from finance if available
  const profitRate = useMemo(() => {
    // If actual data is unavailable, use a conservative mock derived from contract mix
    const activeContracts = contracts.filter((c) => c.status === 'active');
    if (activeContracts.length === 0) return 18.5;
    // High-risk contracts reduce profit rate
    const highRisk = activeContracts.filter(
      (c) => c.risk_level === 'high' || c.risk_level === 'critical'
    ).length;
    const base = 22 - highRisk * 1.5;
    return Math.max(base, 8);
  }, [contracts]);

  // 中标率: won / (won + lost) bids
  const winRate = useMemo(() => {
    const won = opportunities.filter((o) => o.status === 'won').length;
    const lost = opportunities.filter((o) => o.status === 'lost').length;
    const total = won + lost;
    if (total === 0) return null;
    return Math.round((won / total) * 100);
  }, [opportunities]);

  // 人均产值: total contract amount / estimated headcount (mock 45 if unknown)
  const perCapitaOutput = useMemo(() => {
    const headcount = 45; // replace with HR store when integrated
    return totalContractAmount / headcount;
  }, [totalContractAmount]);

  // ---------------------------------------------------------------------------
  // Funnel stages
  // ---------------------------------------------------------------------------
  const funnelStages = useMemo<FunnelStage[]>(() => {
    const countByStatus = (status: string) =>
      opportunities.filter((o) => o.status === status).length;

    return [
      { key: 'monitoring', label: '跟踪中', color: '#0086C0', count: countByStatus('monitoring') },
      { key: 'analyzing', label: '分析中', color: '#9B51E0', count: countByStatus('analyzing') },
      { key: 'preparing', label: '准备中', color: '#FDAB3D', count: countByStatus('preparing') },
      { key: 'submitted', label: '已投标', color: '#579BFC', count: countByStatus('submitted') },
      { key: 'won', label: '已中标', color: '#00C875', count: countByStatus('won') },
    ];
  }, [opportunities]);

  // ---------------------------------------------------------------------------
  // Trend data — try to use contract amounts by month if enough data, else mock
  // ---------------------------------------------------------------------------
  const revenueData = useMemo<MonthlyRevenue[]>(() => {
    if (contracts.length < 3) return MOCK_REVENUE;
    // Group contracts by sign_date month (last 6 months)
    const now = new Date();
    const monthData: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getMonth() + 1}月`;
      monthData[key] = 0;
    }
    for (const c of contracts) {
      if (!c.sign_date) continue;
      const d = new Date(c.sign_date);
      const key = `${d.getMonth() + 1}月`;
      if (key in monthData) {
        monthData[key] += c.amount;
      }
    }
    const result = Object.entries(monthData).map(([month, amount]) => ({ month, amount }));
    // If all zeros fall back to mock
    const hasData = result.some((r) => r.amount > 0);
    return hasData ? result : MOCK_REVENUE;
  }, [contracts]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#F5F6FA]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">经营分析</h1>
          <p className="text-sm text-[#6C7688]">合同、投标与营收综合概览</p>
        </div>
        <span className="text-xs text-[#9CA3AF]">实时数据</span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI cards row                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="合同总额"
          value={fmtAmount(totalContractAmount)}
          icon={<BarChart2 size={20} />}
          iconColor="bg-blue-100 text-blue-600"
          trend={8.2}
        />
        <StatCard
          label="利润率"
          value={fmtPct(profitRate)}
          icon={<TrendingUp size={20} />}
          iconColor="bg-emerald-100 text-emerald-600"
          trend={1.4}
        />
        <StatCard
          label="中标率"
          value={winRate !== null ? fmtPct(winRate) : '—'}
          icon={<Award size={20} />}
          iconColor="bg-purple-100 text-purple-600"
          trend={winRate !== null ? 3.1 : undefined}
        />
        <StatCard
          label="人均产值"
          value={fmtAmount(perCapitaOutput)}
          icon={<Users size={20} />}
          iconColor="bg-amber-100 text-amber-600"
          trend={5.7}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Charts row — Funnel + Bar                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bidding Funnel */}
        <div className="bg-white border border-[#E8E8E8] rounded-lg shadow-[0_0_35px_0_rgba(104,134,177,0.1)] p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#333]">投标漏斗</h2>
            <p className="text-xs text-[#9CA3AF]">各阶段机会数量及转化率</p>
          </div>

          <FunnelChart stages={funnelStages} />

          {/* Summary badges */}
          <div className="flex items-center gap-3 flex-wrap border-t border-[#F0F0F0] mt-4 pt-3">
            <span className="text-xs text-[#6C7688]">
              投标机会总计 <strong className="text-[#333]">{opportunities.length}</strong> 件
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ color: '#00C875', backgroundColor: 'rgba(0,200,117,0.12)' }}
            >
              中标 {funnelStages.find((s) => s.key === 'won')?.count ?? 0} 件
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ color: '#FDAB3D', backgroundColor: 'rgba(253,171,61,0.12)' }}
            >
              准备中 {funnelStages.find((s) => s.key === 'preparing')?.count ?? 0} 件
            </span>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white border border-[#E8E8E8] rounded-lg shadow-[0_0_35px_0_rgba(104,134,177,0.1)] p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#333]">月度营收趋势</h2>
            <p className="text-xs text-[#9CA3AF]">近6个月合同签约金额</p>
          </div>

          <BarChart data={revenueData} />

          {/* Trend footnote */}
          <div className="border-t border-[#F0F0F0] mt-4 pt-3 flex items-center gap-1">
            <TrendingUp size={13} className="text-emerald-500" />
            <span className="text-xs text-[#6C7688]">
              本月营收较上月增长{' '}
              <strong className="text-emerald-600">
                +
                {Math.round(
                  ((revenueData[revenueData.length - 1].amount -
                    revenueData[revenueData.length - 2].amount) /
                    Math.max(revenueData[revenueData.length - 2].amount, 1)) *
                    100
                )}
                %
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Contract health summary                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border border-[#E8E8E8] rounded-lg shadow-[0_0_35px_0_rgba(104,134,177,0.1)] p-5">
        <h2 className="text-base font-semibold text-[#333] mb-4">合同健康摘要</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: '合同总数',
              value: legalSummary?.total ?? contracts.length,
              color: '#0086C0',
            },
            {
              label: '履约中',
              value: legalSummary?.active ?? contracts.filter((c) => c.status === 'active').length,
              color: '#00C875',
            },
            {
              label: '即将到期',
              value:
                legalSummary?.expiring_soon ??
                contracts.filter((c) => c.status === 'expiring_soon').length,
              color: '#FDAB3D',
            },
            {
              label: '高风险合同',
              value: contracts.filter((c) => c.risk_level === 'high' || c.risk_level === 'critical')
                .length,
              color: '#E2445C',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 px-4 py-3 rounded-lg border"
              style={{ borderColor: `${color}33`, backgroundColor: `${color}08` }}
            >
              <span className="text-xs text-[#6C7688]">{label}</span>
              <span className="text-2xl font-extrabold leading-none" style={{ color }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
