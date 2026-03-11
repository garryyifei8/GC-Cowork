import React from 'react';
import { STAGE_ORDER, STAGE_LABELS } from '../../utils/constants';
import type { MilestoneItem } from '../../types';

interface StagePipelineDetailProps {
  currentStage: string;
  milestones: MilestoneItem[];
}

export const StagePipelineDetail: React.FC<StagePipelineDetailProps> = ({
  currentStage,
  milestones,
}) => {
  const currentIndex = STAGE_ORDER.indexOf(currentStage as typeof STAGE_ORDER[number]);

  // Build a quick lookup: stage name → milestone date (match by label)
  const stageMilestoneDate: Record<string, string> = {};
  for (const m of milestones) {
    // Try to match milestone name against stage labels
    for (const stage of STAGE_ORDER) {
      const label = STAGE_LABELS[stage];
      if (m.name.includes(label) || label.includes(m.name)) {
        stageMilestoneDate[stage] = m.date;
        break;
      }
    }
  }

  return (
    <div
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl transition-colors duration-200 px-7 pt-6 pb-5"
      role="region"
      aria-label="阶段流程"
    >
      {/* Scrollable container */}
      <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {/* Track row */}
        <div className="flex items-start min-w-max py-2">
          {STAGE_ORDER.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <React.Fragment key={stage}>
                {/* Connector line before this node (except first) */}
                {index > 0 && (
                  <div
                    className={`flex-1 h-0.5 min-w-7 mt-[22px] rounded-sm transition-colors duration-300 ${
                      isCompleted || isCurrent ? 'bg-success' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Node wrapper */}
                <div className="flex flex-col items-center gap-2 min-w-[68px]">
                  {/* Circle node */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-success text-white'
                        : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                    aria-label={`${STAGE_LABELS[stage]}${
                      isCompleted ? '（已完成）' : isCurrent ? '（当前阶段）' : '（未开始）'
                    }`}
                  >
                    {isCompleted ? (
                      // Checkmark SVG for completed stages
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <polyline
                          points="3,8 6.5,11.5 13,5"
                          stroke="#fff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : isCurrent ? (
                      // Inner white pulse dot for current stage
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"
                        aria-hidden="true"
                      />
                    ) : (
                      // Index number for future stages
                      <span className="text-xs font-semibold" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Label + milestone date below node */}
                  <div className="flex flex-col items-center gap-0.5 text-center min-w-[60px]">
                    <span
                      className={`text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                        isCompleted
                          ? 'text-success font-semibold'
                          : isCurrent
                          ? 'text-primary font-bold'
                          : 'text-light-text-secondary dark:text-dark-text-secondary'
                      }`}
                    >
                      {STAGE_LABELS[stage]}
                    </span>
                    {stageMilestoneDate[stage] && (
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {stageMilestoneDate[stage]}
                      </span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StagePipelineDetail;
