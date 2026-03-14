import type { PageLayout } from '../widgets/types'

export const financeLayout: PageLayout = {
  title: '财务管理',
  grid: 'dashboard',
  slots: [
    // Row 1: Finance stat cards (4 metrics from FinanceDashboard)
    { id: 'stat-expenses', widgetType: 'stat_card', props: { label: '报销总额', metric: 'total_expenses', icon: 'Wallet', accentColor: '#3b82f6' } },
    { id: 'stat-pending', widgetType: 'stat_card', props: { label: '待审批', metric: 'pending_approvals', icon: 'FileText', accentColor: '#f59e0b' } },
    { id: 'stat-budget', widgetType: 'stat_card', props: { label: '预算使用率', metric: 'budget_utilization', icon: 'TrendingUp', accentColor: '#0086c0' } },
    { id: 'stat-overdue', widgetType: 'stat_card', props: { label: '逾期发票', metric: 'overdue_invoices', icon: 'AlertTriangle', accentColor: '#e2445c' } },

    // Finance table (tabs for expenses / budgets / invoices handled inside)
    { id: 'finance-table', widgetType: 'finance_table' },
  ],
}
