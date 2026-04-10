import React, { useState, useEffect } from 'react'
import {
  Search,
  FileText,
  BookMarked,
  FolderOpen,
  UploadCloud,
  Clock,
  ThumbsUp,
  Loader2,
} from 'lucide-react'
import { useKnowledgeStore } from '../stores/knowledgeStore'

const categories = [
  { id: 'all', name: '全部分类' },
  { id: 'report', name: '项目报告' },
  { id: 'proposal', name: '技术方案' },
  { id: 'template', name: '标准模板' },
  { id: 'minutes', name: '会议纪要' },
]

const docTypeConfig: Record<string, { borderClass: string; iconBg: string }> = {
  report: { borderClass: 'border-l-red-500', iconBg: 'bg-red-500' },
  proposal: { borderClass: 'border-l-blue-500', iconBg: 'bg-primary' },
  template: { borderClass: 'border-l-emerald-500', iconBg: 'bg-emerald-500' },
  minutes: { borderClass: 'border-l-purple-500', iconBg: 'bg-purple-500' },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  report: '报告',
  proposal: '方案',
  template: '模板',
  minutes: '纪要',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  review: '审核中',
  final: '已定稿',
}

export const KnowledgeBase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    documents, searchResults, isLoading, isSearching,
    fetchDocuments, search, clearSearch,
  } = useKnowledgeStore()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      search(searchQuery, activeCategory === 'all' ? undefined : activeCategory)
    } else {
      clearSearch()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const displayDocs = searchResults.length > 0
    ? searchResults.map((r) => ({
        id: r.id,
        title: r.title,
        doc_type: r.doc_type,
        author: r.author,
        status: r.status,
        content_summary: r.content_summary,
        score: r.score,
      }))
    : documents
        .filter((d) => activeCategory === 'all' || d.doc_type === activeCategory)
        .map((d) => ({ ...d, score: undefined as number | undefined }))

  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: cat.id === 'all'
      ? documents.length
      : documents.filter((d) => d.doc_type === cat.id).length,
  }))

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium font-heading text-light-text">企业智能知识库</h2>
          <span className="text-sm text-light-text-secondary mt-1 block">
            构建可进化的组织智能 · 当前检索库含 {documents.length} 份核心文档
          </span>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-colors">
          <UploadCloud size={16} /> 上传并学习
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-[10px] border border-[#E8ECF4] bg-white px-4 py-3 mb-6">
        <Search size={18} className="text-[#919AA3] flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#919AA3] text-light-text"
          placeholder="使用自然语言搜索：例如 '找一下关于专项债申请的最新模板'"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 transition-colors flex-shrink-0 disabled:opacity-50 inline-flex items-center gap-1"
        >
          {isSearching && <Loader2 size={12} className="animate-spin" />}
          智能检索
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={16} className="text-light-text-secondary" />
              <span className="text-sm font-medium">知识分类</span>
            </div>
            <div className="space-y-1">
              {categoryCounts.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); clearSearch() }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-light-text-secondary hover:bg-[#F4F6FC]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200/70 text-light-text-secondary">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-light-text-secondary" />
            <span className="text-base font-medium text-light-text">
              {searchResults.length > 0 ? `搜索结果 (${searchResults.length})` : '最近更新 / 常用文档'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-light-text-secondary">加载中...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayDocs.map((doc) => {
                const config = docTypeConfig[doc.doc_type] ?? docTypeConfig.report
                return (
                  <div
                    key={doc.id}
                    className={`bg-white border border-[#E8ECF4] rounded-[10px] p-5 transition-all cursor-pointer border-l-4 ${config.borderClass}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-9 h-9 rounded-[10px] ${config.iconBg} flex items-center justify-center`}>
                        <FileText size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium mb-1 line-clamp-2 leading-snug text-light-text">{doc.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-light-text-secondary">
                          <span className="truncate">{doc.author}</span>
                          <span>·</span>
                          <span className="flex-shrink-0">{DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</span>
                        </div>
                      </div>
                    </div>
                    {doc.content_summary && (
                      <p className="text-xs text-light-text-secondary mb-2 line-clamp-2">{doc.content_summary}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-light-text-secondary">
                        <BookMarked size={13} />
                        <span>{STATUS_LABELS[doc.status] ?? doc.status}</span>
                      </div>
                      {doc.score !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <ThumbsUp size={13} />
                          <span>匹配 {doc.score.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {displayDocs.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#919AA3] text-sm">
                  暂无文档
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
