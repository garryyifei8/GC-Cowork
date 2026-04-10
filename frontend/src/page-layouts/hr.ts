import type { PageLayout } from '../widgets/types'

export const hrLayout: PageLayout = {
  title: '人力资源',
  grid: 'dashboard',
  slots: [
    // Row 1: HR stat cards (5 metrics from HRDashboard)
    { id: 'stat-total', widgetType: 'stat_card', props: { label: '员工总数', metric: 'total_employees', icon: 'Users', accentColor: '#3b82f6' } },
    { id: 'stat-active', widgetType: 'stat_card', props: { label: '在职人数', metric: 'active_count', icon: 'UserCheck', accentColor: '#00ca72' } },
    { id: 'stat-leave', widgetType: 'stat_card', props: { label: '休假中', metric: 'on_leave_count', icon: 'Clock', accentColor: '#f59e0b' } },
    { id: 'stat-attendance', widgetType: 'stat_card', props: { label: '出勤率', metric: 'attendance_rate', icon: 'CalendarDays', accentColor: '#0086c0' } },

    // Staff directory (tabs for employees / attendance / leaves / salary handled inside)
    { id: 'staff-directory', widgetType: 'staff_directory' },
  ],
}
