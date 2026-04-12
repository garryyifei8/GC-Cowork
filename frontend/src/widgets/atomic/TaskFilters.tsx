import React from 'react';
import { Search, User, Filter, ArrowUpDown, EyeOff, Layers, MoreHorizontal } from 'lucide-react';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore';
import type { SortField } from '../../stores/taskWorkbenchStore';

export interface TaskFiltersProps {
  /** Chat injection data */
  data?: any;
  /** Callback when "新建任务" is clicked. If not provided, the button is a no-op. */
  onNewTask?: () => void;
}

const ToolbarBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  hasDropdown?: boolean;
  children?: React.ReactNode;
}> = ({ icon, label, onClick, active, hasDropdown, children }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  if (hasDropdown) {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
            active
              ? 'text-primary bg-primary/8 font-medium'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-[#F4F6FC] dark:hover:bg-dark-surface-hover hover:text-light-text dark:hover:text-dark-text'
          }`}
          onClick={() => setOpen(!open)}
        >
          {icon}
          <span>{label}</span>
        </button>
        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-[#E8ECF4] dark:border-dark-border rounded-[10px] shadow-xl py-1 min-w-[140px]">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? 'text-primary bg-primary/8 font-medium'
          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-[#F4F6FC] dark:hover:bg-dark-surface-hover hover:text-light-text dark:hover:text-dark-text'
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const DropdownItem: React.FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-[#F4F6FC] dark:hover:bg-dark-surface-hover ${
      active ? 'text-primary font-medium' : 'text-light-text dark:text-dark-text'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const TaskFilters: React.FC<TaskFiltersProps> = ({ onNewTask }) => {
  const tasks = useTaskWorkbenchStore((s) => s.tasks);
  const filterStatus = useTaskWorkbenchStore((s) => s.filterStatus);
  const filterPriority = useTaskWorkbenchStore((s) => s.filterPriority);
  const filterProjectId = useTaskWorkbenchStore((s) => s.filterProjectId);
  const viewMode = useTaskWorkbenchStore((s) => s.viewMode);
  const groupBy = useTaskWorkbenchStore((s) => s.groupBy);
  const searchQuery = useTaskWorkbenchStore((s) => s.searchQuery);
  const setFilterStatus = useTaskWorkbenchStore((s) => s.setFilterStatus);
  const setFilterPriority = useTaskWorkbenchStore((s) => s.setFilterPriority);
  const setFilterProjectId = useTaskWorkbenchStore((s) => s.setFilterProjectId);
  const setGroupBy = useTaskWorkbenchStore((s) => s.setGroupBy);
  const setSearchQuery = useTaskWorkbenchStore((s) => s.setSearchQuery);
  const fetchTasks = useTaskWorkbenchStore((s) => s.fetchTasks);
  const sortBy = useTaskWorkbenchStore((s) => s.sortBy);
  const sortDir = useTaskWorkbenchStore((s) => s.sortDir);
  const setSortBy = useTaskWorkbenchStore((s) => s.setSortBy);
  const toggleSortDir = useTaskWorkbenchStore((s) => s.toggleSortDir);

  // Local input state lets us control the text box immediately (for instant
  // client-side filtering) while deferring the API re-fetch via debounce.
  // Initialise from the store so that an externally-set query is reflected.
  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  // Debounce: when localSearch changes, update the store immediately for
  // client-side filtering and schedule a server re-fetch after 300 ms.
  // Skip the very first render — Tasks.tsx already calls fetchTasks on mount.
  const isFirstSearchRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    setSearchQuery(localSearch);
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]); // intentionally omit setSearchQuery/fetchTasks — they are stable Zustand actions

  const uniqueProjects = React.useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.project_name))).sort();
  }, [tasks]);

  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (searchExpanded) searchRef.current?.focus();
  }, [searchExpanded]);

  const handleNewTask = () => {
    onNewTask?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="任务工具栏">
      {/* New task */}
      <div className="flex items-center">
        <button
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors"
          onClick={handleNewTask}
        >
          新建任务
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#E8ECF4] dark:bg-dark-border mx-1" aria-hidden="true" />

      {/* Search */}
      {searchExpanded ? (
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute left-2.5 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none"
          />
          <input
            ref={searchRef}
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="搜索"
            className="pl-8 pr-3 py-1.5 rounded-[10px] border border-[#E8ECF4] bg-white dark:bg-dark-surface text-sm text-light-text dark:text-dark-text outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary w-48"
            aria-label="搜索任务"
            onBlur={() => {
              if (!localSearch) setSearchExpanded(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setLocalSearch('');
                setSearchQuery('');
                setSearchExpanded(false);
              }
            }}
          />
        </div>
      ) : (
        <ToolbarBtn
          icon={<Search size={15} />}
          label="搜索"
          onClick={() => setSearchExpanded(true)}
        />
      )}

      {/* Project filter */}
      <ToolbarBtn icon={<User size={15} />} label="项目" hasDropdown active={!!filterProjectId}>
        <DropdownItem
          label="全部项目"
          active={!filterProjectId}
          onClick={() => setFilterProjectId(null)}
        />
        {uniqueProjects.map((name) => (
          <DropdownItem
            key={name}
            label={name}
            active={filterProjectId === name}
            onClick={() => setFilterProjectId(name)}
          />
        ))}
      </ToolbarBtn>

      {/* Filter */}
      <ToolbarBtn
        icon={<Filter size={15} />}
        label="筛选"
        hasDropdown
        active={!!filterStatus || !!filterPriority}
      >
        <div className="px-3 py-1.5 text-[11px] font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide">
          状态
        </div>
        <DropdownItem
          label="全部状态"
          active={!filterStatus}
          onClick={() => setFilterStatus(null)}
        />
        {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
          <DropdownItem
            key={key}
            label={label}
            active={filterStatus === key}
            onClick={() => setFilterStatus(key)}
          />
        ))}
        <div className="mx-2 my-1 border-t border-[#E8ECF4] dark:border-dark-border" />
        <div className="px-3 py-1.5 text-[11px] font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide">
          优先级
        </div>
        <DropdownItem
          label="全部优先级"
          active={!filterPriority}
          onClick={() => setFilterPriority(null)}
        />
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
          <DropdownItem
            key={key}
            label={`${label}优先级`}
            active={filterPriority === key}
            onClick={() => setFilterPriority(key)}
          />
        ))}
      </ToolbarBtn>

      {/* Sort */}
      <ToolbarBtn
        icon={<ArrowUpDown size={15} />}
        label={
          sortBy
            ? `排序: ${({ name: '名称', status: '状态', priority: '优先级', due_date: '截止日期', assignee: '负责人' } as Record<string, string>)[sortBy]}${sortDir === 'desc' ? ' ↓' : ' ↑'}`
            : '排序'
        }
        hasDropdown
        active={!!sortBy}
      >
        <DropdownItem label="默认排序" active={!sortBy} onClick={() => setSortBy(null)} />
        {(
          [
            ['name', '按名称'],
            ['status', '按状态'],
            ['priority', '按优先级'],
            ['due_date', '按截止日期'],
            ['assignee', '按负责人'],
          ] as [SortField, string][]
        ).map(([key, label]) => (
          <DropdownItem
            key={key}
            label={label + (sortBy === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')}
            active={sortBy === key}
            onClick={() => {
              if (sortBy === key) {
                toggleSortDir();
              } else {
                setSortBy(key);
              }
            }}
          />
        ))}
      </ToolbarBtn>

      {/* Hide placeholder */}
      <ToolbarBtn icon={<EyeOff size={15} />} label="隐藏" />

      {/* Group by */}
      {viewMode === 'list' && (
        <ToolbarBtn
          icon={<Layers size={15} />}
          label="分组"
          hasDropdown
          active={groupBy !== 'date'}
        >
          {(
            [
              ['date', '按日期分组'],
              ['none', '不分组'],
              ['project', '按项目分组'],
              ['priority', '按优先级分组'],
            ] as const
          ).map(([key, label]) => (
            <DropdownItem
              key={key}
              label={label}
              active={groupBy === key}
              onClick={() => setGroupBy(key)}
            />
          ))}
        </ToolbarBtn>
      )}

      {/* More */}
      <ToolbarBtn icon={<MoreHorizontal size={15} />} label="" />
    </div>
  );
};

export default TaskFilters;
