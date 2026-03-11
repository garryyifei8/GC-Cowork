import React from 'react';

// Ordered list of stage labels in Chinese (keys used in stage_distribution)
const PIPELINE_STAGES = [
  '立项',
  '投标',
  '签约',
  '设计',
  '采购',
  '施工/实施',
  '验收',
  '结算',
  '归档',
] as const;

const STAGE_COLORS: Record<string, string> = {
  '立项': '#0086C0',
  '投标': '#6BBF59',
  '签约': '#9B51E0',
  '设计': '#00C875',
  '采购': '#FDAB3D',
  '施工/实施': '#E2445C',
  '验收': '#FF7A59',
  '结算': '#37B4E3',
  '归档': '#676879',
};

interface StagePipelineProps {
  stageDistribution: Record<string, number>;
}

export const StagePipeline: React.FC<StagePipelineProps> = ({ stageDistribution }) => {
  return (
    <div
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 overflow-x-auto"
      role="region"
      aria-label="项目阶段分布管线图"
    >
      <h2 className="text-base font-heading font-semibold mb-4">阶段管线</h2>

      <div className="flex items-center gap-1 min-w-max pb-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const count = stageDistribution[stage] ?? 0;
          const isEmpty = count === 0;
          const color = STAGE_COLORS[stage] ?? '#94a3b8';
          const isLast = idx === PIPELINE_STAGES.length - 1;

          return (
            <React.Fragment key={stage}>
              <div
                className={[
                  'flex flex-col items-center gap-1 px-3.5 py-2.5 border-[1.5px] rounded-[10px] min-w-[84px] flex-shrink-0 cursor-default transition-all duration-150',
                  isEmpty
                    ? 'border-light-border dark:border-dark-border bg-transparent opacity-50'
                    : 'hover:-translate-y-0.5 hover:shadow-md',
                ].join(' ')}
                style={
                  !isEmpty
                    ? {
                        borderColor: color,
                        backgroundColor: `${color}14`,
                      }
                    : undefined
                }
                aria-label={`${stage}: ${count}个项目`}
              >
                {/* Colored dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isEmpty ? '#94a3b8' : color }}
                  aria-hidden="true"
                />
                <span
                  className={[
                    'text-xs font-semibold text-center whitespace-nowrap leading-tight',
                    isEmpty
                      ? 'text-light-text-secondary dark:text-dark-text-secondary'
                      : '',
                  ].join(' ')}
                >
                  {stage}
                </span>
                <span
                  className="text-xl font-bold leading-none"
                  style={{ color: isEmpty ? '#94a3b8' : color }}
                >
                  {count}
                </span>
              </div>

              {!isLast && (
                <div
                  className="flex items-center flex-shrink-0 px-0.5"
                  aria-hidden="true"
                >
                  <svg
                    width="24"
                    height="16"
                    viewBox="0 0 24 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="block"
                  >
                    <line
                      x1="0"
                      y1="8"
                      x2="16"
                      y2="8"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M14 4L20 8L14 12"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
