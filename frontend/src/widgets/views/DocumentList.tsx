import React, { useMemo, useState } from 'react'
import { Search, FolderOpen } from 'lucide-react'
import { DocumentItem } from '../business'
import { EmptyState } from '../atomic'
import type { KnowledgeDoc } from '../../types'

export interface DocumentListProps {
  data?: { docs?: KnowledgeDoc[] }
  onDocClick?: (doc: KnowledgeDoc) => void
}

const CATEGORIES = [
  { id: 'all', name: '全部分类' },
  { id: 'project', name: '项目经验库' },
  { id: 'policy', name: '政策与制度' },
  { id: 'template', name: '标准模板' },
  { id: 'tech', name: '技术文档' },
]

const DEFAULT_DOCS: KnowledgeDoc[] = [
  { id: 1, title: '智慧园区EPC项目全流程复盘记录_V1.2', author: '王项目', date: '2小时前', type: 'pdf', likes: 12 },
  { id: 2, title: '【国家发改委】2026年专项债申报指南', author: '知识库助手 (AI抓取)', date: '昨天 14:30', type: 'doc', likes: 45 },
  { id: 3, title: '信息化集成平台公共组件API文档_v2.0', author: '李开发', date: '昨天 09:15', type: 'code', likes: 38 },
  { id: 4, title: '博物馆展陈设计标准合同模板(2026版)', author: '赵法务', date: '3天前', type: 'doc', likes: 56 },
]

const DocumentList: React.FC<DocumentListProps> = ({ data, onDocClick }) => {
  const docs = data?.docs ?? DEFAULT_DOCS
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      if (search) {
        const q = search.toLowerCase()
        if (!doc.title.toLowerCase().includes(q) && !doc.author.toLowerCase().includes(q)) {
          return false
        }
      }
      // Category filter would require doc.category but KnowledgeDoc doesn't have it — show all
      return true
    })
  }, [docs, search])

  if (docs.length === 0) {
    return <EmptyState icon="file-text" title="暂无文档" description="知识库中尚无文档" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <input
          type="text"
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="搜索文档标题或作者..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={16} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">知识分类</span>
            </div>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={
                    categoryFilter === cat.id
                      ? 'flex items-center px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium cursor-pointer'
                      : 'flex items-center px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                  }
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Doc grid */}
        <main className="lg:col-span-3">
          {filtered.length === 0 ? (
            <EmptyState icon="file-text" title="无匹配结果" description="请调整搜索条件" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <DocumentItem key={doc.id} doc={doc} onClick={onDocClick} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DocumentList
