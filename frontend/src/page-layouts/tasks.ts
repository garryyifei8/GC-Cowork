import type { PageLayout } from '../widgets/types'

export const tasksLayout: PageLayout = {
  title: '任务工作台',
  grid: 'single',
  slots: [
    // Task filters toolbar
    { id: 'task-filters', widgetType: 'task_filters' },
    // Default view: task kanban (widget handles view switching internally)
    { id: 'task-kanban', widgetType: 'task_kanban' },
  ],
}
