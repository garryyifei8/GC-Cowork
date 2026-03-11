import React from 'react';
import type { BudgetSummaryItem } from '../../types';

interface BudgetOverviewProps {
  budgetSummary: BudgetSummaryItem[];
}

function getBudgetColor(usagePct: number): string {
  if (usagePct > 90) return '#e2445c';  // danger
  if (usagePct >= 70) return '#f59e0b'; // warning
  return '#00ca72';                      // success
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(Math.round(amount));
}

function truncateName(name: string, max = 12): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budgetSummary }) => {
  // Filter out items without a budget
  const items = budgetSummary.filter(
    (item): item is BudgetSummaryItem & { budget_amount: number } =>
      item.budget_amount !== null && item.budget_amount > 0
  );

  return (
    <div
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="预算概览"
    >
      <h2 className="text-base font-heading font-semibold flex-shrink-0">预算概览</h2>

      {items.length === 0 ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-8 m-0 flex-1 flex items-center justify-center">
          暂无预算数据
        </p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[280px] scrollbar-thin">
          {items.map((item) => {
            const spend = item.actual_spend ?? 0;
            const usagePct = Math.min((spend / item.budget_amount) * 100, 100);
            const displayPct = Math.round(usagePct);
            const color = getBudgetColor(usagePct);

            return (
              <div key={item.project_id} className="flex flex-col gap-1">
                {/* Header row: name + percentage */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[0.8125rem] font-medium flex-1 truncate"
                    title={item.project_name}
                  >
                    {truncateName(item.project_name)}
                  </span>
                  <span
                    className="text-[0.8125rem] font-bold flex-shrink-0"
                    style={{ color }}
                    aria-label={`使用率 ${displayPct}%`}
                  >
                    {displayPct}%
                  </span>
                </div>

                {/* Progress track */}
                <div
                  className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={displayPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.project_name} 预算使用率 ${displayPct}%`}
                >
                  <div
                    className="h-2 rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] min-w-[4px]"
                    style={{
                      width: `${usagePct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                {/* Amount row */}
                <div className="flex items-center gap-1 text-[0.6875rem] text-light-text-secondary dark:text-dark-text-secondary">
                  <span>已用 ¥{formatCurrency(spend)}</span>
                  <span>/ ¥{formatCurrency(item.budget_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
