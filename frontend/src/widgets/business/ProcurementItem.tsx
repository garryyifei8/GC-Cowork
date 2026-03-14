import React from 'react'
import { StatusBadge } from '../atomic'
import type { StatusVariant } from '../atomic'
import type { ProcurementPackage } from '../../types'

export interface ProcurementItemProps {
  pkg: ProcurementPackage
  onClick?: (pkg: ProcurementPackage) => void
}

const PROCUREMENT_STATUS_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  planned: { variant: 'info', label: '已计划' },
  inquiry: { variant: 'info', label: '询价中' },
  ordered: { variant: 'warning', label: '已下单' },
  in_transit: { variant: 'warning', label: '运输中' },
  delivered: { variant: 'success', label: '已到货' },
  inspected: { variant: 'success', label: '已验收' },
  cancelled: { variant: 'danger', label: '已取消' },
}

function formatWan(amount: number | null | undefined): string {
  if (amount == null) return '—'
  const wan = amount / 10000
  return `${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}万`
}

const ProcurementItem: React.FC<ProcurementItemProps> = ({ pkg, onClick }) => {
  const statusInfo = PROCUREMENT_STATUS_MAP[pkg.status] ?? { variant: 'default' as StatusVariant, label: pkg.status }
  const overBudget = pkg.budget_amount != null && pkg.actual_amount != null && pkg.actual_amount > pkg.budget_amount

  return (
    <div
      className={[
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3.5',
        'hover:shadow-md transition-all duration-200',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={() => onClick?.(pkg)}
    >
      {/* Header: name + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
            {pkg.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pkg.category || '—'} · {pkg.supplier ?? '无供应商'}
          </div>
        </div>
        <StatusBadge status={statusInfo.variant} label={statusInfo.label} size="sm" />
      </div>

      {/* Budget + actual */}
      <div className="flex items-center gap-4 text-sm mb-2">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">预算</span>
          <span className="ml-1 font-mono text-gray-800 dark:text-gray-100">{formatWan(pkg.budget_amount)}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">实际</span>
          <span className={`ml-1 font-mono ${overBudget ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {pkg.actual_amount != null ? formatWan(pkg.actual_amount) : '—'}
          </span>
        </div>
      </div>

      {/* Footer: responsible + dates */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
        <span>{pkg.responsible ?? '未分配'}</span>
        {pkg.plan_date && <span>计划: {pkg.plan_date}</span>}
      </div>
    </div>
  )
}

export default ProcurementItem
