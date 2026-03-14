import React from 'react'
import { StatusBadge } from '../atomic'
import type { StatusVariant } from '../atomic'
import type { FinanceInvoice } from '../../types'

export interface InvoiceItemProps {
  invoice: FinanceInvoice
  onClick?: (invoice: FinanceInvoice) => void
}

const INVOICE_STATUS_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  pending: { variant: 'warning', label: '待付' },
  paid: { variant: 'success', label: '已付' },
  overdue: { variant: 'danger', label: '逾期' },
}

const CATEGORY_LABELS: Record<string, string> = {
  travel: '差旅',
  office: '办公',
  entertainment: '招待',
  material: '材料',
  other: '其他',
}

function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const InvoiceItem: React.FC<InvoiceItemProps> = ({ invoice, onClick }) => {
  const isOverdue = invoice.status === 'overdue'
  const statusInfo = INVOICE_STATUS_MAP[invoice.status] ?? { variant: 'default' as StatusVariant, label: invoice.status }

  return (
    <article
      className={[
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3.5',
        'hover:shadow-md transition-all duration-200',
        isOverdue ? 'border-l-4 border-l-red-500' : '',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={() => onClick?.(invoice)}
      aria-label={`${invoice.vendor} 发票`}
    >
      {/* Header: vendor + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm leading-snug truncate text-gray-800 dark:text-gray-100">
            {invoice.vendor}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {invoice.project_id ?? '无项目'}
          </div>
        </div>
        <StatusBadge status={statusInfo.variant} label={statusInfo.label} size="sm" />
      </div>

      {/* Amount */}
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3 tracking-tight">
        {formatCNY(invoice.amount)}
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {CATEGORY_LABELS[invoice.category] ?? invoice.category}
        </span>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
        <div>
          <div className="mb-0.5">开票日期</div>
          <div className="font-medium text-gray-800 dark:text-gray-100">{invoice.invoice_date}</div>
        </div>
        <div className="text-right">
          <div className={`mb-0.5 ${isOverdue ? 'text-red-500 dark:text-red-400' : ''}`}>到期日期</div>
          <div className={`font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
            {invoice.due_date}
          </div>
        </div>
      </div>
    </article>
  )
}

export default InvoiceItem
