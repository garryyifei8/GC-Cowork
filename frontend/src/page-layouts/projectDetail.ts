import type { PageLayout } from '../widgets/types'

export const projectDetailLayout: PageLayout = {
  title: '项目详情',
  grid: 'dashboard',
  slots: [
    // Row 1: key stat cards
    { id: 'stat-progress', widgetType: 'stat_card', props: { label: '整体进度', metric: 'completion_rate', icon: 'BarChart2', accentColor: '#0086c0' } },
    { id: 'stat-tasks', widgetType: 'stat_card', props: { label: '任务总数', metric: 'total_tasks', icon: 'CheckCircle2', accentColor: '#00ca72' } },
    { id: 'stat-risk', widgetType: 'stat_card', props: { label: '风险等级', metric: 'risk_level', icon: 'AlertTriangle', accentColor: '#e2445c' } },

    // Stage pipeline
    { id: 'stage-pipeline', widgetType: 'stage_pipeline' },

    // Task kanban
    { id: 'task-kanban', widgetType: 'task_kanban' },

    // Risk heatmap
    { id: 'risk-heatmap', widgetType: 'risk_heatmap' },

    // Budget overview
    { id: 'budget-overview', widgetType: 'budget_overview' },

    // Process timeline
    { id: 'process_timeline', widgetType: 'process_timeline' },

    // Procurement table
    { id: 'procurement-table', widgetType: 'procurement_table' },
  ],
}
