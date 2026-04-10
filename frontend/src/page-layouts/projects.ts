import type { PageLayout } from '../widgets/types'

export const projectsLayout: PageLayout = {
  title: '项目集概览',
  grid: 'single',
  slots: [
    // View switcher for table / kanban / gantt
    { id: 'view-switcher', widgetType: 'view_switcher', props: { views: ['table', 'kanban', 'gantt'] } },
    // Default view: project table (widget handles view switching)
    { id: 'project-table', widgetType: 'project_table' },
  ],
}
