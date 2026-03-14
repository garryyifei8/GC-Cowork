import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ProcurementItem } from '../business'
import { EmptyState } from '../atomic'
import type { ProcurementPackage } from '../../types'
import {
  PROCUREMENT_STATUS_LABELS,
  PROCUREMENT_STATUS_COLORS,
} from '../../utils/constants'

export interface ProcurementTableProps {
  data?: { packages?: ProcurementPackage[] }
  onStatusChange?: (pkgId: string, projectId: string, newStatus: string) => Promise<void>
}

const STATUS_OPTIONS = [
  { value: 'planning', label: '规划中' },
  { value: 'bidding', label: '招标中' },
  { value: 'contracted', label: '已签约' },
  { value: 'in_progress', label: '执行中' },
  { value: 'delivered', label: '已到货' },
  { value: 'completed', label: '已完成' },
]

const ProcurementTable: React.FC<ProcurementTableProps> = ({ data, onStatusChange }) => {
  const packages = data?.packages ?? []
  const [localPackages, setLocalPackages] = useState<ProcurementPackage[]>(packages)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Sync prop changes
  React.useEffect(() => {
    if (data?.packages) setLocalPackages(data.packages)
  }, [data?.packages])

  const handleStatusChange = async (pkg: ProcurementPackage, newStatus: string) => {
    setUpdatingId(pkg.id)
    try {
      if (onStatusChange) {
        await onStatusChange(pkg.id, pkg.project_id, newStatus)
      }
      setLocalPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, status: newStatus } : p))
      )
    } finally {
      setUpdatingId(null)
    }
  }

  if (localPackages.length === 0) {
    return <EmptyState icon="package" title="暂无采购数据" description="尚未创建采购包" />
  }

  return (
    <div className="overflow-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">采购包</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">分类</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">供应商</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">预算</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">状态</th>
          </tr>
        </thead>
        <tbody>
          {localPackages.map((pkg) => {
            const statusColor = PROCUREMENT_STATUS_COLORS[pkg.status] ?? '#676879'
            const statusLabel = PROCUREMENT_STATUS_LABELS[pkg.status] ?? pkg.status
            const isUpdating = updatingId === pkg.id

            return (
              <tr
                key={pkg.id}
                className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
              >
                <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{pkg.name}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{pkg.category || '—'}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{pkg.supplier ?? '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-800 dark:text-gray-100">
                  {pkg.budget_amount != null ? `${(pkg.budget_amount / 10000).toFixed(1)}万` : '—'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {isUpdating ? (
                      <Loader2 size={12} className="animate-spin text-blue-500" />
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: statusColor, backgroundColor: `${statusColor}20` }}
                      >
                        {statusLabel}
                      </span>
                    )}
                    {onStatusChange && (
                      <select
                        value={pkg.status}
                        onChange={(e) => handleStatusChange(pkg, e.target.value)}
                        disabled={isUpdating}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 cursor-pointer text-gray-800 dark:text-gray-100"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ProcurementTable
