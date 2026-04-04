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
  { key: 'table',  label: '表格视图', icon: <LayoutGrid size={15} /> },
  { key: 'kanban', label: '看板视图', icon: <Columns3 size={15} /> },
  { key: 'gantt',  label: '甘特图',   icon: <GanttChart size={15} /> },
]

const ViewSwitcher: React.FC<ViewSwitcherProps> = (props) => {
  const d = props.data
  const active = d?.active ?? props.active
  const { onChange } = props

  return (
    <div className="inline-flex items-center gap-0.5 bg-[#EFF3F9] rounded-lg p-1">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[15px] font-medium transition-all ${
            active === v.key
              ? 'bg-white shadow-sm text-primary'
              : 'text-light-text-secondary hover:text-light-text'
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
