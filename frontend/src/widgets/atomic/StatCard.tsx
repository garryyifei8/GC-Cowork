import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  trend?: number
  icon?: React.ReactNode
  iconColor?: string
  /** Chat injection data */
  data?: { label?: string; value?: string | number; trend?: number }
}

const StatCard: React.FC<StatCardProps> = (props) => {
  const d = props.data
  const label = d?.label ?? props.label
  const value = d?.value ?? props.value
  const trend = d?.trend ?? props.trend
  const icon = props.icon
  const iconColor = props.iconColor ?? 'bg-primary/10 text-primary'

  const isPositive = trend !== undefined && trend >= 0

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">
        {value}
      </div>
      {trend !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-sm font-medium ${
            isPositive ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        </div>
      )}
    </div>
  )
}

export default StatCard
