import React from 'react'

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

export interface StatusBadgeProps {
  status: StatusVariant
  label: string
  size?: 'sm' | 'md'
  /** Chat injection data */
  data?: { status?: StatusVariant; label?: string }
}

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  default: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  const d = props.data
  const status = d?.status ?? props.status
  const label = d?.label ?? props.label
  const size = props.size ?? 'md'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border whitespace-nowrap ${variantClasses[status]} ${sizeClasses[size]}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
