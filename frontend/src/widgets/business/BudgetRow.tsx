import React from 'react'
import { ProgressBar } from '../atomic'
import type { BudgetSummaryItem } from '../../types'

export interface BudgetRowProps {
  item: BudgetSummaryItem
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return String(Math.round(amount))
}

function getBudgetColor(usagePct: number): string {
  if (usagePct > 90) return '#e2445c'
  if (usagePct >= 70) return '#f59e0b'
  return '#00ca72'
}

const BudgetRow: React.FC<BudgetRowProps> = ({ item }) => {
  const budget = item.budget_amount ?? 0
  const spend = item.actual_spend ?? 0
  if (budget <= 0) return null

  const usagePct = Math.min((spend / budget) * 100, 100)
  const displayPct = Math.round(usagePct)
  const color = getBudgetColor(usagePct)

  return (
    <div className="flex flex-col gap-1">
      {/* Header: name + percentage */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[0.8125rem] font-medium text-[#333] flex-1 truncate"
          title={item.project_name}
        >
          {item.project_name}
        </span>
        <span
          className="text-[0.8125rem] font-bold flex-shrink-0"
          style={{ color }}
          aria-label={`使用率 ${displayPct}%`}
        >
          {displayPct}%
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar value={usagePct} color={color} showLabel={false} size="sm" />

      {/* Amount row */}
      <div className="flex items-center gap-1 text-[0.6875rem] text-[#6C7688]">
        <span>已用 ¥{formatCurrency(spend)}</span>
        <span>/ ¥{formatCurrency(budget)}</span>
      </div>
    </div>
  )
}

export default BudgetRow
