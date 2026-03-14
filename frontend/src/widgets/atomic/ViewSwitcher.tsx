import React from 'react'
import { LayoutGrid, Columns3, GanttChart } from 'lucide-react'
import type { ViewType } from '../../types'

export interface ViewSwitcherProps {
  active: ViewType
  onChange: (view: ViewType) => void
  /** Chat injection data */
  data?: { active?: ViewType }
}

const VIEWS: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'table', label: '表格视图', icon: <LayoutGrid size={16} /> },
  { key: 'kanban', label: '看板视图', icon: <Columns3 size={16} /> },
  { key: 'gantt', label: '甘特图', icon: <GanttChart size={16} /> },
]

const ViewSwitcher: React.FC<ViewSwitcherProps> = (props) => {
  const d = props.data
  const active = d?.active ?? props.active
  const { onChange } = props

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === v.key
              ? 'bg-white dark:bg-gray-800 shadow-sm text-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          onClick={() => onChange(v.key)}
        >
          {v.icon}
          {v.label}
        </button>
      ))}
    </div>
  )
}

export default ViewSwitcher
