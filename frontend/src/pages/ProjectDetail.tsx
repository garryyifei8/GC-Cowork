import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Clock,
  User,
  AlertTriangle,
  DollarSign,
  Flag,
  BarChart2,
  X,
  FolderOpen,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { dashboardService, projectService } from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import type { StatusVariant } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { ProjectTask, RiskItem, MilestoneItem, ProjectRiskSummary, ActivityEvent, DocumentItem } from '../types';
import { StagePipelineDetail } from '../components/projects/StagePipelineDetail';
import { StageDeliverablesSection } from '../components/projects/StageDeliverablesSection';
import { STAGE_ORDER } from '../utils/constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  initiation: '立项',
  bidding: '投标',
  contract: '签约',
  design: '设计',
  procurement: '采购',
  construction: '施工/实施',
  acceptance: '验收',
  settlement: '结算',
  archived: '归档',
};

const STAGE_TRANSITIONS: Record<string, string[]> = {
  initiation: ['bidding', 'contract'],
  bidding: ['contract', 'initiation'],
  contract: ['design'],
  design: ['procurement', 'construction'],
  procurement: ['construction'],
  construction: ['acceptance'],
  acceptance: ['settlement'],
  settlement: ['archived'],
  archived: [],
};

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#0086C0',
  in_progress: '#00C875',
  review: '#FDAB3D',
  done: '#676879',
  blocked: '#E2445C',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: '待办',
  in_progress: '进行中',
  review: '审核中',
  done: '已完成',
  blocked: '已阻塞',
};

const TASK_STATUS_ORDER = ['in_progress', 'todo', 'review', 'done', 'blocked'];

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  high:   { bg: 'rgba(226,68,92,0.1)',   color: '#E2445C' },
  medium: { bg: 'rgba(253,171,61,0.12)', color: '#c77d00' },
  low:    { bg: 'rgba(0,134,192,0.1)',   color: '#0086C0' },
};

const RISK_SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

const RISK_LEVEL_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
};

const avatarColors = [
  '#6BBF59', '#00C875', '#FDAB3D', '#E2445C',
  '#0086C0', '#9B51E0', '#FF7A59', '#37B4E3',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'active':    return 'success';
    case 'risk':      return 'danger';
    case 'planning':  return 'info';
    case 'completed': return 'default';
    default:          return 'default';
  }
}

function getProgressColor(status: string): string {
  switch (status) {
    case 'active':    return 'var(--color-success)';
    case 'risk':      return 'var(--color-danger)';
    case 'planning':  return 'var(--color-info)';
    case 'completed': return 'var(--color-text-muted)';
    default:          return 'var(--color-primary)';
  }
}

function avatarChar(name: string): string {
  if (!name) return '?';
  return name[0].toUpperCase();
}

function avatarColor(name: string, index = 0): string {
  const code = name ? name.charCodeAt(0) : 65;
  return avatarColors[(code + index) % avatarColors.length];
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

// Risk severity badge classes
function riskSeverityClasses(severity: string): string {
  switch (severity) {
    case 'low':      return 'bg-info/10 text-[#0086C0]';
    case 'medium':   return 'bg-warning/[0.12] text-[#c77d00]';
    case 'high':     return 'bg-danger/10 text-danger';
    case 'critical': return 'bg-danger/[0.18] text-danger';
    default:         return 'bg-info/10 text-[#0086C0]';
  }
}

// AI risk level chip classes
function riskLevelChipClasses(level: string): string {
  switch (level) {
    case 'low':      return 'bg-success/[0.12] text-[#007a44]';
    case 'medium':   return 'bg-warning/[0.15] text-[#a06800]';
    case 'high':     return 'bg-danger/[0.12] text-danger';
    case 'critical': return 'bg-danger/[0.18] text-danger';
    default:         return 'bg-success/[0.12] text-[#007a44]';
  }
}

// AI risk score value classes
function riskScoreValueClasses(level: string): string {
  switch (level) {
    case 'low':      return 'text-success';
    case 'medium':   return 'text-warning';
    case 'high':     return 'text-danger';
    case 'critical': return 'text-danger';
    default:         return 'text-success';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Team avatar stack
const TeamAvatarStack: React.FC<{ members: string[]; teamSize: number }> = ({ members, teamSize }) => {
  const shown = members.length > 0 ? members.slice(0, 3) : [];
  const remainder = teamSize - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((member, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-dark-surface"
          style={{ background: avatarColor(member, i) }}
          title={member}
        >
          {avatarChar(member)}
        </div>
      ))}
      {shown.length === 0 && Array.from({ length: Math.min(teamSize, 3) }).map((_, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-dark-surface"
          style={{ background: avatarColors[i % avatarColors.length] }}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      {remainder > 0 && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-dark-surface bg-slate-400">
          +{remainder}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inline picker: status
// ---------------------------------------------------------------------------
interface StatusPickerProps {
  value: string;
  onChange: (newStatus: string) => void;
}

const StatusPicker: React.FC<StatusPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const statusColor = TASK_STATUS_COLORS[value] || '#676879';

  return (
    <div className="relative inline-flex" ref={ref}>
      <span
        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: statusColor + '1A', color: statusColor }}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setOpen((o) => !o); }}}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {TASK_STATUS_LABELS[value] || value}
      </span>
      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg min-w-[120px] z-50 overflow-hidden"
          role="listbox"
          aria-label="选择状态"
        >
          {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => {
            const color = TASK_STATUS_COLORS[key] || '#676879';
            return (
              <button
                key={key}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap${key === value ? ' bg-primary/[0.07] font-semibold' : ''}`}
                role="option"
                aria-selected={key === value}
                onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inline picker: priority
// ---------------------------------------------------------------------------
interface PriorityPickerProps {
  value: string;
  onChange: (newPriority: string) => void;
}

const PriorityPicker: React.FC<PriorityPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const priorityStyle = PRIORITY_COLORS[value] || PRIORITY_COLORS.low;

  return (
    <div className="relative inline-flex" ref={ref}>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: priorityStyle.bg, color: priorityStyle.color }}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setOpen((o) => !o); }}}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {PRIORITY_LABELS[value] || value}
      </span>
      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg min-w-[120px] z-50 overflow-hidden"
          role="listbox"
          aria-label="选择优先级"
        >
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
            const style = PRIORITY_COLORS[key] || PRIORITY_COLORS.low;
            return (
              <button
                key={key}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap${key === value ? ' bg-primary/[0.07] font-semibold' : ''}`}
                role="option"
                aria-selected={key === value}
                onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: style.color }} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inline assignee editor
// ---------------------------------------------------------------------------
interface AssigneeEditorProps {
  value: string | null;
  onChange: (newAssignee: string) => void;
}

const AssigneeEditor: React.FC<AssigneeEditorProps> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(value ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== (value ?? '')) onChange(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="px-1.5 py-0.5 border border-primary rounded text-xs font-sans bg-light-surface dark:bg-dark-surface outline-none shadow-[0_0_0_2px_rgba(107,191,89,0.14)] min-w-[80px] max-w-[130px]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        placeholder="负责人姓名"
        aria-label="编辑负责人"
      />
    );
  }

  if (value) {
    return (
      <div
        className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80"
        onClick={startEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') startEdit(e as any); }}
        title="点击编辑负责人"
      >
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0"
          style={{ background: avatarColor(value) }}
        >
          {avatarChar(value)}
        </div>
        <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
          {value}
        </span>
      </div>
    );
  }

  return (
    <span
      className="text-[0.8125rem] text-slate-300 dark:text-slate-600 cursor-pointer"
      onClick={startEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') startEdit(e as any); }}
      title="点击添加负责人"
    >
      <User size={14} />
    </span>
  );
};

// ---------------------------------------------------------------------------
// Inline due date editor
// ---------------------------------------------------------------------------
interface DueDateEditorProps {
  value: string | null;
  onChange: (newDate: string) => void;
}

const DueDateEditor: React.FC<DueDateEditorProps> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overdue = isOverdue(value);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        className="px-1.5 py-0.5 border border-primary rounded text-xs font-sans bg-light-surface dark:bg-dark-surface outline-none shadow-[0_0_0_2px_rgba(107,191,89,0.14)] max-w-[140px]"
        defaultValue={value ?? ''}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        aria-label="选择截止日期"
      />
    );
  }

  return (
    <span
      className={`text-[0.8125rem] cursor-pointer transition-opacity hover:opacity-80${overdue ? ' text-danger font-medium' : ' text-light-text-secondary dark:text-dark-text-secondary'}`}
      onClick={startEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') startEdit(e as any); }}
      title="点击修改截止日期"
    >
      {value ? (
        <>{overdue && <Clock size={12} className="inline mr-0.5" />}{value}</>
      ) : (
        <span className="text-slate-300 dark:text-slate-600">—</span>
      )}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Single task row — with inline editing
// ---------------------------------------------------------------------------
interface TaskRowProps {
  task: ProjectTask;
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onSelectTask: (taskId: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, updateTask, onSelectTask }) => {
  return (
    <div
      className="flex items-center px-4 py-2.5 border-b border-light-border dark:border-dark-border last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
      aria-label={`任务: ${task.name}`}
    >
      {/* Name — click opens detail panel */}
      <div className="flex-1 min-w-[140px] overflow-hidden" style={{ flex: '1 1 200px' }}>
        <span
          className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis block cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSelectTask(task.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelectTask(task.id); }}
          title="点击查看任务详情"
        >
          {task.name}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex-none w-[110px]">
        <AssigneeEditor
          value={task.assignee}
          onChange={(v) => updateTask(task.id, { assignee: v || null })}
        />
      </div>

      {/* Status */}
      <div className="flex-none w-[110px]">
        <StatusPicker
          value={task.status}
          onChange={(v) => updateTask(task.id, { status: v })}
        />
      </div>

      {/* Priority */}
      <div className="flex-none w-[80px]">
        <PriorityPicker
          value={task.priority}
          onChange={(v) => updateTask(task.id, { priority: v })}
        />
      </div>

      {/* Due date */}
      <div className="flex-none w-[110px]">
        <DueDateEditor
          value={task.due_date}
          onChange={(v) => updateTask(task.id, { due_date: v })}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Task group with collapsible header
// ---------------------------------------------------------------------------
interface TaskGroupProps {
  status: string;
  tasks: ProjectTask[];
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onSelectTask: (taskId: string) => void;
}

const TaskGroup: React.FC<TaskGroupProps> = ({ status, tasks, updateTask, onSelectTask }) => {
  const [collapsed, setCollapsed] = useState(false);
  const color = TASK_STATUS_COLORS[status] || '#676879';
  const label = TASK_STATUS_LABELS[status] || status;

  return (
    <div className="border-b border-light-border dark:border-dark-border last:border-b-0">
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-light-border dark:border-dark-border border-l-4 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
        style={{ borderLeftColor: color, background: color + '0D' }}
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCollapsed((c) => !c); }}
      >
        {collapsed
          ? <ChevronRight size={14} style={{ color }} />
          : <ChevronDown size={14} style={{ color }} />
        }
        <span className="text-[0.8125rem] font-semibold tracking-[0.01em]" style={{ color }}>{label}</span>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-400/20 text-light-text-secondary dark:text-dark-text-secondary text-[0.6875rem] font-semibold">
          {tasks.length}
        </span>
      </div>
      {!collapsed && tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          updateTask={updateTask}
          onSelectTask={onSelectTask}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Task Detail Side Panel
// ---------------------------------------------------------------------------
interface TaskDetailPanelProps {
  task: ProjectTask;
  activities: ActivityEvent[];
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onClose: () => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, activities, updateTask, onClose }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(task.name);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);

  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(task.description ?? '');
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setNameDraft(task.name); }, [task.name]);
  useEffect(() => { setDescDraft(task.description ?? ''); }, [task.description]);

  useEffect(() => {
    if (editingName) setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [editingName]);

  useEffect(() => {
    if (editingDesc) setTimeout(() => descRef.current?.focus(), 0);
  }, [editingDesc]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== task.name) updateTask(task.id, { name: trimmed });
    setEditingName(false);
  };

  const commitDesc = () => {
    if (descDraft !== (task.description ?? '')) updateTask(task.id, { description: descDraft });
    setEditingDesc(false);
  };

  const taskActivities = activities.filter(
    (a) => a.detail?.task_id === task.id || (a.event_type === 'task_created' && a.detail?.task?.id === task.id)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/22 z-[600] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 w-[360px] bg-light-surface dark:bg-dark-surface border-l border-light-border dark:border-dark-border shadow-[-6px_0_32px_rgba(0,0,0,0.12)] z-[601] flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.2s cubic-bezier(0.4,0,0.2,1)' }}
        role="complementary"
        aria-label="任务详情"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-[0.8125rem] font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-[0.04em]">
            <FileText size={14} />
            任务详情
          </div>
          <button
            className="p-1 rounded text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-light-text dark:hover:text-dark-text transition-colors"
            onClick={onClose}
            aria-label="关闭任务详情"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

          {/* Task name */}
          {editingName ? (
            <textarea
              ref={nameInputRef}
              className="w-full text-[1.0625rem] font-bold border border-primary rounded px-1.5 py-1 bg-light-surface dark:bg-dark-surface outline-none shadow-[0_0_0_3px_rgba(107,191,89,0.12)] resize-none leading-[1.35] box-border"
              value={nameDraft}
              rows={2}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitName(); }
                if (e.key === 'Escape') { setNameDraft(task.name); setEditingName(false); }
              }}
              aria-label="编辑任务名称"
            />
          ) : (
            <div
              className="text-[1.0625rem] font-bold leading-[1.35] cursor-text rounded px-1 py-0.5 -mx-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors word-break-all"
              onClick={() => setEditingName(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(true); }}
              title="点击编辑任务名称"
            >
              {task.name}
            </div>
          )}

          {/* Description */}
          {editingDesc ? (
            <textarea
              ref={descRef}
              className="w-full text-sm border border-primary rounded px-2 py-1.5 bg-light-surface dark:bg-dark-surface outline-none shadow-[0_0_0_3px_rgba(107,191,89,0.12)] resize-y min-h-[80px] leading-relaxed box-border"
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => { if (e.key === 'Escape') { setDescDraft(task.description ?? ''); setEditingDesc(false); } }}
              placeholder="添加任务描述..."
              aria-label="编辑任务描述"
            />
          ) : task.description ? (
            <div
              className="text-sm leading-relaxed cursor-text px-2 py-1.5 rounded border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-light-border dark:hover:border-dark-border transition-colors break-words"
              onClick={() => setEditingDesc(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingDesc(true); }}
              title="点击编辑描述"
            >
              {task.description}
            </div>
          ) : (
            <div
              className="text-sm text-light-text-secondary dark:text-dark-text-secondary italic cursor-text px-2 py-1.5 rounded border border-dashed border-light-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-primary transition-colors"
              onClick={() => setEditingDesc(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingDesc(true); }}
            >
              点击添加任务描述...
            </div>
          )}

          <hr className="border-t border-light-border dark:border-dark-border" />

          {/* Fields */}
          <div className="flex flex-col gap-0.5">
            {/* Status */}
            <div className="flex items-center gap-3 py-1.5">
              <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary font-medium w-16 flex-shrink-0">状态</span>
              <div className="flex-1">
                <StatusPicker value={task.status} onChange={(v) => updateTask(task.id, { status: v })} />
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3 py-1.5">
              <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary font-medium w-16 flex-shrink-0">优先级</span>
              <div className="flex-1">
                <PriorityPicker value={task.priority} onChange={(v) => updateTask(task.id, { priority: v })} />
              </div>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-3 py-1.5">
              <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary font-medium w-16 flex-shrink-0">负责人</span>
              <div className="flex-1">
                <AssigneeEditor value={task.assignee} onChange={(v) => updateTask(task.id, { assignee: v || null })} />
              </div>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-3 py-1.5">
              <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary font-medium w-16 flex-shrink-0">截止日期</span>
              <div className="flex-1">
                <DueDateEditor value={task.due_date} onChange={(v) => updateTask(task.id, { due_date: v })} />
              </div>
            </div>
          </div>

          <hr className="border-t border-light-border dark:border-dark-border" />

          {/* Activity log */}
          <div className="flex flex-col gap-3">
            <div className="text-[0.8125rem] font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-[0.04em]">动态记录</div>
            {taskActivities.length > 0 ? (
              taskActivities.map((activity) => (
                <div key={activity.id} className="flex gap-2.5 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8125rem] leading-[1.4]">{activity.summary}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                      {activity.actor} · {formatDate(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary italic py-2">暂无动态记录</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

// ---------------------------------------------------------------------------
// Risk item in sidebar
// ---------------------------------------------------------------------------
const RiskCard: React.FC<{ risk: RiskItem }> = ({ risk }) => {
  const isHigh = risk.severity === 'high' || risk.severity === 'critical';
  const iconColorClass = isHigh ? 'text-danger' : risk.severity === 'medium' ? 'text-warning' : 'text-info';

  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-light-border dark:border-dark-border last:border-b-0 last:pb-0">
      <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${iconColorClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[0.8125rem] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{risk.title}</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.6875rem] font-semibold whitespace-nowrap flex-shrink-0 ${riskSeverityClasses(risk.severity)}`}>
            {RISK_SEVERITY_LABELS[risk.severity] || risk.severity}
          </span>
        </div>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-[1.45] mt-0.5 line-clamp-2">{risk.description}</p>
        {risk.owner && (
          <span className="block text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
            负责人: {risk.owner}
          </span>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Milestone item in sidebar
// ---------------------------------------------------------------------------
const MilestoneCard: React.FC<{ milestone: MilestoneItem }> = ({ milestone }) => {
  const dotClass =
    milestone.status === 'done'
      ? 'bg-success'
      : milestone.status === 'in_progress'
      ? 'bg-primary'
      : 'bg-light-border dark:bg-dark-border border-2 border-light-text-secondary dark:border-dark-text-secondary';

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-light-border dark:border-dark-border last:border-b-0 last:pb-0">
      <div className="flex flex-col items-center pt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-medium">{milestone.name}</div>
        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">{milestone.date}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Create task modal
// ---------------------------------------------------------------------------
interface CreateTaskModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; assignee?: string; priority?: string; due_date?: string }) => Promise<void>;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inputCls = "w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm bg-light-surface dark:bg-dark-surface outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(107,191,89,0.12)] transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        assignee: assignee.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-[440px] p-6 flex flex-col gap-5 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[1.0625rem] font-bold" id="modal-title">新建任务</h3>
          <button
            className="p-1 rounded text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-light-text dark:hover:text-dark-text transition-colors"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-name" className="text-[0.8125rem] font-medium">任务名称 *</label>
            <input
              id="task-name"
              type="text"
              className={inputCls}
              placeholder="输入任务名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-assignee" className="text-[0.8125rem] font-medium">负责人</label>
            <input
              id="task-assignee"
              type="text"
              className={inputCls}
              placeholder="负责人姓名"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-priority" className="text-[0.8125rem] font-medium">优先级</label>
            <select
              id="task-priority"
              className={inputCls}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-due" className="text-[0.8125rem] font-medium">截止日期</label>
            <input
              id="task-due"
              type="date"
              className={inputCls}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2.5 mt-1">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-light-border dark:border-dark-border bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              disabled={submitting || !name.trim()}
            >
              {submitting ? '创建中...' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sidebar card component
// ---------------------------------------------------------------------------
const SidebarCard: React.FC<{
  icon: React.ReactNode;
  iconClass?: string;
  title: string;
  children: React.ReactNode;
  bodyClass?: string;
}> = ({ icon, iconClass = 'text-light-text-secondary dark:text-dark-text-secondary', title, children, bodyClass }) => (
  <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden transition-colors duration-200">
    <div className="flex items-center gap-2 px-4 py-3.5 border-b border-light-border dark:border-dark-border bg-slate-50 dark:bg-slate-800/50">
      <span className={`flex-shrink-0 ${iconClass}`}>{icon}</span>
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className={`p-4 flex flex-col gap-3 ${bodyClass ?? ''}`}>
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main ProjectDetail page
// ---------------------------------------------------------------------------

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    projectDetail,
    tasks,
    activities,
    isLoading,
    error,
    fetchProjectDetail,
    fetchTasks,
    fetchActivities,
    transitionProject,
    createTask,
    updateTask,
  } = useProjectStore();

  const [showTransitionMenu, setShowTransitionMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [riskSummary, setRiskSummary] = useState<ProjectRiskSummary | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'deliverables'>('tasks');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchProjectDetail(id);
      fetchTasks(id);
      fetchActivities(id);
    }
  }, [id, fetchProjectDetail, fetchTasks, fetchActivities]);

  useEffect(() => {
    if (!id) return;
    dashboardService.getMetrics().then((metrics) => {
      const summary = metrics.project_risks.find((r) => r.project_id === id);
      setRiskSummary(summary ?? null);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (id) {
      projectService.getDocuments(id).then(setDocuments).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTransitionMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTaskId) setSelectedTaskId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedTaskId]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const project = projectDetail?.id === id ? projectDetail : null;
  const projectTasks: ProjectTask[] = id ? (tasks[id] ?? project?.tasks ?? []) : [];
  const projectActivities: ActivityEvent[] = id ? (activities[id] ?? []) : [];

  const transitions = project ? (STAGE_TRANSITIONS[project.stage] ?? []) : [];

  const tasksByStatus: Record<string, ProjectTask[]> = {};
  for (const task of projectTasks) {
    if (!tasksByStatus[task.status]) tasksByStatus[task.status] = [];
    tasksByStatus[task.status].push(task);
  }

  const statusGroupsToShow = TASK_STATUS_ORDER.filter((s) => (tasksByStatus[s]?.length ?? 0) > 0);

  const selectedTask = selectedTaskId
    ? projectTasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleTransition = async (targetStage: string) => {
    if (!id) return;
    setShowTransitionMenu(false);
    await transitionProject(id, targetStage);
  };

  const handleCreateTask = async (data: { name: string; assignee?: string; priority?: string; due_date?: string }) => {
    if (!id) return;
    await createTask(id, data);
    fetchTasks(id);
  };

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading && !project) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner text="加载项目详情..." />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-light-text-secondary dark:text-dark-text-secondary">
        <AlertTriangle size={36} className="text-danger" />
        <p className="text-base font-semibold text-danger">加载失败</p>
        <p className="text-sm">{error}</p>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8125rem] font-medium border border-light-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => id && fetchProjectDetail(id)}
        >
          重试
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-light-text-secondary dark:text-dark-text-secondary">
        <FolderOpen size={36} className="text-slate-300 dark:text-slate-600" />
        <p className="text-[0.9375rem] font-semibold">项目不存在</p>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8125rem] font-medium border border-light-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => navigate('/projects')}
        >
          返回项目集概览
        </button>
      </div>
    );
  }

  const progressColor = getProgressColor(project.status);
  const stageLabel = STAGE_LABELS[project.stage] ?? project.stage;

  const riskBarColor = riskSummary
    ? riskSummary.risk_level === 'low'
      ? 'var(--color-success)'
      : riskSummary.risk_level === 'medium'
      ? 'var(--color-warning)'
      : 'var(--color-danger)'
    : 'var(--color-border)';

  return (
    <div className="flex flex-col gap-6 min-h-0 animate-fade-in">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary" aria-label="面包屑导航">
        <button
          className="inline-flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 font-[inherit] text-[0.8125rem]"
          onClick={() => navigate('/projects')}
          aria-label="返回项目集概览"
        >
          <ArrowLeft size={14} />
          项目集概览
        </button>
        <span className="text-slate-300 dark:text-slate-600 text-xs" aria-hidden="true">/</span>
        <span className="font-medium text-light-text dark:text-dark-text whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]" title={project.name}>
          {project.name}
        </span>
      </nav>

      {/* Project Header Card */}
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6 flex flex-col gap-5 transition-colors duration-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold font-heading leading-tight">{project.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                {stageLabel}
              </span>
              <StatusBadge
                status={getStatusVariant(project.status)}
                label={project.status_label}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-5 flex-wrap mt-1">
              {/* Progress bar */}
              <div className="flex items-center gap-2.5 min-w-[200px]">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_pct}%`, background: progressColor }}
                    role="progressbar"
                    aria-valuenow={project.progress_pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary font-medium whitespace-nowrap">
                  {project.progress_pct}%
                </span>
              </div>
              {/* Team */}
              <div className="flex items-center gap-2">
                <TeamAvatarStack members={project.team_members ?? []} teamSize={project.team_size} />
                <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">{project.team_size} 人</span>
              </div>
              {/* Due date */}
              {project.due_date && (
                <span className="flex items-center gap-1 text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">
                  <Clock size={13} />
                  {project.due_date}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 items-center flex-shrink-0">
            {transitions.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-light-border dark:border-dark-border bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setShowTransitionMenu((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={showTransitionMenu}
                >
                  <Play size={15} />
                  推进阶段
                  <ChevronDown size={14} />
                </button>
                {showTransitionMenu && (
                  <div
                    className="absolute top-[calc(100%+6px)] right-0 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg min-w-[160px] z-[100] overflow-hidden animate-fade-in"
                    role="menu"
                  >
                    {transitions.map((stage) => (
                      <button
                        key={stage}
                        className="block w-full px-4 py-2.5 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-primary transition-colors"
                        role="menuitem"
                        onClick={() => handleTransition(stage)}
                      >
                        {STAGE_LABELS[stage] ?? stage}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={15} />
              新建任务
            </button>
          </div>
        </div>
      </div>

      {/* Stage Pipeline */}
      <StagePipelineDetail
        currentStage={project.stage}
        milestones={(project as any).milestones ?? []}
      />

      {/* Body: Task Board + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Main content with tabs */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden transition-colors duration-200">

          {/* Tab bar — underline style */}
          <div className="flex gap-0 border-b-2 border-light-border dark:border-dark-border">
            {(['tasks', 'deliverables'] as const).map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-0.5 ${
                  activeTab === tab
                    ? 'text-primary border-primary'
                    : 'text-light-text-secondary dark:text-dark-text-secondary border-transparent hover:text-light-text dark:hover:text-dark-text'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'tasks' ? '任务看板' : '阶段交付物'}
              </button>
            ))}
          </div>

          {activeTab === 'tasks' ? (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-light-border dark:border-dark-border bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[0.9375rem] font-semibold">任务看板</span>
                <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">
                  共 {projectTasks.length} 个任务
                </span>
              </div>

              {/* Column headers */}
              {projectTasks.length > 0 && (
                <div className="flex items-center px-4 py-2 border-b border-light-border dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-[0.04em]">
                  <div className="flex-1 min-w-[140px]" style={{ flex: '1 1 200px' }}>任务名称</div>
                  <div className="flex-none w-[110px]">负责人</div>
                  <div className="flex-none w-[110px]">状态</div>
                  <div className="flex-none w-[80px]">优先级</div>
                  <div className="flex-none w-[110px]">截止日期</div>
                </div>
              )}

              {/* Task groups */}
              {statusGroupsToShow.length > 0 ? (
                statusGroupsToShow.map((status) => (
                  <TaskGroup
                    key={status}
                    status={status}
                    tasks={tasksByStatus[status]}
                    updateTask={updateTask}
                    onSelectTask={handleSelectTask}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-light-text-secondary dark:text-dark-text-secondary">
                  <FolderOpen size={40} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-[0.9375rem] font-medium">暂无任务</p>
                  <p className="text-[0.8125rem]">点击右上角"新建任务"按钮添加第一个任务</p>
                </div>
              )}
            </>
          ) : (
            <StageDeliverablesSection
              stages={STAGE_ORDER}
              documents={documents}
              tasks={projectTasks}
              currentStage={project.stage}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="flex flex-col gap-4">

          {/* Budget Card */}
          <SidebarCard
            icon={<DollarSign size={15} />}
            title="预算信息"
          >
            <div className="flex justify-between items-center">
              <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">项目预算</span>
              <span className="text-sm font-semibold">
                {project.budget ?? (project as any).budget_display ?? '—'}
              </span>
            </div>
            {(project as any).actual_spend != null && (
              <>
                <hr className="border-t border-light-border dark:border-dark-border" />
                <div className="flex justify-between items-center">
                  <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">实际支出</span>
                  <span className="text-sm font-semibold">
                    ¥{((project as any).actual_spend as number).toLocaleString()}
                  </span>
                </div>
                {(project as any).budget_amount != null && (
                  <>
                    <hr className="border-t border-light-border dark:border-dark-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">使用率</span>
                      <span className="text-sm font-semibold text-warning">
                        {Math.round(((project as any).actual_spend / (project as any).budget_amount) * 100)}%
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </SidebarCard>

          {/* Risk Items Card */}
          {(project as any).risks && (project as any).risks.length > 0 && (
            <SidebarCard
              icon={<AlertTriangle size={15} />}
              iconClass="text-warning"
              title="风险项"
              bodyClass="py-2"
            >
              {((project as any).risks as RiskItem[]).map((risk, idx) => (
                <RiskCard key={idx} risk={risk} />
              ))}
            </SidebarCard>
          )}

          {/* Milestones Card */}
          {(project as any).milestones && (project as any).milestones.length > 0 && (
            <SidebarCard
              icon={<Flag size={15} />}
              iconClass="text-primary"
              title="里程碑"
              bodyClass="py-2"
            >
              {((project as any).milestones as MilestoneItem[]).map((m, idx) => (
                <MilestoneCard key={idx} milestone={m} />
              ))}
            </SidebarCard>
          )}

          {/* AI Risk Assessment Card */}
          <SidebarCard
            icon={<Sparkles size={15} />}
            iconClass="text-primary"
            title="AI 风险评估"
          >
            {riskSummary ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary">综合风险分</span>
                  <span className={`text-2xl font-bold ${riskScoreValueClasses(riskSummary.risk_level)}`}>
                    {riskSummary.risk_score}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(riskSummary.risk_score, 100)}%`,
                      background: riskBarColor,
                    }}
                  />
                </div>
                <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-semibold ${riskLevelChipClasses(riskSummary.risk_level)}`}>
                  {RISK_LEVEL_LABELS[riskSummary.risk_level] ?? riskSummary.risk_level}
                </span>
                {riskSummary.top_risk && (
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded border-l-[3px] border-warning">
                    主要风险: {riskSummary.top_risk}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary py-2 flex items-center gap-1.5">
                <BarChart2 size={14} />
                暂无风险评估数据
              </div>
            )}
          </SidebarCard>

        </aside>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Task Detail Side Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          activities={projectActivities}
          updateTask={updateTask}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
};
