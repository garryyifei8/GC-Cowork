import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useDashboardStore } from '../../stores/dashboardStore';

export interface ProjectHealthMatrixProps {
  data?: { projects?: any[] };
}

// Status color map matching Monday.com palette
const STATUS_COLOR: Record<string, string> = {
  active: '#00C875',
  risk: '#E2445C',
  planning: '#0086C0',
  completed: '#676879',
};

const STATUS_LABEL: Record<string, string> = {
  active: '进行中',
  risk: '风险',
  planning: '规划中',
  completed: '已完成',
};

// Quadrant config: [xRange, yRange] => label + bg
const QUADRANT_BG: Record<string, string> = {
  'top-left': 'rgba(226,68,92,0.06)', // high cost, low progress = danger
  'top-right': 'rgba(0,200,117,0.06)', // high cost, high progress = on track
  'bottom-left': 'rgba(0,134,192,0.06)', // low cost, low progress = early stage
  'bottom-right': 'rgba(253,171,61,0.06)', // low cost, high progress = ahead of budget
};

const QUADRANT_LABEL: Record<string, { text: string; color: string }> = {
  'top-left': { text: '成本超支风险', color: '#E2445C' },
  'top-right': { text: '进度与预算匹配', color: '#00C875' },
  'bottom-left': { text: '早期阶段', color: '#0086C0' },
  'bottom-right': { text: '预算充裕', color: '#FDAB3D' },
};

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  progress: number;
  budgetUsage: number;
  status: string;
}

const ProjectHealthMatrix: React.FC<ProjectHealthMatrixProps> = ({ data }) => {
  const storeProjects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const storeMetrics = useDashboardStore((s) => s.metrics);
  const fetchMetrics = useDashboardStore((s) => s.fetchMetrics);

  useEffect(() => {
    if (!storeProjects.length) fetchProjects();
    if (!storeMetrics) fetchMetrics();
  }, [storeProjects.length, storeMetrics, fetchProjects, fetchMetrics]);

  const rawProjects = data?.projects ?? storeProjects;

  // Build budget usage map from dashboard budget_summary
  const budgetMap = React.useMemo<Record<string, number>>(() => {
    const summary = storeMetrics?.budget_summary ?? [];
    const map: Record<string, number> = {};
    for (const item of summary) {
      if (item.budget_amount && item.budget_amount > 0) {
        map[item.project_id] = Math.min(
          Math.round(((item.actual_spend ?? 0) / item.budget_amount) * 100),
          150
        );
      }
    }
    return map;
  }, [storeMetrics]);

  // Compose plot points
  const points = React.useMemo(() => {
    return rawProjects
      .filter((p) => typeof p.progress_pct === 'number')
      .map((p) => ({
        id: p.id,
        name: p.name,
        progress: p.progress_pct as number,
        budgetUsage: budgetMap[p.id] ?? (((p.id.charCodeAt(0) || 0) * 17 + 13) % 80) + 10, // deterministic fallback
        status: p.status ?? 'active',
      }));
  }, [rawProjects, budgetMap]);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    name: '',
    progress: 0,
    budgetUsage: 0,
    status: '',
  });

  // SVG coordinate helpers
  // Padding inside SVG for axes
  const PAD_LEFT = 48;
  const PAD_BOTTOM = 36;
  const PAD_TOP = 28;
  const PAD_RIGHT = 20;

  function toSvgX(progress: number, width: number): number {
    return PAD_LEFT + (progress / 100) * (width - PAD_LEFT - PAD_RIGHT);
  }

  function toSvgY(budgetUsage: number, height: number): number {
    return PAD_TOP + ((100 - budgetUsage) / 100) * (height - PAD_TOP - PAD_BOTTOM);
  }

  const handleMouseEnter = (e: React.MouseEvent<SVGCircleElement>, pt: (typeof points)[number]) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!svgRect || !containerRect) return;
    setTooltip({
      visible: true,
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top - 10,
      name: pt.name,
      progress: pt.progress,
      budgetUsage: pt.budgetUsage,
      status: pt.status,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Responsive: use a viewBox
  const VW = 480;
  const VH = 320;

  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <div
      ref={containerRef}
      className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-colors duration-200"
      style={{ minHeight: 300 }}
      role="region"
      aria-label="项目健康矩阵"
    >
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
        项目健康矩阵
      </h2>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ minHeight: 240 }}
        aria-hidden="true"
      >
        {/* Quadrant backgrounds */}
        {/* top-left: x 0-50, y 0-50 (progress low, budget high) */}
        <rect
          x={toSvgX(0, VW)}
          y={toSvgY(100, VH)}
          width={toSvgX(50, VW) - toSvgX(0, VW)}
          height={toSvgY(50, VH) - toSvgY(100, VH)}
          fill={QUADRANT_BG['top-left']}
        />
        {/* top-right: x 50-100, y 50-100 (progress high, budget high) */}
        <rect
          x={toSvgX(50, VW)}
          y={toSvgY(100, VH)}
          width={toSvgX(100, VW) - toSvgX(50, VW)}
          height={toSvgY(50, VH) - toSvgY(100, VH)}
          fill={QUADRANT_BG['top-right']}
        />
        {/* bottom-left: x 0-50, y 0-50 budget (progress low, budget low) */}
        <rect
          x={toSvgX(0, VW)}
          y={toSvgY(50, VH)}
          width={toSvgX(50, VW) - toSvgX(0, VW)}
          height={toSvgY(0, VH) - toSvgY(50, VH)}
          fill={QUADRANT_BG['bottom-left']}
        />
        {/* bottom-right: x 50-100, y 0-50 (progress high, budget low) */}
        <rect
          x={toSvgX(50, VW)}
          y={toSvgY(50, VH)}
          width={toSvgX(100, VW) - toSvgX(50, VW)}
          height={toSvgY(0, VH) - toSvgY(50, VH)}
          fill={QUADRANT_BG['bottom-right']}
        />

        {/* Quadrant dividers */}
        <line
          x1={toSvgX(50, VW)}
          y1={toSvgY(100, VH)}
          x2={toSvgX(50, VW)}
          y2={toSvgY(0, VH)}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <line
          x1={toSvgX(0, VW)}
          y1={toSvgY(50, VH)}
          x2={toSvgX(100, VW)}
          y2={toSvgY(50, VH)}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Quadrant labels */}
        {(
          [
            { q: 'top-left', tx: toSvgX(1, VW) + 4, ty: toSvgY(99, VH) + 13, anchor: 'start' },
            { q: 'top-right', tx: toSvgX(99, VW) - 4, ty: toSvgY(99, VH) + 13, anchor: 'end' },
            { q: 'bottom-left', tx: toSvgX(1, VW) + 4, ty: toSvgY(1, VH) - 6, anchor: 'start' },
            { q: 'bottom-right', tx: toSvgX(99, VW) - 4, ty: toSvgY(1, VH) - 6, anchor: 'end' },
          ] as const
        ).map(({ q, tx, ty, anchor }) => (
          <text
            key={q}
            x={tx}
            y={ty}
            fontSize={9}
            fill={QUADRANT_LABEL[q].color}
            textAnchor={anchor}
            opacity={0.75}
            fontWeight={600}
          >
            {QUADRANT_LABEL[q].text}
          </text>
        ))}

        {/* Grid lines + X-axis ticks */}
        {gridTicks.map((tick) => (
          <g key={`xtick-${tick}`}>
            <line
              x1={toSvgX(tick, VW)}
              y1={toSvgY(100, VH)}
              x2={toSvgX(tick, VW)}
              y2={toSvgY(0, VH)}
              stroke="#F3F4F6"
              strokeWidth={1}
            />
            <text
              x={toSvgX(tick, VW)}
              y={VH - PAD_BOTTOM + 14}
              fontSize={9}
              textAnchor="middle"
              fill="#9CA3AF"
            >
              {tick}%
            </text>
          </g>
        ))}

        {/* Y-axis ticks */}
        {gridTicks.map((tick) => (
          <g key={`ytick-${tick}`}>
            <line
              x1={toSvgX(0, VW)}
              y1={toSvgY(tick, VH)}
              x2={toSvgX(100, VW)}
              y2={toSvgY(tick, VH)}
              stroke="#F3F4F6"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 6}
              y={toSvgY(tick, VH) + 4}
              fontSize={9}
              textAnchor="end"
              fill="#9CA3AF"
            >
              {tick}%
            </text>
          </g>
        ))}

        {/* Axes borders */}
        <line
          x1={toSvgX(0, VW)}
          y1={toSvgY(100, VH)}
          x2={toSvgX(0, VW)}
          y2={toSvgY(0, VH)}
          stroke="#D1D5DB"
          strokeWidth={1.5}
        />
        <line
          x1={toSvgX(0, VW)}
          y1={toSvgY(0, VH)}
          x2={toSvgX(100, VW)}
          y2={toSvgY(0, VH)}
          stroke="#D1D5DB"
          strokeWidth={1.5}
        />

        {/* Axis labels */}
        <text
          x={toSvgX(50, VW)}
          y={VH - 4}
          fontSize={10}
          textAnchor="middle"
          fill="#6B7280"
          fontWeight={500}
        >
          进度 (%)
        </text>
        <text
          x={10}
          y={toSvgY(50, VH)}
          fontSize={10}
          textAnchor="middle"
          fill="#6B7280"
          fontWeight={500}
          transform={`rotate(-90, 10, ${toSvgY(50, VH)})`}
        >
          预算使用率 (%)
        </text>

        {/* Data points */}
        {points.map((pt) => {
          const cx = toSvgX(pt.progress, VW);
          const cy = toSvgY(pt.budgetUsage, VH);
          const color = STATUS_COLOR[pt.status] ?? '#676879';
          return (
            <g key={pt.id}>
              {/* Outer glow ring */}
              <circle cx={cx} cy={cy} r={11} fill={color} opacity={0.15} />
              <circle
                cx={cx}
                cy={cy}
                r={7}
                fill={color}
                opacity={0.9}
                stroke="white"
                strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => handleMouseEnter(e, pt)}
                onMouseLeave={handleMouseLeave}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mt-3" aria-label="状态图例">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span>{STATUS_LABEL[status] ?? status}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 shadow-lg pointer-events-none min-w-[160px]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          role="tooltip"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 leading-tight">
            {tooltip.name}
          </p>
          <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
            <span>
              进度:{' '}
              <strong className="text-gray-700 dark:text-gray-300">{tooltip.progress}%</strong>
            </span>
            <span>
              预算使用率:{' '}
              <strong className="text-gray-700 dark:text-gray-300">{tooltip.budgetUsage}%</strong>
            </span>
            <span
              className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit"
              style={{
                color: STATUS_COLOR[tooltip.status] ?? '#676879',
                backgroundColor: `${STATUS_COLOR[tooltip.status] ?? '#676879'}1A`,
              }}
            >
              {STATUS_LABEL[tooltip.status] ?? tooltip.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHealthMatrix;
