import React, { useState } from 'react'
import { Plus, Loader2, Check } from 'lucide-react'
import { EmptyState } from '../atomic'
import type { ProcessRecord } from '../../types'
import {
  PROCESS_RECORD_TYPE_LABELS,
  PROCESS_RECORD_TYPE_ICONS,
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_COLORS,
} from '../../utils/constants'

export interface ProcessTimelineProps {
  data?: {
    records?: ProcessRecord[]
    project_id?: string
  }
  onCreate?: (record: Partial<ProcessRecord>) => Promise<{ id: string } | void>
}

const ProcessTimeline: React.FC<ProcessTimelineProps> = ({ data, onCreate }) => {
  const [records, setRecords] = useState<ProcessRecord[]>(data?.records ?? [])
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRecord, setNewRecord] = useState({ title: '', record_type: 'daily_log', content: '' })

  const projectId = data?.project_id ?? (records[0]?.project_id) ?? ''

  // Sync prop changes
  React.useEffect(() => {
    if (data?.records) setRecords(data.records)
  }, [data?.records])

  const handleCreate = async () => {
    if (!newRecord.title.trim()) return
    setCreating(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const recordData: ProcessRecord = {
        id: `new-${Date.now()}`,
        project_id: projectId,
        record_type: newRecord.record_type,
        title: newRecord.title,
        date: today,
        author: '当前用户',
        content: newRecord.content,
        status: 'normal',
        attachments: [],
        related_stage: '',
      }

      if (onCreate) {
        const result = await onCreate(recordData)
        if (result?.id) recordData.id = result.id
      }

      setRecords((prev) => [recordData, ...prev])
      setNewRecord({ title: '', record_type: 'daily_log', content: '' })
      setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  if (records.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center gap-3">
        <EmptyState icon="clipboard" title="暂无过程记录" description="点击下方按钮创建第一条记录" />
        {onCreate && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={13} />
            新增记录
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {records.length} 条记录
        </span>
        {onCreate && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={13} />
            新增记录
          </button>
        )}
      </div>

      {/* Inline creation form */}
      {showForm && (
        <div className="p-3 rounded-lg border border-blue-500/30 bg-gray-50 dark:bg-gray-800/50 space-y-2">
          <input
            type="text"
            placeholder="记录标题"
            value={newRecord.title}
            onChange={(e) => setNewRecord((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={newRecord.record_type}
              onChange={(e) => setNewRecord((p) => ({ ...p, record_type: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            >
              {Object.entries(PROCESS_RECORD_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="内容描述"
              value={newRecord.content}
              onChange={(e) => setNewRecord((p) => ({ ...p, content: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newRecord.title.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              创建
            </button>
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="flex flex-col gap-3">
        {records.map((rec) => {
          const icon = PROCESS_RECORD_TYPE_ICONS[rec.record_type] ?? '📄'
          const typeLabel = PROCESS_RECORD_TYPE_LABELS[rec.record_type] ?? rec.record_type
          const statusColor = PROCESS_STATUS_COLORS[rec.status] ?? '#676879'
          const statusLabel = PROCESS_STATUS_LABELS[rec.status] ?? rec.status

          return (
            <div
              key={rec.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow"
            >
              <span className="text-lg mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {typeLabel}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {rec.title}
                  </span>
                </div>
                {rec.content && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">
                    {rec.content}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{rec.date}</span>
                  <span>{rec.author}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-medium"
                    style={{ backgroundColor: statusColor }}
                  >
                    {statusLabel}
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

export default ProcessTimeline
