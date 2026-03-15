import { useEffect, useState } from 'react'
import { DollarSign, Clock, PieChart, AlertTriangle } from 'lucide-react'
import { useFinanceStore } from '../stores/financeStore'
import { StatCard, DataTable, LoadingSpinner } from '../widgets/atomic'
import type { Column } from '../widgets/atomic/DataTable'
import BudgetOverview from '../widgets/views/BudgetOverview'
import type { ExpenseReport, BudgetLine, FinanceInvoice } from '../types'
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
  EXPENSE_CATEGORY_LABELS,
} from '../utils/constants'

type TabKey = 'expenses' | 'budgets' | 'invoices'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'expenses', label: '报销' },
  { key: 'budgets', label: '预算' },
  { key: 'invoices', label: '发票' },
]

function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function statusBadge(value: string, labelsMap: Record<string, string>, colorsMap: Record<string, string>) {
  const label = labelsMap[value] ?? value
  const color = colorsMap[value] ?? '#676879'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {label}
    </span>
  )
}

const INVOICE_STATUS_LABELS: Record<string, string> = { pending: '待付', paid: '已付', overdue: '逾期' }
const INVOICE_STATUS_COLORS: Record<string, string> = { pending: '#0086C0', paid: '#00C875', overdue: '#E2445C' }

export const FinanceDashboard = () => {
  const {
    expenses, budgets, invoices, summary, isLoading, error,
    fetchExpenses, fetchBudgets, fetchInvoices, fetchSummary, approveExpense,
  } = useFinanceStore()

  const [activeTab, setActiveTab] = useState<TabKey>('expenses')

  useEffect(() => {
    fetchSummary()
    fetchExpenses()
    fetchBudgets()
    fetchInvoices()
  }, [fetchSummary, fetchExpenses, fetchBudgets, fetchInvoices])

  const expenseCols: Column<ExpenseReport>[] = [
    { key: 'submitter', label: '提交人', sortable: true },
    { key: 'category', label: '类别', render: (v) => EXPENSE_CATEGORY_LABELS[v] ?? v },
    { key: 'amount', label: '金额', sortable: true, render: (v) => formatCNY(v) },
    { key: 'description', label: '说明' },
    { key: 'submit_date', label: '日期', sortable: true },
    {
      key: 'status',
      label: '状态',
      render: (v) => statusBadge(v, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_COLORS),
    },
    {
      key: 'id',
      label: '操作',
      render: (_v, row) => {
        if (row.status !== 'submitted') return null
        return (
          <div className="flex gap-2">
            <button
              className="px-2 py-1 text-xs rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); approveExpense(row.id, true) }}
            >
              通过
            </button>
            <button
              className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); approveExpense(row.id, false) }}
            >
              驳回
            </button>
          </div>
        )
      },
    },
  ]

  const budgetCols: Column<BudgetLine>[] = [
    { key: 'category', label: '类别', sortable: true },
    { key: 'project_id', label: '项目', render: (v) => v ?? '全局' },
    { key: 'fiscal_year', label: '年度', sortable: true },
    { key: 'quarter', label: '季度' },
    { key: 'planned_amount', label: '预算', sortable: true, render: (v) => formatCNY(v) },
    {
      key: 'actual_amount',
      label: '实际 / 使用率',
      sortable: true,
      render: (v, row) => {
        const rate = row.planned_amount > 0 ? (row.actual_amount / row.planned_amount) * 100 : 0
        const color = rate > 100 ? 'text-red-600 dark:text-red-400' : rate > 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
        return (
          <span>
            {formatCNY(v)} <span className={`ml-1 font-medium ${color}`}>({rate.toFixed(1)}%)</span>
          </span>
        )
      },
    },
    { key: 'notes', label: '备注' },
  ]

  const invoiceCols: Column<FinanceInvoice>[] = [
    { key: 'vendor', label: '供应商', sortable: true },
    { key: 'category', label: '类别' },
    { key: 'amount', label: '金额', sortable: true, render: (v) => formatCNY(v) },
    { key: 'invoice_date', label: '开票日期', sortable: true },
    { key: 'due_date', label: '到期日', sortable: true },
    {
      key: 'status',
      label: '状态',
      render: (v) => statusBadge(v, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS),
    },
    { key: 'project_id', label: '项目', render: (v) => v ?? '-' },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">财务管理</h1>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="总报销"
          value={summary ? formatCNY(summary.total_expenses) : '-'}
          icon={<DollarSign size={20} />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="待审批"
          value={summary?.pending_approvals ?? '-'}
          icon={<Clock size={20} />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          label="预算使用率"
          value={summary ? `${(summary.budget_utilization_rate * 100).toFixed(1)}%` : '-'}
          icon={<PieChart size={20} />}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          label="逾期发票"
          value={summary?.overdue_invoices ?? '-'}
          icon={<AlertTriangle size={20} />}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 self-start" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={
              activeTab === key
                ? 'px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 transition-colors'
                : 'px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
            }
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && <LoadingSpinner text="加载中..." />}

      {/* Tab content */}
      {!isLoading && (
        <>
          {activeTab === 'expenses' && (
            <DataTable<ExpenseReport> columns={expenseCols} rows={expenses} emptyMessage="暂无报销记录" />
          )}
          {activeTab === 'budgets' && (
            <div className="flex flex-col gap-6">
              <BudgetOverview />
              <DataTable<BudgetLine> columns={budgetCols} rows={budgets} emptyMessage="暂无预算数据" />
            </div>
          )}
          {activeTab === 'invoices' && (
            <DataTable<FinanceInvoice> columns={invoiceCols} rows={invoices} emptyMessage="暂无发票记录" />
          )}
        </>
      )}
    </div>
  )
}
