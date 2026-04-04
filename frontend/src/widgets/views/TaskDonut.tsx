import React from 'react'
import { Chart } from '../atomic'
import { EmptyState } from '../atomic'
import { useDashboardStore } from '../../stores/dashboardStore'
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/constants'

export interface TaskDonutProps {
  data?: {
    distribution?: Record<string, number>
    totalTasks?: number
  }
}

const STATUS_ORDER = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const

const TaskDonut: React.FC<TaskDonutProps> = ({ data }) => {
  const storeMetrics = useDashboardStore((s) => s.metrics)
  const distribution = data?.distribution ?? storeMetrics?.task_status_distribution ?? {}
  const totalTasks = data?.totalTasks ?? storeMetrics?.total_tasks ?? 0

  const chartData = STATUS_ORDER.map((key) => ({
    name: TASK_STATUS_LABELS[key] ?? key,
    value: distribution[key] ?? 0,
    color: TASK_STATUS_COLORS[key] ?? '#999',
  })).filter((d) => d.value > 0)

  if (chartData.length === 0) {
    return <EmptyState icon="clipboard" title="暂无任务数据" description="尚未创建任何任务" />
  }

  return (
    <div
      className="bg-white  border border-[#E8ECF4]  rounded-[10px] p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="任务状态分布环形图"
    >
      <h2 className="text-base font-medium text-light-text  flex-shrink-0">
        任务状态
      </h2>

      {/* Donut chart */}
      <div className="relative flex justify-center">
        <Chart
          type="donut"
          chartData={chartData}
          series={[{ dataKey: 'value', name: '数量' }]}
          height={160}
        />
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold leading-none text-light-text ">
            {totalTasks}
          </span>
          <span className="text-xs text-light-text-secondary  font-medium">任务</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5" role="list">
        {STATUS_ORDER.map((key) => {
          const val = distribution[key] ?? 0
          const color = TASK_STATUS_COLORS[key] ?? '#999'
          const label = TASK_STATUS_LABELS[key] ?? key
          return (
            <div
              key={key}
              className="flex items-center gap-2 text-[0.8125rem] text-light-text-secondary "
              role="listitem"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
              <span className="flex-1 text-[0.8125rem]">{label}</span>
              <span className="font-medium text-[0.8125rem] min-w-[24px] text-right text-light-text ">
                {val}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TaskDonut
