import React, { useState } from 'react';
import type { ProjectRiskSummary } from '../../types';

interface RiskHeatmapProps {
  risks: ProjectRiskSummary[];
}

function getRiskBlockColor(score: number): string {
  if (score >= 70) return '#E2445C';        // red
  if (score >= 50) return '#FDAB3D';        // orange
  if (score >= 30) return '#FFD166';        // yellow
  return '#6BBF59';                          // green
}

function getRiskLabel(score: number): string {
  if (score >= 70) return '极高';
  if (score >= 50) return '高';
  if (score >= 30) return '中';
  return '低';
}

function truncateName(name: string, max = 10): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  risk: ProjectRiskSummary | null;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ risks }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    risk: null,
  });

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    risk: ProjectRiskSummary
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.risk-heatmap-container')?.getBoundingClientRect();
    if (!containerRect) return;

    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
      risk,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Sort by risk_score descending
  const sorted = [...risks].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div
      className="risk-heatmap-container relative bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="项目风险热力图"
    >
      <h2 className="text-base font-heading font-semibold flex-shrink-0">风险热力图</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-8 m-0 flex-1 flex items-center justify-center">
          暂无风险数据
        </p>
      ) : (
        <>
          {/* Risk block grid */}
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))' }}
            role="list"
          >
            {sorted.map((risk) => {
              const color = getRiskBlockColor(risk.risk_score);
              const label = getRiskLabel(risk.risk_score);

              return (
                <div
                  key={risk.project_id}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 border-[1.5px] rounded-[10px] cursor-default transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04] hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:scale-[1.04] focus-visible:shadow-md focus-visible:outline-none"
                  style={{
                    backgroundColor: `${color}22`,
                    borderColor: `${color}66`,
                  }}
                  role="listitem"
                  aria-label={`${risk.project_name}: 风险分 ${risk.risk_score}, ${label}风险`}
                  onMouseEnter={(e) => handleMouseEnter(e, risk)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={(e) => handleMouseEnter(e as unknown as React.MouseEvent<HTMLDivElement>, risk)}
                  onBlur={handleMouseLeave}
                  tabIndex={0}
                >
                  <span
                    className="text-[1.375rem] font-extrabold leading-none"
                    style={{ color }}
                  >
                    {risk.risk_score}
                  </span>
                  <span className="text-[0.6875rem] font-medium text-center leading-snug break-all">
                    {truncateName(risk.project_name)}
                  </span>
                  <span
                    className="text-[0.625rem] font-bold px-1.5 py-px rounded-full tracking-wide"
                    style={{ color, backgroundColor: `${color}18` }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            className="flex items-center gap-4 flex-wrap mt-1"
            aria-label="风险等级图例"
          >
            {[
              { label: '低 (0-30)', color: '#6BBF59' },
              { label: '中 (30-50)', color: '#FFD166' },
              { label: '高 (50-70)', color: '#FDAB3D' },
              { label: '极高 (70+)', color: '#E2445C' },
            ].map(({ label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Hover tooltip */}
          {tooltip.visible && tooltip.risk && (
            <div
              className="absolute z-50 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-3 py-2 shadow-lg min-w-[160px] max-w-[240px] pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translateX(-50%) translateY(-100%)',
              }}
              role="tooltip"
              aria-live="polite"
            >
              <div className="text-sm font-semibold mb-1">
                {tooltip.risk.project_name}
              </div>
              <div className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary mb-1">
                风险分: <strong>{tooltip.risk.risk_score}</strong>
              </div>
              {tooltip.risk.top_risk && (
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-snug border-t border-light-border dark:border-dark-border pt-1 mt-0.5">
                  {tooltip.risk.top_risk}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
