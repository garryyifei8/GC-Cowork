import React, { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

import { EmptyState } from '../atomic'
import type { ProcurementPackage } from '../../types'
import {
  PROCUREMENT_STATUS_LABELS,
  PROCUREMENT_STATUS_COLORS,
  PROCUREMENT_CATEGORIES,
} from '../../utils/constants'

export interface ProcurementTableProps {
  data?: { packages?: ProcurementPackage[] }
  onStatusChange?: (pkgId: string, projectId: string, newStatus: string) => Promise<void>
  onCreate?: (data: Partial<ProcurementPackage>) => Promise<void>
}

const STATUS_OPTIONS = [
  { value: 'planning', label: '规划中' },
  { value: 'bidding', label: '招标中' },
  { value: 'contracted', label: '已签约' },
  { value: 'in_progress', label: '执行中' },
  { value: 'delivered', label: '已到货' },
  { value: 'completed', label: '已完成' },
]

const ProcurementTable: React.FC<ProcurementTableProps> = ({ data, onStatusChange, onCreate }) => {
  const packages = data?.packages ?? []
  const [localPackages, setLocalPackages] = useState<ProcurementPackage[]>(packages)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPkg, setNewPkg] = useState({ name: '', category: '材料', supplier: '', budget_amount: '' })
  const [creating, setCreating] = useState(false)

  // Sync prop changes
  React.useEffect(() => {
    if (data?.packages) setLocalPackages(data.packages)
  }, [data?.packages])

  const handleCreate = async () => {
    if (!newPkg.name.trim() || !onCreate) return
    setCreating(true)
    try {
      await onCreate({
        name: newPkg.name,
        category: newPkg.category,
        supplier: newPkg.supplier || null,
        budget_amount: newPkg.budget_amount ? parseFloat(newPkg.budget_amount) : null,
      })
      setNewPkg({ name: '', category: '材料', supplier: '', budget_amount: '' })
      setShowAddForm(false)
    } finally {
      setCreating(false)
    }
  }

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

  if (localPackages.length === 0 && !showAddForm) {
    return (
      <div className="flex flex-col items-center gap-3">
        <EmptyState icon="package" title="暂无采购数据" description="尚未创建采购包" />
        {onCreate && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={13} /> 新增采购包
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      {/* Add button + form */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{localPackages.length} 个采购包</span>
        {onCreate && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={13} /> 新增
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-3 p-3 rounded-lg border border-blue-500/30 bg-gray-50 dark:bg-gray-800/50 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="采购包名称"
              value={newPkg.name}
              onChange={(e) => setNewPkg((p) => ({ ...p, name: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-sm border border-[#E8ECF4] dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newPkg.category}
              onChange={(e) => setNewPkg((p) => ({ ...p, category: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-[#E8ECF4] dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            >
              {PROCUREMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="供应商（可选）"
              value={newPkg.supplier}
              onChange={(e) => setNewPkg((p) => ({ ...p, supplier: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-sm border border-[#E8ECF4] dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="预算金额"
              value={newPkg.budget_amount}
              onChange={(e) => setNewPkg((p) => ({ ...p, budget_amount: e.target.value }))}
              className="w-32 px-3 py-1.5 text-sm border border-[#E8ECF4] dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-sm text-light-text-secondary border border-[#E8ECF4] dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newPkg.name.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {creating && <Loader2 size={12} className="animate-spin" />}
              创建
            </button>
          </div>
        </div>
      )}

      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-[#E6FAF0] dark:bg-gray-900/50 border-b border-[#E8ECF4] dark:border-gray-700">
            <th className="px-3 py-2 text-left text-base font-medium text-light-text dark:text-gray-400">采购包</th>
            <th className="px-3 py-2 text-left text-base font-medium text-light-text dark:text-gray-400">分类</th>
            <th className="px-3 py-2 text-left text-base font-medium text-light-text dark:text-gray-400">供应商</th>
            <th className="px-3 py-2 text-right text-base font-medium text-light-text dark:text-gray-400">预算</th>
            <th className="px-3 py-2 text-left text-base font-medium text-light-text dark:text-gray-400">状态</th>
          </tr>
        </thead>
        <tbody>
          {localPackages.map((pkg) => {
            const statusColor = PROCUREMENT_STATUS_COLORS[pkg.status] ?? '#919AA3'
            const statusLabel = PROCUREMENT_STATUS_LABELS[pkg.status] ?? pkg.status
            const isUpdating = updatingId === pkg.id

            return (
              <tr
                key={pkg.id}
                className="border-b border-[#E8ECF4] dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
              >
                <td className="px-3 py-2 font-medium text-base text-light-text dark:text-gray-100">{pkg.name}</td>
                <td className="px-3 py-2 text-base text-light-text-secondary dark:text-gray-400">{pkg.category || '—'}</td>
                <td className="px-3 py-2 text-base text-light-text-secondary dark:text-gray-400">{pkg.supplier ?? '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-base text-light-text dark:text-gray-100">
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
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[13px] bg-white dark:bg-gray-700 border border-[#E8ECF4] dark:border-gray-600 rounded px-1 py-0.5 cursor-pointer text-light-text dark:text-gray-100"
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
