/**
 * ProjectDocuments — 项目资料管理（含右侧预览面板）
 */
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  FileText,
  Search,
  Plus,
  UploadCloud,
  Loader2,
  FolderOpen,
  Download,
  Trash2,
  X,
  Check,
  Eye,
  ChevronLeft,
} from 'lucide-react';
import { EmptyState } from '../atomic';
import type { DocumentItem } from '../../types';

const EPC_CATEGORIES = [
  { key: 'all', label: '全部资料', icon: '📁', color: '#676879' },
  { key: 'design', label: '设计资料', icon: '📐', color: '#579BFC' },
  { key: 'construction', label: '施工资料', icon: '🏗️', color: '#FDAB3D' },
  { key: 'quality', label: '质量资料', icon: '🔍', color: '#00C875' },
  { key: 'safety', label: '安全资料', icon: '🦺', color: '#E2445C' },
  { key: 'completion', label: '竣工资料', icon: '🏁', color: '#9B51E0' },
  { key: 'contract', label: '合同资料', icon: '📝', color: '#0086C0' },
  { key: 'change', label: '变更签证', icon: '🔄', color: '#FF7A59' },
  { key: 'general', label: '通用资料', icon: '📄', color: '#37B4E3' },
];
const SIMPLE_CATEGORIES = [
  { key: 'all', label: '全部', icon: '📁', color: '#676879' },
  { key: 'design', label: '方案设计', icon: '📐', color: '#579BFC' },
  { key: 'quality', label: '测试/质量', icon: '🔍', color: '#00C875' },
  { key: 'contract', label: '合同', icon: '📝', color: '#0086C0' },
  { key: 'general', label: '其他', icon: '📄', color: '#37B4E3' },
];

const STATUS_LABELS: Record<string, string> = { draft: '草稿', review: '审核中', final: '已定稿' };
const STATUS_COLORS: Record<string, string> = {
  draft: '#676879',
  review: '#FDAB3D',
  final: '#00C875',
};
const DOC_TYPE_ICONS: Record<string, string> = {
  report: '📊',
  proposal: '📋',
  template: '📄',
  minutes: '📝',
};
const DOC_TYPE_LABELS: Record<string, string> = {
  report: '报告',
  proposal: '方案',
  template: '模板',
  minutes: '纪要',
};

export interface ProjectDocumentsProps {
  projectId: string;
  projectType: string;
}

const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({ projectId, projectType }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'general',
    doc_type: 'report',
    content_summary: '',
  });
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEPC = useMemo(() => {
    const l = projectType.toLowerCase();
    return (
      l.includes('epc') ||
      l.includes('展馆') ||
      l.includes('公建') ||
      l.includes('工程') ||
      l.includes('市政')
    );
  }, [projectType]);
  const categories = isEPC ? EPC_CATEGORIES : SIMPLE_CATEGORIES;

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?project_id=${projectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDocuments(await res.json());
    } catch {
      /* */
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const filtered = useMemo(() => {
    let r = documents;
    if (activeCategory !== 'all') r = r.filter((d) => d.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.author.toLowerCase().includes(q) ||
          d.content_summary.toLowerCase().includes(q)
      );
    }
    return r;
  }, [documents, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length };
    for (const d of documents) c[d.category] = (c[d.category] || 0) + 1;
    return c;
  }, [documents]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('project_id', projectId);
      fd.append('category', activeCategory === 'all' ? 'general' : activeCategory);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (res.ok) await fetchDocs();
    } finally {
      setUploading(false);
    }
  };
  const handleCreate = async () => {
    if (!newDoc.title.trim()) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDoc.title,
          doc_type: newDoc.doc_type,
          project_id: projectId,
          category: newDoc.category,
          content_summary: newDoc.content_summary,
          author: '当前用户',
        }),
      });
      if (res.ok) {
        await fetchDocs();
        setNewDoc({ title: '', category: 'general', doc_type: 'report', content_summary: '' });
        setShowCreateForm(false);
      }
    } catch {
      /* */
    }
  };
  const handleDelete = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((p) => p.filter((d) => d.id !== docId));
        if (previewDoc?.id === docId) setPreviewDoc(null);
      }
    } catch {
      /* */
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{documents.length} 份资料</span>
          {isEPC && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
              EPC资料体系
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}{' '}
            上传
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={13} /> 新建
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="p-3 rounded-lg border border-blue-500/30 bg-gray-50 space-y-2">
          <input
            type="text"
            placeholder="文档标题"
            value={newDoc.title}
            onChange={(e) => setNewDoc((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={newDoc.category}
              onChange={(e) => setNewDoc((p) => ({ ...p, category: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-800"
            >
              {categories
                .filter((c) => c.key !== 'all')
                .map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.icon} {c.label}
                  </option>
                ))}
            </select>
            <select
              value={newDoc.doc_type}
              onChange={(e) => setNewDoc((p) => ({ ...p, doc_type: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-800"
            >
              <option value="report">报告</option>
              <option value="proposal">方案</option>
              <option value="template">模板</option>
              <option value="minutes">纪要</option>
            </select>
            <input
              type="text"
              placeholder="摘要（可选）"
              value={newDoc.content_summary}
              onChange={(e) => setNewDoc((p) => ({ ...p, content_summary: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!newDoc.title.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              <Check size={12} /> 创建
            </button>
          </div>
        </div>
      )}

      {/* Main 3-column layout: sidebar | list | preview */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: previewDoc ? '180px 1fr 320px' : '180px 1fr' }}
      >
        {/* Category sidebar */}
        <aside>
          <div className="bg-white border border-gray-200 rounded-xl p-3 sticky top-0">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <FolderOpen size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">分类</span>
            </div>
            <div className="space-y-0.5">
              {categories.map((cat) => {
                const count = categoryCounts[cat.key] ?? 0;
                if (cat.key !== 'all' && count === 0 && !isEPC) return null;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    type="button"
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${activeCategory === cat.key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-xs">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span
                      className={`text-[10px] px-1 py-0.5 rounded-full ${activeCategory === cat.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {isEPC && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1 px-1">
                  完整度
                </div>
                {EPC_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => {
                  const count = categoryCounts[cat.key] ?? 0;
                  return (
                    <div
                      key={cat.key}
                      className="flex items-center gap-1.5 px-1 py-0.5 text-[10px]"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span className={count > 0 ? 'text-gray-600' : 'text-gray-400'}>
                        {cat.label}
                      </span>
                      <span className="ml-auto text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Document list */}
        <main className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">加载中...</span>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon="file-text"
              title={
                activeCategory === 'all'
                  ? '暂无项目资料'
                  : `暂无${categories.find((c) => c.key === activeCategory)?.label ?? ''}资料`
              }
              description="点击上方「新建」或「上传」添加项目资料"
            />
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {filtered.map((doc) => {
                const catConfig = categories.find((c) => c.key === doc.category) ?? categories[0];
                const statusLabel = STATUS_LABELS[doc.status] ?? doc.status;
                const statusColor = STATUS_COLORS[doc.status] ?? '#676879';
                const isSelected = previewDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setPreviewDoc(doc)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${isSelected ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
                  >
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: catConfig.color }}
                    />
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                      style={{ backgroundColor: `${catConfig.color}12` }}
                    >
                      {DOC_TYPE_ICONS[doc.doc_type] ?? '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.title}</div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        <span>{doc.author}</span>
                        <span>v{doc.version}</span>
                        <span
                          className="px-1 py-0.5 rounded-full font-medium"
                          style={{ color: statusColor, backgroundColor: `${statusColor}12` }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                        title="预览"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                        title="删除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Preview panel */}
        {previewDoc && (
          <aside className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-0 self-start">
            {/* Preview header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-sm font-semibold text-gray-800 truncate">文档预览</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded hover:bg-gray-200 text-gray-400"
              >
                <X size={14} />
              </button>
            </div>
            {/* Preview content */}
            <div className="p-4 space-y-4">
              {/* File icon + type */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: `${(categories.find((c) => c.key === previewDoc.category) ?? categories[0]).color}12`,
                  }}
                >
                  {DOC_TYPE_ICONS[previewDoc.doc_type] ?? '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 leading-snug">
                    {previewDoc.title}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {DOC_TYPE_LABELS[previewDoc.doc_type] ?? previewDoc.doc_type} · v
                    {previewDoc.version}
                  </div>
                </div>
              </div>

              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 block mb-0.5">作者</span>
                  <span className="text-gray-700 font-medium">{previewDoc.author}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 block mb-0.5">状态</span>
                  <span
                    className="font-medium"
                    style={{ color: STATUS_COLORS[previewDoc.status] ?? '#676879' }}
                  >
                    {STATUS_LABELS[previewDoc.status] ?? previewDoc.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 block mb-0.5">分类</span>
                  <span className="text-gray-700 font-medium">
                    {(categories.find((c) => c.key === previewDoc.category) ?? categories[0]).label}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 block mb-0.5">版本</span>
                  <span className="text-gray-700 font-medium">{previewDoc.version}</span>
                </div>
              </div>

              {/* Summary */}
              {previewDoc.content_summary && (
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
                    内容摘要
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                    {previewDoc.content_summary}
                  </p>
                </div>
              )}

              {/* Mock preview area */}
              <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-gray-50/50">
                <FileText size={32} className="text-gray-300" />
                <span className="text-xs text-gray-400">文档预览区域</span>
                <span className="text-[10px] text-gray-300">（接入文件存储后可在线预览）</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
                  <Download size={13} /> 下载文件
                </button>
                <button
                  onClick={() => handleDelete(previewDoc.id)}
                  className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default ProjectDocuments;
