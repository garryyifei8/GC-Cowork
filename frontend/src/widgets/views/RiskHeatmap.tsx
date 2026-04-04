import React, { useState, useMemo } from 'react'
import { EmptyState } from '../atomic'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { ProjectRiskSummary } from '../../types'

export interface RiskHeatmapProps {
  data?: { risks?: ProjectRiskSummary[] }
}

function getRiskBlockColor(score: number): string {
  if (score >= 70) return '#E74C3C'
  if (score >= 50) return '#FFB264'
  if (score >= 30) return '#FFD166'
  return '#2ED47E'
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

type ViewMode = 'heatmap' | 'radar' | 'top10'

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  const storeMetrics = useDashboardStore((s) => s.metrics)
  const risks = data?.risks ?? storeMetrics?.project_risks ?? []
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap')

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    risk: null,
  })

  const sorted = useMemo(() => [...risks].sort((a, b) => b.risk_score - a.risk_score), [risks])

  // Radar chart data: risk distribution by level
  const riskDistribution = useMemo(() => {
    const dist = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const r of risks) {
      if (r.risk_score >= 70) dist.critical++
      else if (r.risk_score >= 50) dist.high++
      else if (r.risk_score >= 30) dist.medium++
      else dist.low++
    }
    return dist
  }, [risks])

  const avgScore = useMemo(
    () => risks.length > 0 ? Math.round(risks.reduce((s, r) => s + r.risk_score, 0) / risks.length) : 0,
    [risks],
  )

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

  if (sorted.length === 0) {
    return <EmptyState icon="shield" title="暂无风险数据" description="所有项目运行正常" />
  }

  return (
    <div
      className="risk-heatmap-container relative bg-white dark:bg-gray-800 border border-[#E8ECF4] dark:border-gray-700 rounded-[10px] p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="项目风险全景图"
    >
      {/* Header with view switcher */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-medium text-light-text dark:text-gray-100">
          风险全景图
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {([
            { key: 'heatmap', label: '热力图' },
            { key: 'radar', label: '雷达图' },
            { key: 'top10', label: 'TOP10' },
          ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === key
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <>
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
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 border-[1.5px] rounded-[10px] cursor-default transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04]"
                  style={{ backgroundColor: `${color}22`, borderColor: `${color}66` }}
                  role="listitem"
                  aria-label={`${risk.project_name}: 风险分 ${risk.risk_score}`}
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
        </>
      )}

      {/* Radar/Distribution View */}
      {viewMode === 'radar' && (
        <div className="flex flex-col items-center gap-4">
          {/* Ring chart showing distribution */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              {(() => {
                const total = risks.length || 1
                const segments = [
                  { label: '极高', count: riskDistribution.critical, color: '#E74C3C' },
                  { label: '高', count: riskDistribution.high, color: '#FFB264' },
                  { label: '中', count: riskDistribution.medium, color: '#FFD166' },
                  { label: '低', count: riskDistribution.low, color: '#2ED47E' },
                ].filter((s) => s.count > 0)

                let cumulative = 0
                const radius = 45
                const cx = 60
                const cy = 60

                return segments.map((seg) => {
                  const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
                  cumulative += seg.count
                  const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2

                  const x1 = cx + radius * Math.cos(startAngle)
                  const y1 = cy + radius * Math.sin(startAngle)
                  const x2 = cx + radius * Math.cos(endAngle)
                  const y2 = cy + radius * Math.sin(endAngle)
                  const largeArc = seg.count / total > 0.5 ? 1 : 0

                  return (
                    <path
                      key={seg.label}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={seg.color}
                      opacity={0.85}
                      stroke="white"
                      strokeWidth={1}
                    />
                  )
                })
              })()}
              <circle cx="60" cy="60" r="22" fill="white" className="dark:fill-gray-800" />
              <text x="60" y="56" textAnchor="middle" className="fill-gray-800 dark:fill-gray-100 text-[14px] font-bold">
                {avgScore}
              </text>
              <text x="60" y="70" textAnchor="middle" className="fill-gray-500 text-xs">
                平均分
              </text>
            </svg>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {[
              { label: '极高风险', count: riskDistribution.critical, color: '#E74C3C' },
              { label: '高风险', count: riskDistribution.high, color: '#FFB264' },
              { label: '中风险', count: riskDistribution.medium, color: '#FFD166' },
              { label: '低风险', count: riskDistribution.low, color: '#2ED47E' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP 10 View */}
      {viewMode === 'top10' && (
        <div className="flex flex-col gap-2">
          {sorted.slice(0, 10).map((risk, i) => {
            const color = getRiskBlockColor(risk.risk_score)
            return (
              <div key={risk.project_id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i < 3 ? 'bg-red-500' : 'bg-gray-400'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-100 truncate">{risk.project_name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${risk.risk_score}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-right" style={{ color }}>
                    {risk.risk_score}
                  </span>
                </div>
                {risk.top_risk && (
                  <span className="text-xs text-gray-400 max-w-[120px] truncate">{risk.top_risk}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend (heatmap only) */}
      {viewMode === 'heatmap' && (
        <div className="flex items-center gap-4 flex-wrap mt-1" aria-label="风险等级图例">
          {[
            { label: '低 (0-30)', color: '#2ED47E' },
            { label: '中 (30-50)', color: '#FFD166' },
            { label: '高 (50-70)', color: '#FFB264' },
            { label: '极高 (70+)', color: '#E74C3C' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hover tooltip */}
      {tooltip.visible && tooltip.risk && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 border border-[#E8ECF4] dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg min-w-[160px] max-w-[240px] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%) translateY(-100%)' }}
          role="tooltip"
        >
          <div className="text-sm font-medium mb-1 text-light-text dark:text-gray-100">{tooltip.risk.project_name}</div>
          <div className="text-[0.8125rem] text-light-text-secondary dark:text-gray-400 mb-1">
            风险分: <strong>{tooltip.risk.risk_score}</strong>
          </div>
          {tooltip.risk.top_risk && (
            <div className="text-xs text-light-text-secondary dark:text-gray-400 leading-snug border-t border-[#E8ECF4] dark:border-gray-700 pt-1 mt-0.5">
              {tooltip.risk.top_risk}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RiskHeatmap
