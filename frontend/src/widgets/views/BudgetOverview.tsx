import React from 'react'
import { BudgetRow } from '../business'
import { EmptyState } from '../atomic'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { BudgetSummaryItem } from '../../types'

export interface BudgetOverviewProps {
  data?: { items?: BudgetSummaryItem[] }
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ data }) => {
  const storeMetrics = useDashboardStore((s) => s.metrics)
  const items = (data?.items ?? storeMetrics?.budget_summary ?? []).filter(
    (item): item is BudgetSummaryItem & { budget_amount: number } =>
      item.budget_amount !== null && item.budget_amount > 0
  )

  if (items.length === 0) {
    return <EmptyState icon="wallet" title="暂无预算数据" description="尚未录入预算信息" />
  }

  return (
    <div
      className="bg-white  border border-[#E8ECF4]  rounded-[10px] p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="预算概览"
    >
      <h2 className="text-base font-medium text-light-text  flex-shrink-0">
        预算概览
      </h2>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[280px]" style={{ scrollbarWidth: 'thin' }}>
        {items.map((item) => (
          <BudgetRow key={item.project_id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default BudgetOverview
