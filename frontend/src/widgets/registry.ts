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
  { type: 'stat-card', component: StatCard, title: '统计卡片' },
  { type: 'progress-bar', component: ProgressBar, title: '进度条' },
  { type: 'status-badge', component: StatusBadge, title: '状态标签' },
  { type: 'avatar-group', component: AvatarGroup, title: '头像组' },
  { type: 'empty-state', component: EmptyState, title: '空状态' },
  { type: 'loading-spinner', component: LoadingSpinner, title: '加载动画' },
  { type: 'data-table', component: DataTable, title: '数据表格' },
  { type: 'chart', component: Chart, title: '图表' },
  { type: 'search-bar', component: SearchBar, title: '搜索栏' },
  { type: 'task-filters', component: TaskFilters, title: '任务筛选' },
  { type: 'view-switcher', component: ViewSwitcher, title: '视图切换' },
]

for (const w of atomicWidgets) {
  registry.register({
    type: w.type,
    layer: 'atomic',
    component: w.component,
    title: w.title,
  })
}
