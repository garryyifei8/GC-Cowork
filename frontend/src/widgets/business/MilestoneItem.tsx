import React from 'react'
import type { MilestoneItem as MilestoneItemType } from '../../types'

export interface MilestoneItemProps {
  milestone: MilestoneItemType
}

const MilestoneItem: React.FC<MilestoneItemProps> = ({ milestone }) => {
  const dotClass =
    milestone.status === 'done'
      ? 'bg-emerald-500'
      : milestone.status === 'in_progress'
        ? 'bg-blue-500'
        : 'bg-gray-300 border-2 border-gray-400'

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[#E8E8E8] last:border-b-0 last:pb-0">
      <div className="flex flex-col items-center pt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-medium text-[#333]">
          {milestone.name}
        </div>
        <div className="text-xs text-[#6C7688] mt-0.5">
          {milestone.date}
        </div>
      </div>
    </div>
  )
}

export default MilestoneItem
