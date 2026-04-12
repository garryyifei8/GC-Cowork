import React, { useMemo, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FilePen,
  Search,
  ChevronDown,
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { DocumentItem } from '../../types';

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

export interface FileViewProps {
  data?: { documents?: DocumentItem[] };
}

type SortKey = 'title' | 'author' | 'version';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOC_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    Icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
  }
> = {
  report: {
    label: '报告',
    color: '#E2445C',
    bgColor: '#fef2f2',
    Icon: FileText,
  },
  proposal: {
    label: '方案',
    color: '#579BFC',
    bgColor: '#eff6ff',
    Icon: FilePen,
  },
  template: {
    label: '模板',
    color: '#00C875',
    bgColor: '#f0fdf4',
    Icon: FileSpreadsheet,
  },
  minutes: {
    label: '纪要',
    color: '#9B51E0',
    bgColor: '#faf5ff',
    Icon: FileArchive,
  },
};

const DEFAULT_TYPE_CONFIG = {
  label: '文档',
  color: '#676879',
  bgColor: '#f9fafb',
  Icon: FileText,
};

const DOC_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: 'report', label: '报告' },
  { value: 'proposal', label: '方案' },
  { value: 'template', label: '模板' },
  { value: 'minutes', label: '纪要' },
];

const DOC_STATUS_COLORS: Record<string, string> = {
  draft: '#FDAB3D',
  review: '#9B51E0',
  approved: '#00C875',
  archived: '#676879',
  published: '#579BFC',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  review: '审核中',
  approved: '已审批',
  archived: '归档',
  published: '已发布',
};

// ---------------------------------------------------------------------------
// Sort icon helper
// ---------------------------------------------------------------------------

const SortIcon: React.FC<{ field: SortKey; sortKey: SortKey; sortDir: SortDir }> = ({
  field,
  sortKey,
  sortDir,
}) => {
  if (field !== sortKey) return <ArrowUpDown size={13} className="text-gray-400 opacity-60" />;
  return sortDir === 'asc' ? (
    <ArrowUp size={13} className="text-blue-500" />
  ) : (
    <ArrowDown size={13} className="text-blue-500" />
  );
};

// ---------------------------------------------------------------------------
// File card
// ---------------------------------------------------------------------------

const FileCard: React.FC<{ doc: DocumentItem }> = ({ doc }) => {
  const cfg = DOC_TYPE_CONFIG[doc.doc_type] ?? DEFAULT_TYPE_CONFIG;
  const { Icon } = cfg;
  const statusColor = DOC_STATUS_COLORS[doc.status] ?? '#676879';
  const statusLabel = DOC_STATUS_LABELS[doc.status] ?? doc.status;

  return (
    <div className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3">
      {/* File type icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cfg.bgColor }}
      >
        <Icon size={24} style={{ color: cfg.color }} />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {doc.title}
        </h3>
        {doc.content_summary && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {doc.content_summary}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Author avatar */}
          <img
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(doc.author)}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`}
            alt={doc.author}
            className="w-5 h-5 rounded-full shrink-0"
            loading="lazy"
          />
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {doc.author}
          </span>
        </div>
        {/* Version */}
        <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 font-mono">
          v{doc.version}
        </span>
      </div>

      {/* Footer: type badge + status badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
        >
          {cfg.label}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
          style={{ backgroundColor: statusColor }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sort button
// ---------------------------------------------------------------------------

const SortButton: React.FC<{
  label: string;
  field: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (f: SortKey) => void;
}> = ({ label, field, sortKey, sortDir, onSort }) => (
  <button
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
      sortKey === field
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
    onClick={() => onSort(field)}
  >
    <SortIcon field={field} sortKey={sortKey} sortDir={sortDir} />
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const FileView: React.FC<FileViewProps> = ({ data }) => {
  const documents: DocumentItem[] = data?.documents ?? [];

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const handleSort = (field: SortKey) => {
    if (sortKey === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = documents;

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter((d) => d.doc_type === typeFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.author.toLowerCase().includes(q) ||
          d.content_summary?.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === 'title') {
        va = a.title;
        vb = b.title;
      } else if (sortKey === 'author') {
        va = a.author;
        vb = b.author;
      } else if (sortKey === 'version') {
        va = a.version;
        vb = b.version;
      }
      const cmp = va.localeCompare(vb, 'zh-CN');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [documents, search, typeFilter, sortKey, sortDir]);

  // Doc type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    for (const d of documents) {
      counts[d.doc_type] = (counts[d.doc_type] ?? 0) + 1;
    }
    return counts;
  }, [documents]);

  const currentTypeLabel =
    DOC_TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? '全部类型';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">文件库</h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
              {filtered.length} / {documents.length} 个文件
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[180px] flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
            <Search size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              type="text"
              className="flex-1 bg-transparent text-[13px] text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="搜索文件标题或作者..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[13px] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-[120px]"
              onClick={() => setTypeDropdownOpen((v) => !v)}
            >
              <span className="flex-1 text-left">{currentTypeLabel}</span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {typeDropdownOpen && (
              <div className="absolute z-30 top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 min-w-[140px]">
                {DOC_TYPE_OPTIONS.map((opt) => {
                  const cfg = DOC_TYPE_CONFIG[opt.value];
                  const count = typeCounts[opt.value] ?? 0;
                  return (
                    <button
                      key={opt.value}
                      className={`flex items-center justify-between w-full px-3 py-2 text-[12px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        typeFilter === opt.value
                          ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => {
                        setTypeFilter(opt.value);
                        setTypeDropdownOpen(false);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {cfg && (
                          <span
                            className="w-2 h-2 rounded-sm shrink-0"
                            style={{ backgroundColor: cfg.color }}
                          />
                        )}
                        {opt.label}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 ml-2">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-1">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 px-1.5">排序:</span>
            <SortButton
              label="标题"
              field="title"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortButton
              label="作者"
              field="author"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortButton
              label="版本"
              field="version"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </div>
        </div>

        {/* Type tab chips */}
        {typeFilter !== 'all' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">筛选:</span>
            <button
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              onClick={() => setTypeFilter('all')}
            >
              {currentTypeLabel}
              <span className="text-blue-400 dark:text-blue-500">×</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {documents.length === 0 ? (
          /* Empty state: no documents at all */
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400 dark:text-gray-500">
            <FolderOpen size={40} className="opacity-40" />
            <div className="text-center">
              <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">暂无文件</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">
                上传文件或同步文档后将在此显示
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state: no results matching filter */
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400 dark:text-gray-500">
            <Search size={36} className="opacity-40" />
            <div className="text-center">
              <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">无匹配结果</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">
                请尝试其他搜索词或筛选条件
              </p>
            </div>
            <button
              className="text-[12px] text-blue-500 hover:underline"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
              }}
            >
              清除所有筛选
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filtered.map((doc) => (
              <FileCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileView;
