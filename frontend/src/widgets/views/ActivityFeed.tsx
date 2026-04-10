import React from 'react'
import { ActivityItem } from '../business'
import { EmptyState } from '../atomic'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { ActivityEvent } from '../../types'

export interface ActivityFeedProps {
  data?: {
    activities?: ActivityEvent[]
    projectNameMap?: Record<string, string>
  }
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ data }) => {
  const storeActivities = useDashboardStore((s) => s.recentActivities)
  const activities = data?.activities ?? storeActivities
  const nameMap = data?.projectNameMap ?? {}

  if (activities.length === 0) {
    return <EmptyState icon="activity" title="暂无活动记录" description="活动将在此处显示" />
  }

  return (
    <div
      className="bg-white  border border-[#E8ECF4]  rounded-[10px] p-5 transition-colors duration-200"
      role="region"
      aria-label="最近活动"
    >
      <h2 className="text-base font-medium text-light-text  mb-4">
        最近活动
      </h2>

      <div
        className="overflow-y-auto"
        style={{ maxHeight: '400px', scrollbarWidth: 'thin' }}
        role="log"
        aria-label="最近活动列表"
      >
        {activities.map((item, idx) => (
          <ActivityItem
            key={item.id}
            activity={item}
            projectName={nameMap[item.project_id]}
            showConnector={idx < activities.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

export default ActivityFeed
