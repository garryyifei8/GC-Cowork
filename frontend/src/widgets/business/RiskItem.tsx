import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { StatusBadge } from '../atomic'
import type { StatusVariant } from '../atomic'
import type { RiskItem as RiskItemType } from '../../types'

export interface RiskItemProps {
  risk: RiskItemType
}

const SEVERITY_VARIANT: Record<string, StatusVariant> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
}

const RiskItem: React.FC<RiskItemProps> = ({ risk }) => {
  const isHigh = risk.severity === 'high' || risk.severity === 'critical'
  const iconColorClass = isHigh
    ? 'text-red-500'
    : risk.severity === 'medium'
      ? 'text-amber-500'
      : 'text-blue-500'

  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-[#E8E8E8] last:border-b-0 last:pb-0">
      <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${iconColorClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[0.8125rem] font-semibold text-[#333] whitespace-nowrap overflow-hidden text-ellipsis">
            {risk.title}
          </span>
          <StatusBadge
            status={SEVERITY_VARIANT[risk.severity] ?? 'default'}
            label={SEVERITY_LABELS[risk.severity] ?? risk.severity}
            size="sm"
          />
        </div>
        <p className="text-xs text-[#6C7688] leading-[1.45] mt-0.5 line-clamp-2">
          {risk.description}
        </p>
        {risk.owner && (
          <span className="block text-xs text-[#6C7688] mt-0.5">
            负责人: {risk.owner}
          </span>
        )}
      </div>
    </div>
  )
}

export default RiskItem
