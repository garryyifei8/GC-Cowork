import React from 'react'
import { EmptyState } from '../atomic'
import { useProjectStore } from '../../stores/projectStore'
import type { Project } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_WIDTH = 120

function getMonthsBetween(start: Date, end: Date): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (current <= endMonth) {
    months.push({
      key: `${current.getFullYear()}-${current.getMonth()}`,
      label: `${current.getFullYear()}年${current.getMonth() + 1}月`,
    })
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#00C875'
    case 'risk': return '#E2445C'
    case 'planning': return '#0086C0'
    case 'completed': return '#676879'
    default: return '#6BBF59'
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GanttChartProps {
  data?: { projects?: Project[] }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const GanttChart: React.FC<GanttChartProps> = ({ data }) => {
  const storeProjects = useProjectStore((s) => s.projects)
  const projects = data?.projects ?? storeProjects

  if (projects.length === 0) {
    return <EmptyState icon="calendar" title="暂无项目" description="添加项目以查看甘特图" />
  }

  const now = new Date()
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const dueDates = projects
    .map((p) => (p.due_date ? new Date(p.due_date) : null))
    .filter((d): d is Date => d !== null)

  const maxDue = dueDates.length > 0
    ? new Date(Math.max(...dueDates.map((d) => d.getTime())))
    : new Date(now.getFullYear(), now.getMonth() + 6, 1)

  const rangeEnd = new Date(maxDue.getFullYear(), maxDue.getMonth() + 2, 1)
  const months = getMonthsBetween(rangeStart, rangeEnd)
  const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  const totalWidth = months.length * MONTH_WIDTH

  const getBarStyle = (project: Project) => {
    const endDate = project.due_date
      ? new Date(project.due_date)
      : new Date(now.getFullYear(), now.getMonth() + 3, 1)

    const totalDuration = 180
    const elapsedDays = (project.progress_pct / 100) * totalDuration
    const startDate = new Date(now.getTime() - elapsedDays * 24 * 60 * 60 * 1000)

    const startOffset = Math.max(0, (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))
    const endOffset = Math.min(totalDays, (endDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))
    const barWidth = Math.max(30, endOffset - startOffset)

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(barWidth / totalDays) * 100}%`,
      backgroundColor: getStatusColor(project.status),
    }
  }

  const todayOffset = (now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  const todayPct = (todayOffset / totalDays) * 100

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors duration-200 overflow-x-auto p-0">
      {/* Header */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="w-48 shrink-0 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
          项目
        </div>
        <div className="flex overflow-x-auto" style={{ width: totalWidth }}>
          {months.map((m) => (
            <div
              key={m.key}
              className="px-2 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 text-center border-r border-gray-200 dark:border-gray-700 shrink-0"
              style={{ width: MONTH_WIDTH }}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-x-auto">
        {projects.map((project) => {
          const barStyle = getBarStyle(project)
          return (
            <div
              key={project.id}
              className="flex items-center border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 last:border-b-0"
            >
              <div className="w-48 shrink-0 px-4 py-3 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-center gap-0.5">
                <span className="text-sm font-medium truncate text-gray-800 dark:text-gray-100">{project.name}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{project.status_label}</span>
              </div>
              <div className="flex-1 relative h-10 shrink-0" style={{ width: totalWidth }}>
                {/* Today marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-60"
                  style={{ left: `${todayPct}%`, borderLeft: '2px dashed' }}
                />
                {/* Bar */}
                <div
                  className="absolute top-1 h-8 rounded-md flex items-center justify-end px-2 opacity-90 hover:opacity-100 transition-opacity min-w-[40px]"
                  style={barStyle}
                >
                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                    {project.progress_pct}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GanttChart
