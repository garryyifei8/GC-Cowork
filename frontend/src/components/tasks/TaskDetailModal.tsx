import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Trash2,
  User,
  Calendar,
  Folder,
  AlignLeft,
  Clock,
  FileText,
  Activity,
  AlertTriangle,
  Send,
} from 'lucide-react';
import type { TaskWithProject } from '../../types';
import { taskService, type TaskComment } from '../../services/api';
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../../utils/constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const ALL_PRIORITIES = ['low', 'medium', 'high'];

// ---------------------------------------------------------------------------
// Status selector (Monday.com full-width colored pill)
// ---------------------------------------------------------------------------

const StatusSelector: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = TASK_STATUS_COLORS[value] ?? '#C4C4C4';
  const label = TASK_STATUS_LABELS[value] ?? value;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="w-full rounded-[3px] py-2 text-sm font-medium text-center cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-light-surface border border-light-border rounded-[10px] shadow-xl py-1 overflow-hidden">
          {ALL_STATUSES.map((s) => {
            const c = TASK_STATUS_COLORS[s] ?? '#C4C4C4';
            const l = TASK_STATUS_LABELS[s] ?? s;
            return (
              <button
                key={s}
                className="w-full py-1.5 text-xs font-medium text-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30` }}
                onClick={() => { onChange(s); setOpen(false); }}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Priority selector (Monday.com full-width colored pill)
// ---------------------------------------------------------------------------

const PrioritySelector: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = PRIORITY_COLORS[value] ?? '#C4C4C4';
  const label = PRIORITY_LABELS[value] ?? value;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="w-full rounded-[3px] py-2 text-sm font-medium text-center cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-light-surface border border-light-border rounded-[10px] shadow-xl py-1 overflow-hidden">
          {ALL_PRIORITIES.map((p) => {
            const c = PRIORITY_COLORS[p] ?? '#C4C4C4';
            const l = PRIORITY_LABELS[p] ?? p;
            return (
              <button
                key={p}
                className="w-full py-1.5 text-xs font-medium text-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30` }}
                onClick={() => { onChange(p); setOpen(false); }}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Attribute row (Monday.com style: icon + label | value)
// ---------------------------------------------------------------------------

const AttrRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-light-border/40 last:border-b-0">
    <div className="flex items-center gap-2 w-28 flex-shrink-0 text-xs font-medium text-light-text-secondary">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TaskDetailModalProps {
  task: TaskWithProject | null;
  onClose: () => void;
  onUpdate: (taskId: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [activeTab, setActiveTab] = useState<'updates' | 'files' | 'activity'>('updates');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Sync form state when task changes
  useEffect(() => {
    if (task) {
      setName(task.name);
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee ?? '');
      setDueDate(task.due_date ?? '');
      setDescription(task.description ?? '');
      setConfirmDelete(false);
      setDirty(false);
      setUpdateText('');
      setComments([]);
      // Fetch comments
      taskService.listComments(task.id).then(setComments).catch(() => {});
    }
  }, [task]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  if (!task) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = !!dueDate && dueDate < today && status !== 'done';

  // Auto-save on field change
  const handleFieldChange = async (field: string, value: string | null) => {
    setDirty(true);
    try {
      await onUpdate(task.id, { [field]: value });
    } catch {
      // store handles error display
    }
  };

  const handleStatusChange = (s: string) => {
    setStatus(s);
    handleFieldChange('status', s);
  };

  const handlePriorityChange = (p: string) => {
    setPriority(p);
    handleFieldChange('priority', p);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        name: name.trim(),
        status,
        priority,
        assignee: assignee.trim() || null,
        due_date: dueDate || null,
        description: description.trim(),
      });
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendComment = async () => {
    if (!updateText.trim() || !task) return;
    setIsSendingComment(true);
    try {
      const created = await taskService.createComment(task.id, updateText.trim());
      setComments((prev) => [...prev, created]);
      setUpdateText('');
    } catch {
      // Error handled silently
    } finally {
      setIsSendingComment(false);
    }
  };

  // Assignee avatar
  const avatarSeed = encodeURIComponent(assignee || 'unassigned');
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${avatarSeed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`;

  const inlineInputClass =
    'w-full bg-transparent text-sm text-light-text outline-none placeholder:text-light-text-secondary hover:bg-[#f6f7fb] rounded px-2 py-1 -mx-2 transition-colors focus:bg-[#f6f7fb] focus:ring-1 focus:ring-primary/30';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal (centered, wider — Monday.com style) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="任务详情"
        className="fixed inset-4 sm:inset-8 md:inset-y-12 md:inset-x-16 lg:inset-y-12 lg:inset-x-24 z-50 flex bg-light-surface rounded-[10px] shadow-2xl border border-light-border overflow-hidden animate-fade-in"
      >
        {/* ============ Left: Attributes panel ============ */}
        <div className="w-[340px] lg:w-[380px] flex-shrink-0 flex flex-col border-r border-light-border overflow-y-auto">
          {/* Task name (large editable title) */}
          <div className="px-5 pt-5 pb-2">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setDirty(true); }}
              onBlur={() => { if (name.trim() !== task.name) handleFieldChange('name', name.trim()); }}
              className="w-full text-xl font-bold text-light-text bg-transparent outline-none placeholder:text-light-text-secondary"
              placeholder="任务名称"
            />
            <p className="text-xs text-light-text-secondary mt-1">
              in → <span className="text-primary font-medium">{task.project_name}</span>
            </p>
          </div>

          {/* Attributes list */}
          <div className="flex-1 px-5 pb-4">
            {/* Project */}
            <AttrRow icon={<Folder size={14} />} label="所属项目">
              <span className="text-sm text-light-text">{task.project_name}</span>
            </AttrRow>

            {/* Name */}
            <AttrRow icon={<FileText size={14} />} label="名称">
              <span className="text-sm text-light-text">{name || '—'}</span>
            </AttrRow>

            {/* Owner */}
            <AttrRow icon={<User size={14} />} label="负责人">
              <div className="flex items-center gap-2">
                {assignee ? (
                  <img src={avatarUrl} alt={assignee} className="w-6 h-6 rounded-full bg-[#ecedf5]" loading="lazy" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#d0d4e4] flex items-center justify-center">
                    <User size={12} className="text-light-text-secondary" />
                  </div>
                )}
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => { setAssignee(e.target.value); setDirty(true); }}
                  onBlur={() => handleFieldChange('assignee', assignee.trim() || null)}
                  className={inlineInputClass + ' flex-1'}
                  placeholder="未分配"
                />
              </div>
            </AttrRow>

            {/* Status */}
            <AttrRow icon={<Activity size={14} />} label="状态">
              <StatusSelector value={status} onChange={handleStatusChange} />
            </AttrRow>

            {/* Due date */}
            <AttrRow icon={<Calendar size={14} />} label="截止日期">
              <div className="flex items-center gap-2">
                {isOverdue && <AlertTriangle size={14} className="text-[#E74C3C] flex-shrink-0" />}
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); setDirty(true); }}
                  onBlur={() => handleFieldChange('due_date', dueDate || null)}
                  className={inlineInputClass + (isOverdue ? ' text-[#E74C3C]' : '')}
                />
              </div>
            </AttrRow>

            {/* Notes / Description */}
            <AttrRow icon={<AlignLeft size={14} />} label="备注">
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
                onBlur={() => handleFieldChange('description', description.trim())}
                rows={2}
                className={inlineInputClass + ' resize-y min-h-[36px]'}
                placeholder="添加备注..."
              />
            </AttrRow>

            {/* Priority */}
            <AttrRow icon={<FileText size={14} />} label="优先级">
              <PrioritySelector value={priority} onChange={handlePriorityChange} />
            </AttrRow>

            {/* Last updated */}
            <AttrRow icon={<Clock size={14} />} label="最近更新">
              <div className="flex items-center gap-2 text-sm text-light-text-secondary">
                {assignee && (
                  <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full bg-[#ecedf5]" loading="lazy" />
                )}
                <span>刚刚</span>
              </div>
            </AttrRow>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center gap-2 px-5 py-3 border-t border-light-border bg-[#F4F6FC]/50">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={[
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                confirmDelete
                  ? 'bg-[#E74C3C] text-white'
                  : 'text-[#E74C3C] hover:bg-[#E74C3C]/10',
              ].join(' ')}
            >
              <Trash2 size={13} />
              {isDeleting ? '删除中...' : confirmDelete ? '确认删除' : '删除'}
            </button>
            {confirmDelete && (
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-light-text-secondary underline">取消</button>
            )}
            <div className="flex-1" />
            {dirty && (
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {isSaving ? '保存中...' : '保存全部'}
              </button>
            )}
          </div>
        </div>

        {/* ============ Right: Updates / Files / Activity panel ============ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-light-border">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {[
                { key: 'updates' as const, label: '动态', icon: <Activity size={14} /> },
                { key: 'files' as const, label: '文件', icon: <FileText size={14} /> },
                { key: 'activity' as const, label: '操作日志', icon: <Clock size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-light-text-secondary hover:bg-[#ecedf5]',
                  ].join(' ')}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#ecedf5] text-light-text-secondary transition-colors"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {activeTab === 'updates' && (
              <>
                {/* Update input */}
                <div className="p-4">
                  <div className="border border-light-border rounded-lg overflow-hidden">
                    {/* Mini toolbar */}
                    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-light-border/50 bg-[#F4F6FC]">
                      {['B', 'I', 'U', 'S'].map((f) => (
                        <button key={f} className="w-6 h-6 rounded text-xs font-bold text-light-text-secondary hover:bg-[#d0d4e4] transition-colors">
                          {f}
                        </button>
                      ))}
                    </div>
                    {/* Text area */}
                    <textarea
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm text-light-text bg-transparent outline-none resize-none placeholder:text-light-text-secondary"
                      placeholder="撰写动态更新..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && updateText.trim()) {
                          e.preventDefault();
                          handleSendComment();
                        }
                      }}
                    />
                    {/* Bottom bar */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-light-border/50">
                      <div className="flex items-center gap-2 text-light-text-secondary">
                        <button className="hover:text-primary transition-colors" title="提及">@</button>
                        <button className="hover:text-primary transition-colors" title="附件">📎</button>
                        <span className="text-xs text-light-text-secondary/60">Ctrl+Enter 发送</span>
                      </div>
                      <button
                        disabled={!updateText.trim() || isSendingComment}
                        onClick={handleSendComment}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSendingComment ? '发送中...' : '更新'}
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments list */}
                {comments.length > 0 ? (
                  <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                    {comments.map((c) => {
                      const seed = encodeURIComponent(c.actor);
                      const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`;
                      const time = new Date(c.created_at);
                      const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                      return (
                        <div key={c.id} className="flex gap-3">
                          <img src={avatar} alt={c.actor} className="w-8 h-8 rounded-full shrink-0 mt-0.5" loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-light-text">{c.actor}</span>
                              <span className="text-xs text-light-text-secondary">{timeStr}</span>
                            </div>
                            <p className="text-sm text-light-text mt-1 whitespace-pre-wrap break-words">{c.summary}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-8">
                    <div className="text-5xl mb-3 opacity-60">💬</div>
                    <p className="text-sm font-medium text-light-text mb-1">暂无动态更新</p>
                    <p className="text-xs text-light-text-secondary leading-relaxed">
                      在此分享进度、提及团队成员或上传文件以推动工作进展
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'files' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-sm font-medium text-light-text mb-1">暂无文件</p>
                <p className="text-xs text-light-text-secondary">
                  拖拽文件至此处或点击上传
                </p>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-sm font-medium text-light-text mb-1">操作日志</p>
                <p className="text-xs text-light-text-secondary">
                  此处将显示任务的所有变更记录
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
