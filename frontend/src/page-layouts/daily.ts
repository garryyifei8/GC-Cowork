import type { PageLayout } from '../widgets/types'

export const dailyLayout: PageLayout = {
  title: '我的日常',
  grid: 'dashboard',
  slots: [
    // Stat cards
    { id: 'stat-leave', widgetType: 'stat_card', props: { label: '年假剩余', metric: 'remaining_annual', icon: 'Calendar', accentColor: '#FDAB3D' } },
    { id: 'stat-expense', widgetType: 'stat_card', props: { label: '处理中报销', metric: 'pending_expenses', icon: 'Receipt', accentColor: '#0073ea' } },

    // Activity feed
    { id: 'activity-feed', widgetType: 'activity_feed' },

    // Task list — my tasks
    { id: 'task-list', widgetType: 'task_list', props: { scope: 'mine' } },
  ],
}
