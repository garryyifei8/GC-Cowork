import React, { useEffect, useState } from 'react';
import {
  Wallet,
  FileText,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Receipt,
} from 'lucide-react';
import { useFinanceStore } from '../stores/financeStore';
import type { ExpenseReport, BudgetLine, FinanceInvoice } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatWan(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }
  return formatCNY(amount);
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  travel: '差旅',
  office: '办公',
  entertainment: '招待',
  material: '材料',
  other: '其他',
};

const EXPENSE_STATUS_COLORS: Record<string, string> = {
  draft: '#676879',
  submitted: '#0086C0',
  approved: '#00C875',
  rejected: '#E2445C',
  paid: '#6BBF59',
};

const EXPENSE_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已付款',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: '#FDAB3D',
  paid: '#00C875',
  overdue: '#E2445C',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: '待付',
  paid: '已付',
  overdue: '逾期',
};

// ── Common table/panel classes ─────────────────────────────────────────────

const PANEL_CLS   = 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden transition-colors duration-200';
const TH_CLS      = 'px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider';
const TR_CLS      = 'border-t border-light-border/50 dark:border-dark-border/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';
const TD_CLS      = 'px-4 py-3 text-sm';
const FILTER_SELECT_CLS = 'rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

// ── Sub-components ─────────────────────────────────────────────────────────

// Circular progress indicator for budget utilization
interface MiniProgressRingProps {
  rate: number;
  size?: number;
  color?: string;
}

const MiniProgressRing: React.FC<MiniProgressRingProps> = ({
  rate,
  size = 40,
  color = '#0086C0',
}) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(rate / 100, 1) * circumference;

  return (
    <svg
      width={size}
      height={size}
      aria-label={`预算使用率 ${rate.toFixed(1)}%`}
      role="img"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={3}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={3}
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
        fontSize="9"
        fontWeight="700"
        fill={color}
      >
        {Math.round(rate)}%
      </text>
    </svg>
  );
};

// ── FinanceMetricsRow ──────────────────────────────────────────────────────

interface FinanceMetricsRowProps {
  totalExpenses: number;
  pendingApprovals: number;
  budgetUtilization: number;
  overdueInvoices: number;
}

const FinanceMetricsRow: React.FC<FinanceMetricsRowProps> = ({
  totalExpenses,
  pendingApprovals,
  budgetUtilization,
  overdueInvoices,
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="list" aria-label="财务关键指标">
    {/* 报销总额 */}
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 transition-colors duration-200" role="listitem">
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={22} className="text-primary" aria-hidden="true" />
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">报销总额</span>
      </div>
      <div className="text-xl font-bold font-heading">{formatCNY(totalExpenses)}</div>
    </div>

    {/* 待审批 */}
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 transition-colors duration-200" role="listitem">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={22} className="text-warning" aria-hidden="true" />
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">待审批</span>
      </div>
      <div className="text-xl font-bold font-heading">{pendingApprovals}</div>
    </div>

    {/* 预算使用率 */}
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 transition-colors duration-200" role="listitem">
      <div className="flex items-center gap-2 mb-2">
        <MiniProgressRing rate={budgetUtilization} color="#0086C0" />
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">预算使用率</span>
      </div>
      <div className="text-xl font-bold font-heading">{budgetUtilization.toFixed(1)}%</div>
    </div>

    {/* 逾期发票 */}
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 transition-colors duration-200" role="listitem">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={22} className="text-danger" aria-hidden="true" />
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">逾期发票</span>
      </div>
      <div className="text-xl font-bold font-heading">{overdueInvoices}</div>
    </div>
  </div>
);

// ── AI Insights ────────────────────────────────────────────────────────────

interface InsightItem {
  title: string;
  description: string;
  severity: string;
  category: string;
}

const AIInsightsSection: React.FC<{ insights: InsightItem[] }> = ({ insights }) => {
  if (insights.length === 0) return null;

  const getSeverityIconColorClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-danger';
      case 'warning':  return 'text-warning';
      default:         return 'text-info';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'warning':  return <TrendingUp size={16} />;
      default:         return <Sparkles size={16} />;
    }
  };

  const getSeverityBorderColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#E2445C';
      case 'warning':  return '#FDAB3D';
      default:         return '#0086C0';
    }
  };

  return (
    <section
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 mb-6"
      aria-labelledby="fd-insights-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold font-heading" id="fd-insights-heading">AI 财务洞察</h2>
      </div>
      <div className="space-y-2">
        {insights.map((insight, idx) => {
          const iconColorClass = getSeverityIconColorClass(insight.severity);
          const borderColor = getSeverityBorderColor(insight.severity);
          return (
            <div
              key={idx}
              className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border-l-4"
              style={{ borderLeftColor: borderColor }}
              role="article"
              aria-label={insight.title}
            >
              <span className={`flex-shrink-0 mt-0.5 ${iconColorClass}`} aria-hidden="true">
                {getSeverityIcon(insight.severity)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-0.5">{insight.title}</div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{insight.description}</p>
                {insight.category && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                    {insight.category}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── ExpenseTable ───────────────────────────────────────────────────────────

interface ExpenseTableProps {
  expenses: ExpenseReport[];
  onApprove: (id: string, approved: boolean) => void;
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, onApprove }) => {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = statusFilter
    ? expenses.filter((e) => e.status === statusFilter)
    : expenses;

  return (
    <div className={PANEL_CLS}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border flex-wrap">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-light-text-secondary dark:text-dark-text-secondary" aria-hidden="true" />
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{filtered.length} 条记录</span>
        </div>
        <select
          className={FILTER_SELECT_CLS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按状态筛选报销"
        >
          <option value="">全部状态</option>
          {Object.entries(EXPENSE_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="报销记录表格">
        <table className="w-full" aria-label="报销管理">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th scope="col" className={TH_CLS}>提交人</th>
              <th scope="col" className={TH_CLS}>项目</th>
              <th scope="col" className={TH_CLS}>类别</th>
              <th scope="col" className={`${TH_CLS} text-right`}>金额</th>
              <th scope="col" className={TH_CLS}>提交日期</th>
              <th scope="col" className={TH_CLS}>状态</th>
              <th scope="col" className={TH_CLS}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无报销记录</td>
              </tr>
            ) : (
              filtered.map((expense) => (
                <tr key={expense.id} className={TR_CLS}>
                  <td className={`${TD_CLS} font-semibold`}>{expense.submitter}</td>
                  <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary`}>
                    {expense.project_id ?? <span className="text-slate-400">无项目</span>}
                  </td>
                  <td className={TD_CLS}>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-light-text-secondary dark:text-dark-text-secondary">
                      {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
                    </span>
                  </td>
                  <td className={`${TD_CLS} text-right font-medium text-primary`}>{formatCNY(expense.amount)}</td>
                  <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary`}>{expense.submit_date}</td>
                  <td className={TD_CLS}>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        color: EXPENSE_STATUS_COLORS[expense.status] ?? '#676879',
                        backgroundColor: `${EXPENSE_STATUS_COLORS[expense.status] ?? '#676879'}1A`,
                      }}
                    >
                      {EXPENSE_STATUS_LABELS[expense.status] ?? expense.status}
                    </span>
                  </td>
                  <td className={TD_CLS}>
                    {expense.status === 'submitted' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                          onClick={() => onApprove(expense.id, true)}
                          aria-label={`通过 ${expense.submitter} 的报销申请`}
                        >
                          <CheckCircle2 size={13} />
                          通过
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                          onClick={() => onApprove(expense.id, false)}
                          aria-label={`驳回 ${expense.submitter} 的报销申请`}
                        >
                          <XCircle size={13} />
                          驳回
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── BudgetTable ────────────────────────────────────────────────────────────

interface BudgetTableProps {
  budgets: BudgetLine[];
}

const BudgetTable: React.FC<BudgetTableProps> = ({ budgets }) => {
  const [projectFilter, setProjectFilter] = useState<string>('');

  const projectIds = Array.from(
    new Set(budgets.map((b) => b.project_id).filter(Boolean) as string[])
  );

  const filtered = projectFilter
    ? budgets.filter((b) => b.project_id === projectFilter)
    : budgets;

  const getUsageColor = (rate: number): string => {
    if (rate > 90) return '#E2445C';
    if (rate > 70) return '#FDAB3D';
    return '#00C875';
  };

  return (
    <div className={PANEL_CLS}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-light-text-secondary dark:text-dark-text-secondary" aria-hidden="true" />
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{filtered.length} 条记录</span>
        </div>
        <select
          className={FILTER_SELECT_CLS}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="按项目筛选预算"
        >
          <option value="">全部项目</option>
          {projectIds.map((pid) => (
            <option key={pid} value={pid}>{pid}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="预算记录表格">
        <table className="w-full" aria-label="预算管理">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th scope="col" className={TH_CLS}>项目</th>
              <th scope="col" className={TH_CLS}>类别</th>
              <th scope="col" className={`${TH_CLS} text-right`}>计划预算</th>
              <th scope="col" className={`${TH_CLS} text-right`}>实际支出</th>
              <th scope="col" className={TH_CLS}>使用率</th>
              <th scope="col" className={TH_CLS}>备注</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无预算记录</td>
              </tr>
            ) : (
              filtered.map((budget) => {
                const rate =
                  budget.planned_amount > 0
                    ? (budget.actual_amount / budget.planned_amount) * 100
                    : 0;
                const usageColor = getUsageColor(rate);

                return (
                  <tr key={budget.id} className={TR_CLS}>
                    <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary`}>
                      {budget.project_id ?? <span className="text-slate-400">通用</span>}
                    </td>
                    <td className={TD_CLS}>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-light-text-secondary dark:text-dark-text-secondary">
                        {EXPENSE_CATEGORY_LABELS[budget.category] ?? budget.category}
                      </span>
                    </td>
                    <td className={`${TD_CLS} text-right font-medium`}>{formatWan(budget.planned_amount)}</td>
                    <td className={`${TD_CLS} text-right font-medium`}>{formatWan(budget.actual_amount)}</td>
                    <td className={TD_CLS}>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden min-w-[60px]"
                          role="progressbar"
                          aria-valuenow={Math.round(rate)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`使用率 ${rate.toFixed(1)}%`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(rate, 100)}%`,
                              backgroundColor: usageColor,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right flex-shrink-0" style={{ color: usageColor }}>
                          {rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary max-w-[160px] truncate`}>
                      {budget.notes || <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── InvoiceTable ───────────────────────────────────────────────────────────

interface InvoiceTableProps {
  invoices: FinanceInvoice[];
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices;

  return (
    <div className={PANEL_CLS}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border flex-wrap">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-light-text-secondary dark:text-dark-text-secondary" aria-hidden="true" />
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{filtered.length} 条记录</span>
        </div>
        <select
          className={FILTER_SELECT_CLS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按状态筛选发票"
        >
          <option value="">全部状态</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="发票记录表格">
        <table className="w-full" aria-label="发票管理">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th scope="col" className={TH_CLS}>供应商</th>
              <th scope="col" className={TH_CLS}>项目</th>
              <th scope="col" className={`${TH_CLS} text-right`}>金额</th>
              <th scope="col" className={TH_CLS}>开票日期</th>
              <th scope="col" className={TH_CLS}>到期日期</th>
              <th scope="col" className={TH_CLS}>类别</th>
              <th scope="col" className={TH_CLS}>状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无发票记录</td>
              </tr>
            ) : (
              filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`${TR_CLS}${invoice.status === 'overdue' ? ' bg-danger/[0.03] dark:bg-danger/[0.06]' : ''}`}
                >
                  <td className={`${TD_CLS} font-semibold`}>{invoice.vendor}</td>
                  <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary`}>
                    {invoice.project_id ?? <span className="text-slate-400">无项目</span>}
                  </td>
                  <td className={`${TD_CLS} text-right font-medium text-primary`}>{formatCNY(invoice.amount)}</td>
                  <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary`}>{invoice.invoice_date}</td>
                  <td className={`${TD_CLS} text-light-text-secondary dark:text-dark-text-secondary`}>{invoice.due_date}</td>
                  <td className={TD_CLS}>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-light-text-secondary dark:text-dark-text-secondary">
                      {EXPENSE_CATEGORY_LABELS[invoice.category] ?? invoice.category}
                    </span>
                  </td>
                  <td className={TD_CLS}>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        color: INVOICE_STATUS_COLORS[invoice.status] ?? '#676879',
                        backgroundColor: `${INVOICE_STATUS_COLORS[invoice.status] ?? '#676879'}1A`,
                      }}
                    >
                      {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Tab Bar ────────────────────────────────────────────────────────────────

type TabKey = 'expenses' | 'budgets' | 'invoices';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TAB_DEFS: Array<{ key: TabKey; label: string }> = [
  { key: 'expenses', label: '报销管理' },
  { key: 'budgets',  label: '预算管理' },
  { key: 'invoices', label: '发票管理' },
];

const TabBar: React.FC<TabBarProps> = ({ active, onChange }) => (
  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6" role="tablist" aria-label="财务管理标签页">
    {TAB_DEFS.map(({ key, label }) => (
      <button
        key={key}
        role="tab"
        aria-selected={active === key}
        aria-controls={`fd-tabpanel-${key}`}
        id={`fd-tab-${key}`}
        className={
          active === key
            ? 'px-4 py-2 rounded-md text-sm font-medium bg-light-surface dark:bg-dark-surface shadow-sm text-primary transition-colors'
            : 'px-4 py-2 rounded-md text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors'
        }
        onClick={() => onChange(key)}
        type="button"
      >
        {label}
      </button>
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

export const FinanceDashboard: React.FC = () => {
  const {
    expenses,
    budgets,
    invoices,
    summary,
    insights,
    isLoading,
    error,
    fetchExpenses,
    fetchBudgets,
    fetchInvoices,
    fetchSummary,
    fetchInsights,
    approveExpense,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<TabKey>('expenses');

  // Initial data fetch
  useEffect(() => {
    fetchSummary();
    fetchInsights();
    fetchExpenses();
    fetchBudgets();
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state (before any data at all)
  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-light-text-secondary dark:text-dark-text-secondary" aria-live="polite">
        <Loader2 size={36} className="animate-spin text-primary" aria-label="加载中" />
        <span className="text-sm">正在加载财务数据…</span>
      </div>
    );
  }

  // Error state
  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3" role="alert">
        <AlertTriangle size={32} className="text-danger" aria-hidden="true" />
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{error}</p>
        <button
          className="px-5 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          type="button"
          onClick={() => {
            fetchSummary();
            fetchInsights();
            fetchExpenses();
            fetchBudgets();
            fetchInvoices();
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  const s = summary;

  return (
    <div className="animate-fade-in">

      {/* Page header */}
      <div className="mb-6">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">报销审批 · 预算管控 · 发票跟踪</p>
      </div>

      {/* Metrics row */}
      <FinanceMetricsRow
        totalExpenses={s?.total_expenses ?? 0}
        pendingApprovals={s?.pending_approvals ?? 0}
        budgetUtilization={(s?.budget_utilization_rate ?? 0) * 100}
        overdueInvoices={s?.overdue_invoices ?? 0}
      />

      {/* AI Insights */}
      {insights.length > 0 && <AIInsightsSection insights={insights} />}

      {/* Tab content */}
      <div>
        <TabBar active={activeTab} onChange={setActiveTab} />

        {isLoading && (
          <div className="flex items-center gap-2 py-3 text-sm text-light-text-secondary dark:text-dark-text-secondary" aria-live="polite">
            <Loader2 size={18} className="animate-spin" aria-label="加载中" />
            <span>加载中…</span>
          </div>
        )}

        <div
          id="fd-tabpanel-expenses"
          role="tabpanel"
          aria-labelledby="fd-tab-expenses"
          hidden={activeTab !== 'expenses'}
        >
          {activeTab === 'expenses' && (
            <ExpenseTable expenses={expenses} onApprove={approveExpense} />
          )}
        </div>

        <div
          id="fd-tabpanel-budgets"
          role="tabpanel"
          aria-labelledby="fd-tab-budgets"
          hidden={activeTab !== 'budgets'}
        >
          {activeTab === 'budgets' && <BudgetTable budgets={budgets} />}
        </div>

        <div
          id="fd-tabpanel-invoices"
          role="tabpanel"
          aria-labelledby="fd-tab-invoices"
          hidden={activeTab !== 'invoices'}
        >
          {activeTab === 'invoices' && <InvoiceTable invoices={invoices} />}
        </div>
      </div>

    </div>
  );
};
