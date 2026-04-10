import React from 'react'

import { useDashboardStore } from '../../stores/dashboardStore'

export interface StagePipelineProps {
  data?: { distribution?: Record<string, number> }
}

const PIPELINE_STAGES = [
  '立项', '投标', '签约', '设计', '采购',
  '施工/实施', '验收', '结算', '归档',
] as const

const STAGE_COLORS: Record<string, string> = {
  '立项': '#0086C0',
  '投标': '#2ED47E',
  '签约': '#796DF6',
  '设计': '#00C875',
  '采购': '#FFB264',
  '施工/实施': '#E74C3C',
  '验收': '#FF7A59',
  '结算': '#00CAE3',
  '归档': '#919AA3',
}

const StagePipeline: React.FC<StagePipelineProps> = ({ data }) => {
  const storeMetrics = useDashboardStore((s) => s.metrics)
  const stageDistribution = data?.distribution ?? storeMetrics?.stage_distribution ?? {}

  return (
    <div
      className="bg-white  border border-[#E8ECF4]  rounded-[10px] p-5 transition-colors duration-200 overflow-x-auto"
      role="region"
      aria-label="项目阶段分布管线图"
    >
      <h2 className="text-base font-semibold text-light-text  mb-4">
        阶段管线
      </h2>

      <div className="flex items-center gap-1 min-w-max pb-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const count = stageDistribution[stage] ?? 0
          const isEmpty = count === 0
          const color = STAGE_COLORS[stage] ?? '#919AA3'
          const isLast = idx === PIPELINE_STAGES.length - 1

          return (
            <React.Fragment key={stage}>
              <div
                className={[
                  'flex flex-col items-center gap-1 px-3.5 py-2.5 border-[1.5px] rounded-[10px] min-w-[84px] flex-shrink-0 cursor-default transition-all duration-150',
                  isEmpty
                    ? 'border-[#E8ECF4]  bg-transparent opacity-50'
                    : 'hover:-translate-y-0.5 hover:shadow-md',
                ].join(' ')}
                style={
                  !isEmpty
                    ? { borderColor: color, backgroundColor: `${color}14` }
                    : undefined
                }
                aria-label={`${stage}: ${count}个项目`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isEmpty ? '#919AA3' : color }}
                  aria-hidden="true"
                />
                <span
                  className={[
                    'text-xs font-semibold text-center whitespace-nowrap leading-tight',
                    isEmpty ? 'text-light-text-secondary ' : 'text-light-text ',
                  ].join(' ')}
                >
                  {stage}
                </span>
                <span
                  className="text-xl font-bold leading-none"
                  style={{ color: isEmpty ? '#919AA3' : color }}
                >
                  {count}
                </span>
              </div>

              {!isLast && (
                <div className="flex items-center flex-shrink-0 px-0.5" aria-hidden="true">
                  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="8" x2="16" y2="8" stroke="#E8ECF4" strokeWidth="1.5" />
                    <path d="M14 4L20 8L14 12" stroke="#E8ECF4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default StagePipeline
