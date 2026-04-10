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
} from 'lucide-react';
import { EmptyState } from '../atomic';
import { DocumentPreview } from '../../components/documents';
import { documentService } from '../../services/api';
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

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [uploadProgress, setUploadProgress] = useState(0);
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
      const docs = await documentService.list({ project_id: projectId });
      setDocuments(docs);
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
    setUploadProgress(0);
    try {
      await documentService.upload(
        file,
        {
          project_id: projectId,
          category: activeCategory === 'all' ? 'general' : activeCategory,
        },
        (pct) => setUploadProgress(pct)
      );
      await fetchDocs();
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  const handleCreate = async () => {
    if (!newDoc.title.trim()) return;
    try {
      await documentService.create({
        title: newDoc.title,
        doc_type: newDoc.doc_type,
        project_id: projectId,
        content_summary: newDoc.content_summary,
        author: '当前用户',
      });
      await fetchDocs();
      setNewDoc({ title: '', category: 'general', doc_type: 'report', content_summary: '' });
      setShowCreateForm(false);
    } catch {
      /* */
    }
  };
  const handleDelete = async (docId: string) => {
    try {
      await documentService.delete(docId);
      setDocuments((p) => p.filter((d) => d.id !== docId));
      if (previewDoc?.id === docId) setPreviewDoc(null);
    } catch {
      /* */
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-light-text-secondary">
            {documents.length} 份资料
          </span>
          {isEPC && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              EPC资料体系
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-medium text-light-text-secondary border border-[#E8ECF4] hover:bg-[#F4F6FC] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}{' '}
            上传
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
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

      {/* Upload progress bar */}
      {uploading && (
        <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-light-text-secondary">上传中...</span>
            <span className="text-xs font-medium text-primary">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 bg-[#F4F6FC] rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="p-3 rounded-[10px] border border-primary/30 bg-[#EFF3F9] space-y-2">
          <input
            type="text"
            placeholder="文档标题"
            value={newDoc.title}
            onChange={(e) => setNewDoc((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-[#E8ECF4] rounded-[10px] bg-white text-light-text focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <select
              value={newDoc.category}
              onChange={(e) => setNewDoc((p) => ({ ...p, category: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-[#E8ECF4] rounded-[10px] bg-white text-light-text"
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
              className="px-2 py-1.5 text-sm border border-[#E8ECF4] rounded-[10px] bg-white text-light-text"
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
              className="flex-1 px-3 py-1.5 text-sm border border-[#E8ECF4] rounded-[10px] bg-white text-light-text focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 text-sm text-light-text-secondary border border-[#E8ECF4] rounded-[10px] hover:bg-[#F4F6FC]"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!newDoc.title.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white bg-primary rounded-[10px] hover:bg-primary/90 disabled:opacity-50"
            >
              <Check size={12} /> 创建
            </button>
          </div>
        </div>
      )}

      {/* Main 3-column layout: sidebar | list | preview */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: previewDoc ? '180px 1fr 400px' : '180px 1fr' }}
      >
        {/* Category sidebar */}
        <aside>
          <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-3 sticky top-0">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <FolderOpen size={14} className="text-[#919AA3]" />
              <span className="text-xs font-semibold text-light-text-secondary">分类</span>
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
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${activeCategory === cat.key ? 'bg-primary/8 text-primary font-medium' : 'text-light-text-secondary hover:bg-[#F4F6FC]'}`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-xs">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span
                      className={`text-[10px] px-1 py-0.5 rounded-full ${activeCategory === cat.key ? 'bg-primary/10 text-primary' : 'bg-[#F4F6FC] text-[#919AA3]'}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {isEPC && (
              <div className="mt-3 pt-3 border-t border-[#E8ECF4]">
                <div className="text-[10px] font-semibold text-[#919AA3] uppercase mb-1 px-1">
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
                        className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-primary' : 'bg-[#E8ECF4]'}`}
                      />
                      <span className={count > 0 ? 'text-light-text-secondary' : 'text-[#919AA3]'}>
                        {cat.label}
                      </span>
                      <span className="ml-auto text-[#919AA3]">{count}</span>
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
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <Search size={14} className="text-[#919AA3]" />
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-light-text focus:outline-none placeholder:text-[#919AA3]"
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="ml-2 text-sm text-light-text-secondary">加载中...</span>
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
                    className={`flex items-center gap-3 p-3 rounded-[10px] border cursor-pointer transition-all group ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-[#E8ECF4] bg-white hover:border-primary/30 hover:shadow-sm'}`}
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
                      <div className="text-sm font-medium text-light-text truncate">
                        {doc.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#919AA3] mt-0.5">
                        <span>{doc.author}</span>
                        <span>v{doc.version}</span>
                        <span
                          className="px-1 py-0.5 rounded-full font-medium"
                          style={{ color: statusColor, backgroundColor: `${statusColor}12` }}
                        >
                          {statusLabel}
                        </span>
                        {doc.file_name && (
                          <span className="text-[10px] text-[#919AA3]">
                            {formatFileSize(doc.file_size)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                        className="p-1 rounded hover:bg-[#F4F6FC] text-[#919AA3] hover:text-primary"
                        title="预览"
                      >
                        <Eye size={13} />
                      </button>
                      {doc.file_url && (
                        <a
                          href={documentService.getDownloadUrl(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-[#F4F6FC] text-[#919AA3] hover:text-primary"
                          title="下载"
                        >
                          <Download size={13} />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="p-1 rounded hover:bg-[#F4F6FC] text-[#919AA3] hover:text-red-500"
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
          <aside className="sticky top-0 self-start" style={{ height: 'calc(100vh - 200px)' }}>
            <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />
          </aside>
        )}
      </div>
    </div>
  );
};

export default ProjectDocuments;
