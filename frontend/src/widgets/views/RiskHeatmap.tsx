import React, { useState } from 'react'
import { EmptyState } from '../atomic'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { ProjectRiskSummary } from '../../types'

export interface RiskHeatmapProps {
  data?: { risks?: ProjectRiskSummary[] }
}

function getRiskBlockColor(score: number): string {
  if (score >= 70) return '#E2445C'
  if (score >= 50) return '#FDAB3D'
  if (score >= 30) return '#FFD166'
  return '#6BBF59'
}

function getRiskLabel(score: number): string {
  if (score >= 70) return '极高'
  if (score >= 50) return '高'
  if (score >= 30) return '中'
  return '低'
}

function truncateName(name: string, max = 10): string {
  return name.length > max ? `${name.slice(0, max)}...` : name
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  risk: ProjectRiskSummary | null
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  const storeMetrics = useDashboardStore((s) => s.metrics)
  const risks = data?.risks ?? storeMetrics?.project_risks ?? []

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    risk: null,
  })

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, risk: ProjectRiskSummary) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = e.currentTarget.closest('.risk-heatmap-container')?.getBoundingClientRect()
    if (!containerRect) return
    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
      risk,
    })
  }

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const sorted = [...risks].sort((a, b) => b.risk_score - a.risk_score)

  if (sorted.length === 0) {
    return <EmptyState icon="shield" title="暂无风险数据" description="所有项目运行正常" />
  }

  return (
    <div
      className="risk-heatmap-container relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="项目风险热力图"
    >
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex-shrink-0">
        风险热力图
      </h2>

      {/* Risk block grid */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))' }}
        role="list"
      >
        {sorted.map((risk) => {
          const color = getRiskBlockColor(risk.risk_score)
          const label = getRiskLabel(risk.risk_score)

          return (
            <div
              key={risk.project_id}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 border-[1.5px] rounded-[10px] cursor-default transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04] hover:shadow-md focus-visible:outline-none"
              style={{
                backgroundColor: `${color}22`,
                borderColor: `${color}66`,
              }}
              role="listitem"
              aria-label={`${risk.project_name}: 风险分 ${risk.risk_score}, ${label}风险`}
              onMouseEnter={(e) => handleMouseEnter(e, risk)}
              onMouseLeave={handleMouseLeave}
              tabIndex={0}
            >
              <span className="text-[1.375rem] font-extrabold leading-none" style={{ color }}>
                {risk.risk_score}
              </span>
              <span className="text-[0.6875rem] font-medium text-center leading-snug break-all text-gray-700 dark:text-gray-300">
                {truncateName(risk.project_name)}
              </span>
              <span
                className="text-[0.625rem] font-bold px-1.5 py-px rounded-full tracking-wide"
                style={{ color, backgroundColor: `${color}18` }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mt-1" aria-label="风险等级图例">
        {[
          { label: '低 (0-30)', color: '#6BBF59' },
          { label: '中 (30-50)', color: '#FFD166' },
          { label: '高 (50-70)', color: '#FDAB3D' },
          { label: '极高 (70+)', color: '#E2445C' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {tooltip.visible && tooltip.risk && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg min-w-[160px] max-w-[240px] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          role="tooltip"
        >
          <div className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-100">
            {tooltip.risk.project_name}
          </div>
          <div className="text-[0.8125rem] text-gray-500 dark:text-gray-400 mb-1">
            风险分: <strong>{tooltip.risk.risk_score}</strong>
          </div>
          {tooltip.risk.top_risk && (
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-snug border-t border-gray-200 dark:border-gray-700 pt-1 mt-0.5">
              {tooltip.risk.top_risk}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RiskHeatmap
