import React from 'react';
import { LayoutGrid, Columns3, GanttChart } from 'lucide-react';
import type { ViewType } from '../../types';
import './ViewSwitcher.css';

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
  <div className="view-switcher">
    {VIEWS.map((v) => (
      <button
        key={v.key}
        className={`view-tab${active === v.key ? ' active' : ''}`}
        onClick={() => onChange(v.key)}
      >
        {v.icon}
        {v.label}
      </button>
    ))}
  </div>
);
