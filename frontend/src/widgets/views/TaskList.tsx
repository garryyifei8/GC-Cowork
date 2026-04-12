import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  GripVertical,
  MoreVertical,
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { EmptyState } from '../atomic';
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import type { TaskWithProject } from '../../types';

// ---------------------------------------------------------------------------
// Status dot colors matching Preclinic design spec
// ---------------------------------------------------------------------------

const STATUS_DOT_COLORS: Record<string, string> = {
  in_progress: '#00C875',
  todo: '#C4C4C4',
  done: '#919AA3',
  blocked: '#E74C3C',
  review: '#FFB264',
};

// ---------------------------------------------------------------------------
// All statuses / priorities for dropdowns
// ---------------------------------------------------------------------------

const ALL_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const ALL_PRIORITIES = ['high', 'medium', 'low'];

// ---------------------------------------------------------------------------
// Priority dot colors (filled for high, outline-style for medium/low via border)
// ---------------------------------------------------------------------------

const PRIORITY_DOT_COLORS: Record<string, string> = {
  high: '#E74C3C',
  medium: '#FFB264',
  low: '#00CAE3',
};

// ---------------------------------------------------------------------------
// Project tag pill colors — deterministic by project name hash
// ---------------------------------------------------------------------------

const TAG_PILL_COLORS = [
  'bg-[#0086C0]',
  'bg-[#00C875]',
  'bg-[#E74C3C]',
  'bg-[#00CAE3]',
  'bg-[#FFB264]',
];

function getTagPillColor(name: string): string {
  if (!name) return TAG_PILL_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TAG_PILL_COLORS[hash % TAG_PILL_COLORS.length];
}

// ---------------------------------------------------------------------------
// Assignee avatar helpers
// ---------------------------------------------------------------------------

function getAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`;
}

const AvatarGroup: React.FC<{ assignee: string | null }> = ({ assignee }) => {
  if (!assignee) return null;
  const names = assignee
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 3);
  return (
    <div className="flex items-center -space-x-1.5">
      {names.map((name, i) => (
        <img
          key={i}
          src={getAvatarUrl(name)}
          alt={name}
          title={name}
          className="w-6 h-6 rounded-full border-2 border-white shrink-0"
          loading="lazy"
          style={{ zIndex: names.length - i }}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status dropdown (dot + label inline, popover to change)
// ---------------------------------------------------------------------------

const StatusDisplay: React.FC<{
  status: string;
  onSelect?: (status: string) => void;
}> = ({ status, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dotColor = STATUS_DOT_COLORS[status] ?? '#C4C4C4';
  const label = TASK_STATUS_LABELS[status] ?? status;

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        className="flex items-center gap-1.5 text-sm text-light-text hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={`状态: ${label}`}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full right-0 mt-1 bg-white border border-[#E8ECF4] rounded-[10px] shadow-lg py-1 min-w-[110px]">
          {ALL_STATUSES.map((s) => {
            const c = STATUS_DOT_COLORS[s] ?? '#C4C4C4';
            const l = TASK_STATUS_LABELS[s] ?? s;
            return (
              <button
                key={s}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium hover:bg-[#F4F6FC] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(s);
                  setOpen(false);
                }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                <span
                  className={
                    s === status ? 'font-medium text-light-text' : 'text-light-text-secondary'
                  }
                >
                  {l}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Priority dropdown (dot + label inline)
// ---------------------------------------------------------------------------

const PriorityDisplay: React.FC<{
  priority: string;
  onSelect?: (priority: string) => void;
}> = ({ priority, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dotColor = PRIORITY_DOT_COLORS[priority] ?? '#C4C4C4';
  const label = PRIORITY_LABELS[priority] ?? priority;

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        className="flex items-center gap-1.5 text-sm text-light-text hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={`优先级: ${label}`}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full right-0 mt-1 bg-white border border-[#E8ECF4] rounded-[10px] shadow-lg py-1 min-w-[90px]">
          {ALL_PRIORITIES.map((p) => {
            const c = PRIORITY_DOT_COLORS[p] ?? '#C4C4C4';
            const l = PRIORITY_LABELS[p] ?? p;
            return (
              <button
                key={p}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium hover:bg-[#F4F6FC] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(p);
                  setOpen(false);
                }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                <span
                  className={
                    p === priority ? 'font-medium text-light-text' : 'text-light-text-secondary'
                  }
                >
                  {l}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Task row — Preclinic Todo style, 44px height
// ---------------------------------------------------------------------------

const TaskRow: React.FC<{
  task: TaskWithProject;
  showProject: boolean;
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
  onTaskClick?: (task: TaskWithProject) => void;
  isLast?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}> = ({
  task,
  showProject,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
  isLast,
  isSelected,
  onToggleSelect,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const isDone = task.status === 'done';
  const isOverdue = !!task.due_date && task.due_date < today && !isDone;

  const dueDateDisplay = (() => {
    if (!task.due_date) return null;
    const diff = Math.ceil(
      (new Date(task.due_date).getTime() - new Date(today).getTime()) / 86400000
    );
    if (isDone) return task.due_date;
    if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    return task.due_date;
  })();

  const tagPillColor = getTagPillColor(task.project_name ?? '');

  return (
    <div
      className={`flex items-center h-[44px] px-3 gap-3 hover:bg-[#F4F6FC] transition-colors${
        !isLast ? ' border-b border-[#E8ECF4]' : ''
      }${onTaskClick ? ' cursor-pointer' : ''}${isOverdue ? ' border-l-2 border-l-[#E74C3C]' : ''}`}
      data-overdue={isOverdue ? 'true' : 'false'}
      onClick={() => onTaskClick?.(task)}
      role={onTaskClick ? 'button' : undefined}
      tabIndex={onTaskClick ? 0 : undefined}
      onKeyDown={
        onTaskClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onTaskClick(task);
            }
          : undefined
      }
    >
      {/* Select checkbox / drag handle */}
      {onToggleSelect ? (
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(task.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 shrink-0 accent-[#0F79F3] cursor-pointer"
        />
      ) : (
        <GripVertical size={14} className="text-[#E8ECF4] shrink-0 cursor-grab" />
      )}

      {/* Checkbox */}
      <div
        className={`w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center transition-colors${
          isDone
            ? ' bg-[#0F79F3] border-[#0F79F3]'
            : ' bg-white border-[#E8ECF4] hover:border-[#0F79F3]'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, isDone ? 'todo' : 'done');
        }}
        role="checkbox"
        aria-checked={isDone}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            onStatusChange(task.id, isDone ? 'todo' : 'done');
          }
        }}
        title={isDone ? '标记为未完成' : '标记为完成'}
      >
        {isDone && <Check size={10} className="text-white" strokeWidth={2.5} />}
      </div>

      {/* Star */}
      <Star size={14} className="text-[#FFB264] shrink-0 fill-[#FFB264]" />

      {/* Task name */}
      <h4
        className={`text-[15px] font-medium truncate flex-1 min-w-0${
          isDone ? ' line-through opacity-50 text-light-text-secondary' : ' text-light-text'
        }`}
      >
        {task.name}
      </h4>

      {/* Due date */}
      {dueDateDisplay && (
        <span
          className={`flex items-center gap-1 text-sm shrink-0${
            isOverdue ? ' text-[#E74C3C]' : ' text-[#00C875]'
          }`}
        >
          <Calendar size={13} />
          {dueDateDisplay}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side cluster */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Project tag pill */}
        {showProject && task.project_name && (
          <span
            className={`${tagPillColor} text-white text-xs font-medium px-2.5 py-1 rounded-[10px] shrink-0 max-w-[140px] truncate`}
          >
            {task.project_name}
          </span>
        )}

        {/* Status: dot + label (dropdown) */}
        <StatusDisplay status={task.status} onSelect={(s) => onStatusChange(task.id, s)} />

        {/* Priority: dot + label (dropdown) */}
        <PriorityDisplay priority={task.priority} onSelect={(p) => onPriorityChange(task.id, p)} />

        {/* Avatar group */}
        <AvatarGroup assignee={task.assignee} />

        {/* More button */}
        <button
          className="p-0.5 rounded hover:bg-[#E8ECF4] transition-colors text-[#919AA3] shrink-0"
          onClick={(e) => e.stopPropagation()}
          title="更多操作"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Add-task inline row
// ---------------------------------------------------------------------------

const AddTaskRow: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        className="flex items-center gap-1.5 w-full px-3 py-2.5 text-[13px] text-light-text-secondary hover:text-primary hover:bg-[#F4F6FC] transition-colors border-t border-[#E8ECF4]"
        onClick={() => setEditing(true)}
      >
        <Plus size={13} />
        <span>添加任务</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-[#E8ECF4]">
      <Plus size={13} className="text-[#0086C0] shrink-0" />
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-sm text-light-text outline-none placeholder:text-[#919AA3]"
        placeholder="输入任务名称，按回车创建"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') {
            setValue('');
            setEditing(false);
          }
        }}
        onBlur={handleSubmit}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Group section — Preclinic collapsible header + left-accent card
// ---------------------------------------------------------------------------

interface GroupSectionProps {
  label: string;
  count: number;
  accentColor: string;
  dotFilled?: boolean;
  tasks: TaskWithProject[];
  showProject: boolean;
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
  onTaskClick?: (task: TaskWithProject) => void;
  onQuickAdd?: (name: string) => void;
  defaultCollapsed?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  label,
  count,
  accentColor,
  dotFilled = true,
  tasks,
  showProject,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
  onQuickAdd,
  defaultCollapsed = false,
  selectedTaskIds,
  onToggleSelect,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between py-3">
        {/* Left cluster */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center text-light-text-secondary hover:text-light-text transition-colors shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* Priority dot: filled circle for primary, outlined for others */}
          {dotFilled ? (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
          ) : (
            <span
              className="w-3 h-3 rounded-full shrink-0 border-2"
              style={{ borderColor: accentColor }}
            />
          )}

          <h5 className="text-[18px] font-medium text-light-text leading-none">{label}</h5>

          <span className="text-sm font-medium bg-[#F4F6FC] text-light-text-secondary rounded-[3px] px-2 py-0.5 leading-none">
            {count}
          </span>
        </div>

        {/* Right: See All */}
        <button
          className="flex items-center gap-1 text-sm font-medium text-[#00C875] hover:underline transition-colors"
          onClick={() => {}}
        >
          查看全部
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Task card with left-accent border */}
      {!collapsed && (
        <div
          className="border border-[#E8ECF4] rounded-[10px] overflow-hidden"
          style={{ borderLeftWidth: '2px', borderLeftColor: accentColor }}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-xs text-light-text-secondary py-5">暂无任务</div>
          ) : (
            tasks.map((task, idx) => (
              <TaskRow
                key={task.id}
                task={task}
                showProject={showProject}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onTaskClick={onTaskClick}
                isLast={idx === tasks.length - 1 && !onQuickAdd}
                isSelected={selectedTaskIds?.has(task.id)}
                onToggleSelect={onToggleSelect}
              />
            ))
          )}
          {onQuickAdd && <AddTaskRow onAdd={onQuickAdd} />}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

type DateBucket = '已过期' | '今天' | '本周' | '下周' | '以后' | '无日期';

function getDateBucket(dueDate: string | null, todayStr: string): DateBucket {
  if (!dueDate) return '无日期';
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return '已过期';
  if (diffDays === 0) return '今天';
  const todayDow = today.getDay();
  const daysUntilEndOfWeek = todayDow === 0 ? 0 : 7 - todayDow;
  if (diffDays <= daysUntilEndOfWeek) return '本周';
  if (diffDays <= daysUntilEndOfWeek + 7) return '下周';
  return '以后';
}

const DATE_BUCKET_ORDER: DateBucket[] = ['已过期', '今天', '本周', '下周', '以后', '无日期'];

const DATE_BUCKET_COLORS: Record<DateBucket, string> = {
  已过期: '#E74C3C',
  今天: '#00C875',
  本周: '#00CAE3',
  下周: '#00CAE3',
  以后: '#796DF6',
  无日期: '#919AA3',
};

// ---------------------------------------------------------------------------
// Priority group colors and config
// ---------------------------------------------------------------------------

const PRIORITY_ORDER = ['high', 'medium', 'low'];

const PRIORITY_GROUP_CONFIG: Record<string, { color: string; filled: boolean }> = {
  high: { color: '#E74C3C', filled: true },
  medium: { color: '#FFB264', filled: false },
  low: { color: '#00CAE3', filled: false },
};

// ---------------------------------------------------------------------------
// Project group accent colors
// ---------------------------------------------------------------------------

const GROUP_ACCENT_COLORS = [
  '#0086C0',
  '#6BBF59',
  '#796DF6',
  '#FFB264',
  '#E74C3C',
  '#00C875',
  '#FF7A59',
  '#37B4E3',
  '#919AA3',
  '#34C759',
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sort types
// ---------------------------------------------------------------------------

type SortColumn = 'name' | 'status' | 'priority' | 'due_date';
type SortDir = 'asc' | 'desc';

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: TaskWithProject[], col: SortColumn, dir: SortDir): TaskWithProject[] {
  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (col === 'name') {
      cmp = (a.name ?? '').localeCompare(b.name ?? '', 'zh');
    } else if (col === 'status') {
      cmp = (a.status ?? '').localeCompare(b.status ?? '');
    } else if (col === 'priority') {
      cmp = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
    } else if (col === 'due_date') {
      const aDate = a.due_date ?? '9999-99-99';
      const bDate = b.due_date ?? '9999-99-99';
      cmp = aDate.localeCompare(bDate);
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ---------------------------------------------------------------------------
// SortHeaderBar
// ---------------------------------------------------------------------------

const SORT_COLS: Array<{ key: SortColumn; label: string }> = [
  { key: 'name', label: '名称' },
  { key: 'status', label: '状态' },
  { key: 'priority', label: '优先级' },
  { key: 'due_date', label: '截止日期' },
];

const SortHeaderBar: React.FC<{
  sortCol: SortColumn | null;
  sortDir: SortDir;
  onSort: (col: SortColumn) => void;
}> = ({ sortCol, sortDir, onSort }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#E8ECF4] bg-[#E6FAF0]">
    {SORT_COLS.map((col) => {
      const active = sortCol === col.key;
      return (
        <button
          key={col.key}
          data-testid={`sort-header-${col.key}`}
          aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors${
            active
              ? ' text-[#0F79F3] bg-[#EFF3F9]'
              : ' text-[#919AA3] hover:text-light-text hover:bg-[#F4F6FC]'
          }`}
          onClick={() => onSort(col.key)}
        >
          {col.label}
          {active ? sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : null}
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// GroupBySelector
// ---------------------------------------------------------------------------

const GROUP_BY_OPTIONS: Array<{ value: 'none' | 'priority' | 'project' | 'date'; label: string }> =
  [
    { value: 'none', label: '不分组' },
    { value: 'priority', label: '按优先级' },
    { value: 'project', label: '按项目' },
    { value: 'date', label: '按日期' },
  ];

const GroupBySelector: React.FC<{
  value: 'none' | 'priority' | 'project' | 'date';
  onChange: (v: 'none' | 'priority' | 'project' | 'date') => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-xs text-[#919AA3]">分组:</span>
    <select
      data-testid="group-by-selector"
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className="text-[13px] border border-[#E8ECF4] rounded-lg px-2.5 py-1 bg-white text-light-text outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
    >
      {GROUP_BY_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export interface TaskListProps {
  data?: {
    tasks?: TaskWithProject[];
    groupBy?: 'date' | 'none' | 'project' | 'priority';
  };
  onTaskClick?: (task: TaskWithProject) => void;
  onQuickAdd?: (name: string, groupKey: string) => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TaskList: React.FC<TaskListProps> = ({ data, onTaskClick, onQuickAdd }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks);
  const storeGroupBy = useTaskWorkbenchStore((s) => s.groupBy);
  const updateTaskStatus = useTaskWorkbenchStore((s) => s.updateTaskStatus);
  const updateTaskPriority = useTaskWorkbenchStore((s) => s.updateTaskPriority);
  const selectedTaskIds = useTaskWorkbenchStore((s) => s.selectedTaskIds);
  const toggleTaskSelection = useTaskWorkbenchStore((s) => s.toggleTaskSelection);

  const tasks: TaskWithProject[] = data?.tasks ?? storeTasks;
  const [localGroupBy, setLocalGroupBy] = useState<'date' | 'none' | 'project' | 'priority'>(
    data?.groupBy ?? storeGroupBy
  );
  const groupBy = localGroupBy;
  const today = new Date().toISOString().slice(0, 10);

  // Sort state (client-side only)
  const [sortCol, setSortCol] = useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const onStatusChange = (taskId: string, status: string) => updateTaskStatus(taskId, status);
  const onPriorityChange = (taskId: string, priority: string) =>
    updateTaskPriority(taskId, priority);

  // Apply client-side sort if active
  const displayTasks = sortCol ? sortTasks(tasks, sortCol, sortDir) : tasks;

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="clipboard"
        title="暂无符合条件的任务"
        description="调整筛选条件或创建新任务"
      />
    );
  }

  // -------------------------------------------------------------------------
  // Date grouping
  // -------------------------------------------------------------------------
  if (groupBy === 'date') {
    const bucketMap = new Map<DateBucket, TaskWithProject[]>();
    for (const bucket of DATE_BUCKET_ORDER) bucketMap.set(bucket, []);
    for (const task of displayTasks) bucketMap.get(getDateBucket(task.due_date, today))!.push(task);

    return (
      <div>
        <GroupBySelector value={groupBy} onChange={setLocalGroupBy} />
        {DATE_BUCKET_ORDER.map((bucket) => {
          const bucketTasks = bucketMap.get(bucket) ?? [];
          if (bucketTasks.length === 0 && bucket !== '今天') return null;
          return (
            <GroupSection
              key={bucket}
              label={bucket}
              count={bucketTasks.length}
              accentColor={DATE_BUCKET_COLORS[bucket]}
              dotFilled={true}
              tasks={bucketTasks}
              showProject={true}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
              onQuickAdd={onQuickAdd ? (name) => onQuickAdd(name, bucket) : undefined}
              defaultCollapsed={bucket === '已过期' && bucketTasks.length > 5}
              selectedTaskIds={selectedTaskIds}
              onToggleSelect={toggleTaskSelection}
            />
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // No grouping — single flat card
  // -------------------------------------------------------------------------
  if (groupBy === 'none') {
    return (
      <div>
        <GroupBySelector value={groupBy} onChange={setLocalGroupBy} />
        <div
          className="border border-[#E8ECF4] rounded-[10px] overflow-hidden"
          style={{ borderLeftWidth: '2px', borderLeftColor: '#0086C0' }}
        >
          <SortHeaderBar sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          {displayTasks.map((task, idx) => (
            <TaskRow
              key={task.id}
              task={task}
              showProject={true}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
              isLast={idx === displayTasks.length - 1}
              isSelected={selectedTaskIds.has(task.id)}
              onToggleSelect={toggleTaskSelection}
            />
          ))}
          {onQuickAdd && <AddTaskRow onAdd={(name) => onQuickAdd(name, 'none')} />}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Project grouping
  // -------------------------------------------------------------------------
  if (groupBy === 'project') {
    const projectMap = new Map<string, TaskWithProject[]>();
    for (const task of displayTasks) {
      const existing = projectMap.get(task.project_name) ?? [];
      projectMap.set(task.project_name, [...existing, task]);
    }
    const sortedProjects = Array.from(projectMap.keys()).sort();

    return (
      <div>
        <GroupBySelector value={groupBy} onChange={setLocalGroupBy} />
        {sortedProjects.map((projectName, idx) => {
          const groupTasks = projectMap.get(projectName) ?? [];
          return (
            <GroupSection
              key={projectName}
              label={projectName}
              count={groupTasks.length}
              accentColor={GROUP_ACCENT_COLORS[idx % GROUP_ACCENT_COLORS.length]}
              dotFilled={true}
              tasks={groupTasks}
              showProject={false}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
              onQuickAdd={onQuickAdd ? (name) => onQuickAdd(name, projectName) : undefined}
              selectedTaskIds={selectedTaskIds}
              onToggleSelect={toggleTaskSelection}
            />
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Priority grouping (default fallback)
  // -------------------------------------------------------------------------
  const priorityMap = new Map<string, TaskWithProject[]>();
  for (const task of displayTasks) {
    const existing = priorityMap.get(task.priority) ?? [];
    priorityMap.set(task.priority, [...existing, task]);
  }

  return (
    <div>
      <GroupBySelector value={groupBy} onChange={setLocalGroupBy} />
      {PRIORITY_ORDER.map((priority) => {
        const groupTasks = priorityMap.get(priority);
        if (!groupTasks || groupTasks.length === 0) return null;
        const config = PRIORITY_GROUP_CONFIG[priority] ?? { color: '#C4C4C4', filled: false };
        return (
          <GroupSection
            key={priority}
            label={PRIORITY_LABELS[priority] ?? priority}
            count={groupTasks.length}
            accentColor={config.color}
            dotFilled={config.filled}
            tasks={groupTasks}
            showProject={true}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onTaskClick={onTaskClick}
            onQuickAdd={onQuickAdd ? (name) => onQuickAdd(name, priority) : undefined}
            selectedTaskIds={selectedTaskIds}
            onToggleSelect={toggleTaskSelection}
          />
        );
      })}
    </div>
  );
};

export default TaskList;
