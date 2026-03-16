import React, { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Calendar, User, X } from 'lucide-react';
import { projectService } from '../../services/api';
import type { ProcessRecord } from '../../types';
import {
  PROCESS_RECORD_TYPE_LABELS,
  PROCESS_RECORD_TYPE_ICONS,
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_COLORS,
} from '../../utils/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcessTabProps {
  projectId: string;
}

type RecordTypeFilter = 'all' | string;

interface NewRecordForm {
  record_type: string;
  title: string;
  date: string;
  author: string;
  content: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RECORD_TYPE_ACCENT_COLORS: Record<string, string> = {
  daily_log:     '#579BFC',
  quality_check: '#00C875',
  inspection:    '#FDAB3D',
  material_entry:'#9B51E0',
  hidden_work:   '#E2445C',
  safety_check:  '#FF7A59',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const FILTER_TABS: Array<{ key: RecordTypeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  ...Object.entries(PROCESS_RECORD_TYPE_LABELS).map(([key, label]) => ({ key, label })),
];

const DEFAULT_FORM: NewRecordForm = {
  record_type: 'daily_log',
  title: '',
  date: new Date().toISOString().split('T')[0],
  author: '',
  content: '',
  status: 'normal',
};

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

interface StatusPillProps {
  status: string;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const color = PROCESS_STATUS_COLORS[status] ?? '#676879';
  const label = PROCESS_STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Record Card (timeline item)
// ---------------------------------------------------------------------------

interface RecordCardProps {
  record: ProcessRecord;
}

const RecordCard: React.FC<RecordCardProps> = ({ record }) => {
  const [expanded, setExpanded] = useState(false);
  const accentColor = RECORD_TYPE_ACCENT_COLORS[record.record_type] ?? '#676879';
  const icon = PROCESS_RECORD_TYPE_ICONS[record.record_type] ?? '📄';
  const typeLabel = PROCESS_RECORD_TYPE_LABELS[record.record_type] ?? record.record_type;

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-white"
          style={{ backgroundColor: accentColor }}
        />
        <div className="w-px flex-1 mt-1" style={{ backgroundColor: `${accentColor}40` }} />
      </div>

      {/* Card */}
      <div
        className="flex-1 mb-4 bg-white border border-[#d0d4e4] rounded-xl overflow-hidden"
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      >
        {/* Card header - always visible */}
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="w-full text-left p-4 hover:bg-[#f6f7fb] transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left: icon + title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                  {typeLabel}
                </span>
                <h4 className="text-sm font-semibold text-[#323338] truncate">{record.title}</h4>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#676879]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(record.date)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {record.author}
                </span>
              </div>
            </div>

            {/* Right: status + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusPill status={record.status} />
              {expanded
                ? <ChevronDown className="w-4 h-4 text-[#676879]" />
                : <ChevronRight className="w-4 h-4 text-[#676879]" />}
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4">
            <div className="bg-[#f6f7fb] rounded-lg p-3 mt-2">
              <p className="text-sm text-[#323338] whitespace-pre-wrap leading-relaxed">
                {record.content || '暂无内容'}
              </p>
              {record.related_stage && (
                <p className="text-xs text-[#676879] mt-2">
                  关联阶段：{record.related_stage}
                </p>
              )}
              {record.attachments && record.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {record.attachments.map((att, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white border border-[#d0d4e4] rounded px-2 py-0.5 text-[#676879]"
                    >
                      {att}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// New Record Modal
// ---------------------------------------------------------------------------

interface NewRecordModalProps {
  onClose: () => void;
  onSubmit: (data: NewRecordForm) => Promise<void>;
  submitting: boolean;
}

const NewRecordModal: React.FC<NewRecordModalProps> = ({ onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState<NewRecordForm>(DEFAULT_FORM);

  const handleChange = (field: keyof NewRecordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d4e4]">
          <h3 className="text-base font-semibold text-[#323338]">新增过程记录</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f6f7fb] transition-colors"
          >
            <X className="w-4 h-4 text-[#676879]" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Record type */}
          <div>
            <label className="block text-xs font-medium text-[#676879] mb-1.5">记录类型</label>
            <select
              value={form.record_type}
              onChange={e => handleChange('record_type', e.target.value)}
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] bg-white focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea]"
            >
              {Object.entries(PROCESS_RECORD_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {PROCESS_RECORD_TYPE_ICONS[key]} {label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#676879] mb-1.5">标题 *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="请输入记录标题"
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea]"
            />
          </div>

          {/* Date + Author row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#676879] mb-1.5">日期</label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#676879] mb-1.5">记录人 *</label>
              <input
                type="text"
                required
                value={form.author}
                onChange={e => handleChange('author', e.target.value)}
                placeholder="姓名"
                className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea]"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-[#676879] mb-1.5">内容详情</label>
            <textarea
              rows={4}
              value={form.content}
              onChange={e => handleChange('content', e.target.value)}
              placeholder="请输入记录详情..."
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] resize-none focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-[#676879] mb-1.5">状态</label>
            <div className="flex gap-2">
              {Object.entries(PROCESS_STATUS_LABELS).map(([key, label]) => {
                const color = PROCESS_STATUS_COLORS[key];
                const isActive = form.status === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChange('status', key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      borderColor: isActive ? color : '#d0d4e4',
                      backgroundColor: isActive ? `${color}18` : 'transparent',
                      color: isActive ? color : '#676879',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#676879] bg-[#f6f7fb] rounded-lg hover:bg-[#e6e9ef] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0073ea] rounded-lg hover:bg-[#0060c0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ProcessTab
// ---------------------------------------------------------------------------

const ProcessTab: React.FC<ProcessTabProps> = ({ projectId }) => {
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RecordTypeFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load records
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    projectService.getProcessRecords(projectId)
      .then(data => {
        if (!cancelled) {
          setRecords(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('加载过程记录失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  // Filter + sort
  const filteredRecords = records
    .filter(r => activeFilter === 'all' || r.record_type === activeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateRecord = async (form: NewRecordForm) => {
    setSubmitting(true);
    try {
      const created = await projectService.createProcessRecord(projectId, {
        record_type: form.record_type,
        title: form.title,
        date: form.date,
        author: form.author,
        content: form.content,
        status: form.status,
      });
      setRecords(prev => [created, ...prev]);
      setShowModal(false);
    } catch {
      // Keep modal open so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0073ea] text-white shadow-sm'
                    : 'bg-[#f6f7fb] text-[#676879] hover:bg-[#e6e9ef]'
                }`}
              >
                {tab.key !== 'all' && (
                  <span className="mr-1">{PROCESS_RECORD_TYPE_ICONS[tab.key]}</span>
                )}
                {tab.label}
                {tab.key !== 'all' && (
                  <span className={`ml-1.5 text-[10px] ${isActive ? 'text-white/70' : 'text-[#9699a6]'}`}>
                    {records.filter(r => r.record_type === tab.key).length}
                  </span>
                )}
                {tab.key === 'all' && (
                  <span className={`ml-1.5 text-[10px] ${isActive ? 'text-white/70' : 'text-[#9699a6]'}`}>
                    {records.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* New record button */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0073ea] rounded-lg hover:bg-[#0060c0] transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          新增记录
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0073ea] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[#676879]">加载中...</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-[#E2445C] text-sm font-medium mb-2">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  projectService.getProcessRecords(projectId)
                    .then(data => setRecords(data))
                    .catch(() => setError('加载过程记录失败，请稍后重试'))
                    .finally(() => setLoading(false));
                }}
                className="text-xs text-[#0073ea] underline hover:no-underline"
              >
                点击重试
              </button>
            </div>
          </div>
        )}

        {!loading && !error && filteredRecords.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm font-medium text-[#323338] mb-1">
              {activeFilter === 'all' ? '暂无过程记录' : `暂无${PROCESS_RECORD_TYPE_LABELS[activeFilter] ?? ''}记录`}
            </p>
            <p className="text-xs text-[#676879]">点击右上角"新增记录"开始添加</p>
          </div>
        )}

        {!loading && !error && filteredRecords.length > 0 && (
          <div className="pr-2">
            {filteredRecords.map(record => (
              <RecordCard key={record.id} record={record} />
            ))}
            {/* Timeline end cap */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#d0d4e4] flex-shrink-0" />
              </div>
              <div className="pb-4">
                <span className="text-xs text-[#9699a6]">共 {filteredRecords.length} 条记录</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewRecordModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateRecord}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default ProcessTab;
