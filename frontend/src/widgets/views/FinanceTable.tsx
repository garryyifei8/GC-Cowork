import React, { useState } from 'react'
import { InvoiceItem } from '../business'
import { EmptyState } from '../atomic'
import { useFinanceStore } from '../../stores/financeStore'
import type { FinanceInvoice, ExpenseReport } from '../../types'
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
  EXPENSE_CATEGORY_LABELS,
} from '../../utils/constants'

export interface FinanceTableProps {
  data?: {
    invoices?: FinanceInvoice[]
    expenses?: ExpenseReport[]
  }
}

type TabKey = 'expenses' | 'invoices'

function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const FinanceTable: React.FC<FinanceTableProps> = ({ data }) => {
  const storeExpenses = useFinanceStore((s) => s.expenses)
  const storeInvoices = useFinanceStore((s) => s.invoices)

  const expenses = data?.expenses ?? storeExpenses
  const invoices = data?.invoices ?? storeInvoices

  const [activeTab, setActiveTab] = useState<TabKey>('expenses')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredExpenses = statusFilter
    ? expenses.filter((e) => e.status === statusFilter)
    : expenses

  const filteredInvoices = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices

  const hasData = expenses.length > 0 || invoices.length > 0

  if (!hasData) {
    return <EmptyState icon="wallet" title="暂无财务数据" description="尚未录入财务记录" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1" role="tablist">
        {([
          { key: 'expenses' as TabKey, label: '报销记录' },
          { key: 'invoices' as TabKey, label: '发票管理' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={
              activeTab === key
                ? 'px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 transition-colors'
                : 'px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
            }
            onClick={() => { setActiveTab(key); setStatusFilter('') }}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {activeTab === 'expenses' ? `${filteredExpenses.length} 条记录` : `${filteredInvoices.length} 条记录`}
        </span>
        <select
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按状态筛选"
        >
          <option value="">全部状态</option>
          {activeTab === 'expenses'
            ? Object.entries(EXPENSE_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))
            : ['pending', 'paid', 'overdue'].map((val) => (
                <option key={val} value={val}>
                  {val === 'pending' ? '待付' : val === 'paid' ? '已付' : '逾期'}
                </option>
              ))
          }
        </select>
      </div>

      {/* Content */}
      {activeTab === 'expenses' ? (
        filteredExpenses.length === 0 ? (
          <EmptyState icon="receipt" title="无匹配记录" description="请调整筛选条件" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {filteredExpenses.map((expense) => {
              const statusColor = EXPENSE_STATUS_COLORS[expense.status] ?? '#676879'
              return (
                <article
                  key={expense.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3.5 hover:shadow-md transition-all duration-200"
                  role="listitem"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                        {expense.submitter}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {expense.project_id ?? '无项目'}
                      </div>
                    </div>
                    <span
                      className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ color: statusColor, backgroundColor: `${statusColor}1A` }}
                    >
                      {EXPENSE_STATUS_LABELS[expense.status] ?? expense.status}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3 tracking-tight">
                    {formatCNY(expense.amount)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {expense.submit_date}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )
      ) : (
        filteredInvoices.length === 0 ? (
          <EmptyState icon="file-text" title="无匹配记录" description="请调整筛选条件" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {filteredInvoices.map((invoice) => (
              <InvoiceItem key={invoice.id} invoice={invoice} />
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default FinanceTable
