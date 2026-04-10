import { lazy } from 'react'
import type { WidgetDef } from './types'
import {
  StatCard,
  ProgressBar,
  StatusBadge,
  AvatarGroup,
  EmptyState,
  LoadingSpinner,
  DataTable,
  Chart,
  SearchBar,
  TaskFilters,
  ViewSwitcher,
} from './atomic'

class WidgetRegistry {
  private widgets = new Map<string, WidgetDef>()

  register(def: WidgetDef): void {
    if (this.widgets.has(def.type)) {
      console.warn(`Widget "${def.type}" is already registered. Overwriting.`)
    }
    this.widgets.set(def.type, def)
  }

  get(type: string): WidgetDef | undefined {
    return this.widgets.get(type)
  }

  has(type: string): boolean {
    return this.widgets.has(type)
  }

  getAll(): WidgetDef[] {
    return Array.from(this.widgets.values())
  }

  getByLayer(layer: WidgetDef['layer']): WidgetDef[] {
    return this.getAll().filter(w => w.layer === layer)
  }
}

export const registry = new WidgetRegistry()

// ---------------------------------------------------------------------------
// Register all Layer 1 (atomic) widgets synchronously
// ---------------------------------------------------------------------------
const atomicWidgets: Array<{ type: string; component: any; title: string }> = [
  { type: 'stat_card', component: StatCard, title: '统计卡片' },
  { type: 'progress_bar', component: ProgressBar, title: '进度条' },
  { type: 'status_badge', component: StatusBadge, title: '状态标签' },
  { type: 'avatar_group', component: AvatarGroup, title: '头像组' },
  { type: 'empty_state', component: EmptyState, title: '空状态' },
  { type: 'loading_spinner', component: LoadingSpinner, title: '加载动画' },
  { type: 'data_table', component: DataTable, title: '数据表格' },
  { type: 'chart', component: Chart, title: '图表' },
  { type: 'search_bar', component: SearchBar, title: '搜索栏' },
  { type: 'task_filters', component: TaskFilters, title: '任务筛选' },
  { type: 'view_switcher', component: ViewSwitcher, title: '视图切换' },
]

for (const w of atomicWidgets) {
  registry.register({
    type: w.type,
    layer: 'atomic',
    component: w.component,
    title: w.title,
  })
}

// ---------------------------------------------------------------------------
// Register Layer 3 (view) widgets — lazy loaded
// ---------------------------------------------------------------------------

const viewWidgets: Array<{ type: string; component: any; title: string }> = [
  { type: 'task_kanban', component: lazy(() => import('./views/TaskKanban')), title: '任务看板' },
  { type: 'task_list', component: lazy(() => import('./views/TaskList')), title: '任务列表' },
  { type: 'project_table', component: lazy(() => import('./views/ProjectTable')), title: '项目表格' },
  { type: 'project_kanban', component: lazy(() => import('./views/ProjectKanban')), title: '项目看板' },
  { type: 'gantt', component: lazy(() => import('./views/GanttChart')), title: '甘特图' },
  { type: 'project_mindmap', component: lazy(() => import('./views/ProjectMindMap')), title: '思维导图' },
  // Dashboard views
  { type: 'budget_overview', component: lazy(() => import('./views/BudgetOverview')), title: '预算概览' },
  { type: 'risk_heatmap', component: lazy(() => import('./views/RiskHeatmap')), title: '风险热力图' },
  { type: 'task_donut', component: lazy(() => import('./views/TaskDonut')), title: '任务状态分布' },
  { type: 'project_progress', component: lazy(() => import('./views/ProjectProgress')), title: '项目进度对比' },
  { type: 'stage_pipeline', component: lazy(() => import('./views/StagePipeline')), title: '阶段管线' },
  // Activity
  { type: 'activity_feed', component: lazy(() => import('./views/ActivityFeed')), title: '活动动态' },
  // HR & Finance
  { type: 'staff_directory', component: lazy(() => import('./views/StaffDirectory')), title: '员工名录' },
  { type: 'finance_table', component: lazy(() => import('./views/FinanceTable')), title: '财务管理' },
  // Procurement & Process
  { type: 'procurement_table', component: lazy(() => import('./views/ProcurementTable')), title: '采购管理' },
  { type: 'process_timeline', component: lazy(() => import('./views/ProcessTimeline')), title: '过程记录' },
  // Documents
  { type: 'document_list', component: lazy(() => import('./views/DocumentList')), title: '文档列表' },
  { type: 'document_viewer', component: lazy(() => import('./views/DocumentViewer')), title: '文档查看器' },
  // Phase 3 — Management dashboards
  { type: 'project_health_matrix', component: lazy(() => import('./views/ProjectHealthMatrix')), title: '项目健康矩阵' },
  { type: 'resource_heatmap', component: lazy(() => import('./views/ResourceHeatmap')), title: '资源热力图' },
  // Phase 4 — Multi-view
  { type: 'calendar_view', component: lazy(() => import('./views/CalendarView')), title: '日历视图' },
  { type: 'workload_view', component: lazy(() => import('./views/WorkloadView')), title: '工作负荷视图' },
  { type: 'file_view', component: lazy(() => import('./views/FileView')), title: '文件视图' },
]

for (const w of viewWidgets) {
  registry.register({
    type: w.type,
    layer: 'view',
    component: w.component,
    title: w.title,
  })
}
