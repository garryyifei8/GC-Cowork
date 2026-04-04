import React from 'react'
import type { ActivityEvent } from '../../types'

export interface ActivityItemProps {
  activity: ActivityEvent
  /** Optional project name resolved from project_id */
  projectName?: string
  /** Whether to show the timeline connector line below */
  showConnector?: boolean
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  const d = new Date(isoString)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function getDotColorClass(eventType: string): string {
  switch (eventType) {
    case 'task_created': return 'bg-blue-500'
    case 'task_updated': return 'bg-sky-500'
    case 'stage_transition': return 'bg-emerald-500'
    case 'status_changed': return 'bg-amber-500'
    default: return 'bg-gray-400'
  }
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  projectName,
  showConnector = false,
}) => {
  const dotColorClass = getDotColorClass(activity.event_type)
  const relTime = formatRelativeTime(activity.created_at)

  return (
    <div className="flex gap-3 relative">
      {/* Timeline connector line */}
      {showConnector && (
        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-gray-300" aria-hidden="true" />
      )}
      {/* Dot */}
      <div
        className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 ${dotColorClass}`}
        aria-hidden="true"
      />
      {/* Content */}
      <div className="flex-1 flex flex-col gap-0.5 pb-4">
        <span className="text-sm leading-snug flex items-baseline flex-wrap gap-1 text-[#333]">
          {projectName && (
            <span className="inline-flex items-center text-[11px] font-semibold text-blue-600 bg-blue-500/10 px-1.5 py-px rounded-full whitespace-nowrap flex-shrink-0">
              {projectName}
            </span>
          )}
          {activity.summary}
        </span>
        <span className="text-xs text-[#6C7688]">
          {relTime}
        </span>
      </div>
    </div>
  )
}

export default ActivityItem
