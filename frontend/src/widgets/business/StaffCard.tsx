import React from 'react'
import { StatusBadge } from '../atomic'
import type { StatusVariant } from '../atomic'
import type { Employee } from '../../types'

export interface StaffCardProps {
  employee: Employee
  onClick?: (employee: Employee) => void
}

const EMP_STATUS_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  active: { variant: 'success', label: '在职' },
  on_leave: { variant: 'warning', label: '休假中' },
  resigned: { variant: 'default', label: '已离职' },
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`
}

const StaffCard: React.FC<StaffCardProps> = ({ employee, onClick }) => {
  const seed = encodeURIComponent(employee.name)
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`
  const statusInfo = EMP_STATUS_MAP[employee.status] ?? { variant: 'default' as StatusVariant, label: employee.status }

  return (
    <article
      className={[
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3.5',
        'hover:shadow-md transition-all duration-200',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={() => onClick?.(employee)}
      aria-label={`员工 ${employee.name}`}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={avatarUrl}
          alt={employee.name}
          className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-700"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate text-gray-800 dark:text-gray-100">
            {employee.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {employee.position}
          </p>
        </div>
      </div>

      {/* Department badge */}
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
          {employee.department}
        </span>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200/60 dark:border-gray-700/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              入职 {employee.hire_date}
            </p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(employee.salary)}
            </p>
          </div>
          <StatusBadge status={statusInfo.variant} label={statusInfo.label} size="sm" />
        </div>
      </div>
    </article>
  )
}

export default StaffCard
