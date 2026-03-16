import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

export type ChartType = 'bar' | 'line' | 'pie' | 'donut'

export interface ChartSeries {
  dataKey: string
  name?: string
  color?: string
}

export interface ChartProps {
  type: ChartType
  chartData: Array<Record<string, any>>
  series: ChartSeries[]
  xAxisKey?: string
  height?: number
  /** Chat injection data */
  data?: any
}

const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899',
]

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      {label && <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</div>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}: <strong>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

const Chart: React.FC<ChartProps> = (props) => {
  const injected = props.data
  const chartData = injected?.chartData ?? props.chartData
  const series = injected?.series ?? props.series
  const type = injected?.type ?? props.type
  const xAxisKey = injected?.xAxisKey ?? props.xAxisKey ?? 'name'
  const height = injected?.height ?? props.height ?? 300

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-500 dark:text-gray-400">
        暂无图表数据
      </div>
    )
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            className="text-gray-500 dark:text-gray-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-gray-500 dark:text-gray-400"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          {series.map((s: ChartSeries, i: number) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          {series.map((s: ChartSeries, i: number) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // pie / donut
  const isPie = type === 'pie'
  const innerRadius = isPie ? 0 : '55%'
  const outerRadius = '85%'
  const dataKey = series[0]?.dataKey ?? 'value'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey={dataKey}
          startAngle={90}
          endAngle={-270}
        >
          {chartData.map((entry: Record<string, any>, i: number) => (
            <Cell
              key={i}
              fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default Chart
