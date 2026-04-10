import React from 'react'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { EmptyState } from '../atomic'
import type { DocumentItem as DocumentItemType } from '../../types'

export interface DocumentViewerProps {
  data?: {
    document?: DocumentItemType
    content?: string
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
  review: '审核中',
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ data }) => {
  const doc = data?.document
  const content = data?.content ?? doc?.content_summary ?? ''

  if (!doc) {
    return <EmptyState icon="file-text" title="未选择文档" description="请选择一个文档进行查看" />
  }

  const statusLabel = STATUS_LABELS[doc.status] ?? doc.status

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
          <FileText size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {doc.title}
          </h2>
          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
            <span>作者: {doc.author}</span>
            <span>版本: {doc.version}</span>
            <span>类型: {doc.doc_type}</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400"
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="下载文档"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="新窗口打开"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {content ? (
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            暂无文档内容
          </p>
        )}
      </div>
    </div>
  )
}

export default DocumentViewer
