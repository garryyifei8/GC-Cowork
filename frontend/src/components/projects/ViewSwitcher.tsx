import React from 'react';
import { LayoutGrid, Columns3, GanttChart } from 'lucide-react';
import type { ViewType } from '../../types';

interface ViewSwitcherProps {
  active: ViewType;
  onChange: (view: ViewType) => void;
}

const VIEWS: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'table', label: '表格视图', icon: <LayoutGrid size={16} /> },
  { key: 'kanban', label: '看板视图', icon: <Columns3 size={16} /> },
  { key: 'gantt', label: '甘特图', icon: <GanttChart size={16} /> },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ active, onChange }) => (
  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
    {VIEWS.map((v) => (
      <button
        key={v.key}
        className={
          `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ` +
          (active === v.key
            ? 'bg-light-surface dark:bg-dark-surface shadow-sm text-primary'
            : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text')
        }
        onClick={() => onChange(v.key)}
      >
        {v.icon}
        {v.label}
      </button>
    ))}
  </div>
);
