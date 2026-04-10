// Layer 3: View Widgets — barrel export
// Part 1 (existing)
export { default as TaskKanban } from './TaskKanban'
export { default as TaskList } from './TaskList'
export { default as ProjectTable } from './ProjectTable'
export { default as ProjectKanban } from './ProjectKanban'
export { default as GanttChart } from './GanttChart'
export { default as ProjectMindMap } from './ProjectMindMap'

// Part 2 — Dashboard views
export { default as BudgetOverview } from './BudgetOverview'
export { default as RiskHeatmap } from './RiskHeatmap'
export { default as TaskDonut } from './TaskDonut'
export { default as ProjectProgress } from './ProjectProgress'
export { default as StagePipeline } from './StagePipeline'

// Part 2 — Activity
export { default as ActivityFeed } from './ActivityFeed'

// Part 2 — HR & Finance
export { default as StaffDirectory } from './StaffDirectory'
export { default as FinanceTable } from './FinanceTable'

// Part 2 — Procurement & Process
export { default as ProcurementTable } from './ProcurementTable'
export { default as ProcessTimeline } from './ProcessTimeline'

// Part 2 — Documents
export { default as DocumentList } from './DocumentList'
export { default as DocumentViewer } from './DocumentViewer'

// Part 2 — Project Documents
export { default as ProjectDocuments } from './ProjectDocuments'

// Part 3 — Calendar, Workload, File
export { default as CalendarView } from './CalendarView'
export { default as WorkloadView } from './WorkloadView'
export { default as FileView } from './FileView'

// Part 4 — Data Visualization Widgets
export { default as ProjectHealthMatrix } from './ProjectHealthMatrix'
export { default as ResourceHeatmap } from './ResourceHeatmap'

// Re-export prop types
export type { TaskKanbanProps } from './TaskKanban'
export type { ProjectTableProps } from './ProjectTable'
export type { BudgetOverviewProps } from './BudgetOverview'
export type { RiskHeatmapProps } from './RiskHeatmap'
export type { TaskDonutProps } from './TaskDonut'
export type { ProjectProgressProps } from './ProjectProgress'
export type { StagePipelineProps } from './StagePipeline'
export type { ActivityFeedProps } from './ActivityFeed'
export type { StaffDirectoryProps } from './StaffDirectory'
export type { FinanceTableProps } from './FinanceTable'
export type { ProcurementTableProps } from './ProcurementTable'
export type { ProcessTimelineProps } from './ProcessTimeline'
export type { DocumentListProps } from './DocumentList'
export type { DocumentViewerProps } from './DocumentViewer'
export type { CalendarViewProps } from './CalendarView'
export type { WorkloadViewProps } from './WorkloadView'
export type { FileViewProps } from './FileView'
export type { ProjectHealthMatrixProps } from './ProjectHealthMatrix'
export type { ResourceHeatmapProps } from './ResourceHeatmap'
