import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'
import { EmptyState } from '../atomic'
import { useProjectStore } from '../../stores/projectStore'
import type { Project } from '../../types'

export interface ProjectProgressProps {
  data?: { projects?: Project[] }
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return '#00C875'
  if (pct >= 40) return '#FDAB3D'
  return '#E2445C'
}

function truncate(str: string, maxLen = 8): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { value, payload: d } = payload[0]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm max-w-[200px]">
      <div className="font-semibold mb-0.5 text-gray-800 dark:text-gray-100">{d.name}</div>
      <div className="text-gray-600 dark:text-gray-300">
        进度: <strong>{Math.round(value)}%</strong>
      </div>
    </div>
  )
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({ data }) => {
  const storeProjects = useProjectStore((s) => s.projects)
  const projects = data?.projects ?? storeProjects

  const chartData = [...projects]
    .sort((a, b) => (b.progress_pct ?? 0) - (a.progress_pct ?? 0))
    .slice(0, 8)
    .map((p) => ({
      name: p.name,
      shortName: truncate(p.name),
      progress: Math.min(Math.max(p.progress_pct ?? 0, 0), 100),
    }))

  if (chartData.length === 0) {
    return <EmptyState icon="bar-chart" title="暂无项目数据" description="尚未创建任何项目" />
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="项目进度对比柱状图"
    >
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex-shrink-0">
        项目进度对比
      </h2>

      <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 32)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 36, bottom: 4, left: 8 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted, #676879)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={72}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted, #676879)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107,191,89,0.06)' }} />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={getProgressColor(entry.progress)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ProjectProgress
