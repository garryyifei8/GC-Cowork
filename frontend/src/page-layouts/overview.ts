import type { PageLayout } from '../widgets/types'

export const overviewLayout: PageLayout = {
  title: '工作台',
  grid: 'dashboard',
  slots: [
    // Row 1: stat cards (4 metrics, each 1 col in 4-col grid)
    { id: 'stat-total', widgetType: 'stat_card', props: { label: '项目总数', metric: 'total_projects', icon: 'FolderKanban', accentColor: '#3b82f6' } },
    { id: 'stat-active', widgetType: 'stat_card', props: { label: '活跃项目', metric: 'active_projects', icon: 'Activity', accentColor: '#00ca72' } },
    { id: 'stat-risk', widgetType: 'stat_card', props: { label: '风险项目', metric: 'at_risk_projects', icon: 'AlertTriangle', accentColor: '#e2445c' } },
    { id: 'stat-overdue', widgetType: 'stat_card', props: { label: '逾期任务', metric: 'overdue_tasks', icon: 'Clock', accentColor: '#f59e0b' } },

    // Row 2: stage pipeline — full width
    { id: 'stage-pipeline', widgetType: 'stage_pipeline', className: 'col-span-4' },

    // Row 3: three charts (first two span 1 col, last spans 2 cols to fill 4-col grid)
    { id: 'task-donut', widgetType: 'task_donut' },
    { id: 'project-progress', widgetType: 'project_progress' },
    { id: 'budget-overview', widgetType: 'budget_overview', className: 'col-span-2' },

    // Row 4: risk heatmap + activity feed (each spans 2 cols)
    { id: 'risk-heatmap', widgetType: 'risk_heatmap', className: 'col-span-2' },
    { id: 'activity-feed', widgetType: 'activity_feed', className: 'col-span-2' },
  ],
}
