import React, { useState } from 'react'
import {
  Search,
  FileText,
  BookMarked,
  FolderOpen,
  UploadCloud,
  Clock,
  ThumbsUp,
} from 'lucide-react'

const categories = [
  { id: 'all', name: '全部分类', count: 128 },
  { id: 'project', name: '项目经验库', count: 45 },
  { id: 'policy', name: '政策与制度', count: 32 },
  { id: 'template', name: '标准模板', count: 28 },
  { id: 'tech', name: '技术文档', count: 23 },
]

const RECENT_DOCS = [
  { id: 1, title: '智慧园区EPC项目全流程复盘记录_V1.2', author: '王项目', date: '2小时前', type: 'pdf', likes: 12 },
  { id: 2, title: '【国家发改委】2026年专项债申报指南', author: '知识库助手 (AI抓取)', date: '昨天 14:30', type: 'doc', likes: 45 },
  { id: 3, title: '信息化集成平台公共组件API文档_v2.0', author: '李开发', date: '昨天 09:15', type: 'code', likes: 38 },
  { id: 4, title: '博物馆展陈设计标准合同模板(2026版)', author: '赵法务', date: '3天前', type: 'doc', likes: 56 },
]

const docTypeConfig: Record<string, { borderClass: string; iconBg: string }> = {
  pdf: { borderClass: 'border-l-red-500', iconBg: 'bg-red-500' },
  doc: { borderClass: 'border-l-blue-500', iconBg: 'bg-blue-500' },
  code: { borderClass: 'border-l-emerald-500', iconBg: 'bg-emerald-500' },
}

export const KnowledgeBase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">企业智能知识库</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">
            构建可进化的组织智能 · 当前检索库含 128 份核心文档
          </span>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-colors">
          <UploadCloud size={16} /> 上传并学习
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 mb-6">
        <Search size={18} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
          placeholder="使用自然语言搜索：例如 '找一下关于专项债申请的最新模板'"
        />
        <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 transition-colors flex-shrink-0">
          智能检索
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-semibold">知识分类</span>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400">
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
            <Clock size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">最近更新 / 常用文档</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {RECENT_DOCS.filter((doc) => {
              if (searchQuery) {
                return doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  doc.author.toLowerCase().includes(searchQuery.toLowerCase())
              }
              return true
            }).map((doc) => {
              const config = docTypeConfig[doc.type] ?? docTypeConfig.doc
              return (
                <div
                  key={doc.id}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-all hover:shadow-md cursor-pointer border-l-4 ${config.borderClass}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold mb-1 line-clamp-2 leading-snug text-gray-900 dark:text-gray-100">{doc.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">{doc.author}</span>
                        <span>·</span>
                        <span className="flex-shrink-0">{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <BookMarked size={13} />
                      <span>知识库 V2</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <ThumbsUp size={13} />
                      <span>{doc.likes} 人点赞</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
