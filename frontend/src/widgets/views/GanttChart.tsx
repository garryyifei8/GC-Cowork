import React, { useState, useMemo } from 'react';
import { EmptyState } from '../atomic';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_WIDTH = 120;

function getMonthsBetween(start: Date, end: Date): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push({
      key: `${current.getFullYear()}-${current.getMonth()}`,
      label: `${current.getFullYear()}年${current.getMonth() + 1}月`,
    });
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return '#00C875';
    case 'risk':
      return '#E74C3C';
    case 'planning':
      return '#0086C0';
    case 'completed':
      return '#919AA3';
    default:
      return '#2ED47E';
  }
}

// ---------------------------------------------------------------------------
// Dependency interface
// ---------------------------------------------------------------------------

interface Dependency {
  from: string; // project id
  to: string; // project id
  type: 'FS' | 'FF' | 'SS' | 'SF';
}

// Auto-generate FS dependencies based on project stage ordering
function inferDependencies(projects: Project[]): Dependency[] {
  const deps: Dependency[] = [];
  const stageOrder = [
    'initiation',
    'bidding',
    'contract',
    'design',
    'procurement',
    'construction',
    'acceptance',
    'settlement',
    'archived',
  ];

  // Group by similar project types; link sequential projects by stage
  const sorted = [...projects].sort((a, b) => {
    const ai = stageOrder.indexOf(a.stage);
    const bi = stageOrder.indexOf(b.stage);
    return ai - bi;
  });

  // Create dependencies between projects that share sequential stages
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const aIdx = stageOrder.indexOf(a.stage);
    const bIdx = stageOrder.indexOf(b.stage);
    // Only create FS dependency if stages are sequential
    if (bIdx > aIdx && bIdx - aIdx <= 2) {
      deps.push({ from: a.id, to: b.id, type: 'FS' });
    }
  }

  return deps;
}

// ---------------------------------------------------------------------------
// Critical path detection (simplified: longest chain)
// ---------------------------------------------------------------------------

function findCriticalPath(projects: Project[], deps: Dependency[]): Set<string> {
  const adjList: Record<string, string[]> = {};
  for (const d of deps) {
    if (!adjList[d.from]) adjList[d.from] = [];
    adjList[d.from].push(d.to);
  }

  // Find longest path using DFS
  const memo: Record<string, number> = {};
  const pathParent: Record<string, string | null> = {};

  function dfs(id: string): number {
    if (memo[id] !== undefined) return memo[id];
    const neighbors = adjList[id] || [];
    let maxLen = 0;
    let bestChild: string | null = null;
    for (const next of neighbors) {
      const len = 1 + dfs(next);
      if (len > maxLen) {
        maxLen = len;
        bestChild = next;
      }
    }
    memo[id] = maxLen;
    if (bestChild) pathParent[id] = bestChild;
    return maxLen;
  }

  let maxPath = 0;
  let startNode = '';
  for (const p of projects) {
    const len = dfs(p.id);
    if (len > maxPath) {
      maxPath = len;
      startNode = p.id;
    }
  }

  const critical = new Set<string>();
  let current: string | null = startNode;
  while (current) {
    critical.add(current);
    current = pathParent[current] ?? null;
  }

  return critical;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GanttChartProps {
  data?: { projects?: Project[] };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const GanttChart: React.FC<GanttChartProps> = ({ data }) => {
  const storeProjects = useProjectStore((s) => s.projects);
  const projects = data?.projects ?? storeProjects;
  const [showDeps, setShowDeps] = useState(true);
  const [showCritical, setShowCritical] = useState(false);

  const dependencies = useMemo(() => inferDependencies(projects), [projects]);
  const criticalPath = useMemo(
    () => (showCritical ? findCriticalPath(projects, dependencies) : new Set<string>()),
    [projects, dependencies, showCritical]
  );

  if (projects.length === 0) {
    return <EmptyState icon="calendar" title="暂无项目" description="添加项目以查看甘特图" />;
  }

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const dueDates = projects
    .map((p) => (p.due_date ? new Date(p.due_date) : null))
    .filter((d): d is Date => d !== null);

  const maxDue =
    dueDates.length > 0
      ? new Date(Math.max(...dueDates.map((d) => d.getTime())))
      : new Date(now.getFullYear(), now.getMonth() + 6, 1);

  const rangeEnd = new Date(maxDue.getFullYear(), maxDue.getMonth() + 2, 1);
  const months = getMonthsBetween(rangeStart, rangeEnd);
  const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const totalWidth = months.length * MONTH_WIDTH;
  const ROW_HEIGHT = 40;

  const getBarMetrics = (project: Project) => {
    const endDate = project.due_date
      ? new Date(project.due_date)
      : new Date(now.getFullYear(), now.getMonth() + 3, 1);

    const totalDuration = 180;
    const elapsedDays = (project.progress_pct / 100) * totalDuration;
    const startDate = new Date(now.getTime() - elapsedDays * 24 * 60 * 60 * 1000);

    const startOffset = Math.max(
      0,
      (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const endOffset = Math.min(
      totalDays,
      (endDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const barWidth = Math.max(30, endOffset - startOffset);

    return {
      leftPct: (startOffset / totalDays) * 100,
      widthPct: (barWidth / totalDays) * 100,
      startPx: (startOffset / totalDays) * totalWidth,
      endPx: ((startOffset + barWidth) / totalDays) * totalWidth,
      color: getStatusColor(project.status),
    };
  };

  const todayOffset = (now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const todayPct = (todayOffset / totalDays) * 100;

  // Build project index for dependency arrows
  const projectIndex: Record<string, number> = {};
  projects.forEach((p, i) => {
    projectIndex[p.id] = i;
  });

  return (
    <div className="bg-white dark:bg-gray-800 border border-[#E8ECF4] dark:border-gray-700 rounded-[10px] transition-colors duration-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#E8ECF4] dark:border-gray-700 bg-[#EFF3F9] dark:bg-gray-900/50">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 mr-auto">
          甘特图
        </span>
        <label className="flex items-center gap-1.5 text-xs text-[#919AA3] cursor-pointer">
          <input
            type="checkbox"
            checked={showDeps}
            onChange={(e) => setShowDeps(e.target.checked)}
            className="rounded border-[#E8ECF4]"
          />
          依赖关系
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[#919AA3] cursor-pointer">
          <input
            type="checkbox"
            checked={showCritical}
            onChange={(e) => setShowCritical(e.target.checked)}
            className="rounded border-[#E8ECF4]"
          />
          关键路径
        </label>
      </div>

      <div className="overflow-x-auto">
        {/* Header */}
        <div className="flex items-center bg-[#EFF3F9] dark:bg-gray-900/50 border-b border-[#E8ECF4] dark:border-gray-700 sticky top-0 z-10">
          <div className="w-48 shrink-0 px-4 py-3 text-xs font-semibold text-[#919AA3] dark:text-gray-400 border-r border-[#E8ECF4] dark:border-gray-700">
            项目
          </div>
          <div className="flex" style={{ width: totalWidth }}>
            {months.map((m) => (
              <div
                key={m.key}
                className="px-2 py-3 text-xs font-medium text-[#919AA3] dark:text-gray-400 text-center border-r border-[#E8ECF4] dark:border-gray-700 shrink-0"
                style={{ width: MONTH_WIDTH }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows with SVG overlay for dependencies */}
        <div className="relative">
          {projects.map((project, _rowIndex) => {
            const bar = getBarMetrics(project);
            const isCritical = criticalPath.has(project.id);
            return (
              <div
                key={project.id}
                className="flex items-center border-b border-[#E8ECF4]/50 dark:border-gray-700/50 hover:bg-[#EFF3F9] dark:hover:bg-gray-800/50 last:border-b-0"
              >
                <div className="w-48 shrink-0 px-4 py-3 border-r border-[#E8ECF4] dark:border-gray-700 flex flex-col justify-center gap-0.5">
                  <span
                    className={`text-sm font-medium truncate ${isCritical ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}
                  >
                    {isCritical && '🔴 '}
                    {project.name}
                  </span>
                  <span className="text-xs text-[#919AA3] dark:text-gray-400">
                    {project.status_label}
                  </span>
                </div>
                <div
                  className="flex-1 relative shrink-0"
                  style={{ width: totalWidth, height: ROW_HEIGHT }}
                >
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-60"
                    style={{ left: `${todayPct}%`, borderLeft: '2px dashed' }}
                  />
                  {/* Bar */}
                  <div
                    className={`absolute top-1 h-8 rounded-md flex items-center justify-end px-2 transition-opacity min-w-[40px] ${isCritical ? 'opacity-100 ring-2 ring-red-400' : 'opacity-90 hover:opacity-100'}`}
                    style={{
                      left: `${bar.leftPct}%`,
                      width: `${bar.widthPct}%`,
                      backgroundColor: bar.color,
                    }}
                  >
                    <span className="text-xs font-semibold text-white whitespace-nowrap">
                      {project.progress_pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* SVG overlay for dependency arrows */}
          {showDeps && dependencies.length > 0 && (
            <svg
              className="absolute top-0 left-48 pointer-events-none"
              style={{ width: totalWidth, height: projects.length * ROW_HEIGHT }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#919AA3" />
                </marker>
                <marker
                  id="arrowhead-critical"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#E74C3C" />
                </marker>
              </defs>
              {dependencies.map((dep, i) => {
                const fromIdx = projectIndex[dep.from];
                const toIdx = projectIndex[dep.to];
                if (fromIdx === undefined || toIdx === undefined) return null;

                const fromBar = getBarMetrics(projects[fromIdx]);
                const toBar = getBarMetrics(projects[toIdx]);

                // FS: from end of source to start of target
                const x1 = fromBar.endPx;
                const y1 = fromIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                const x2 = toBar.startPx;
                const y2 = toIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

                const isCriticalDep = criticalPath.has(dep.from) && criticalPath.has(dep.to);
                const strokeColor = isCriticalDep && showCritical ? '#E74C3C' : '#919AA3';
                const strokeWidth = isCriticalDep && showCritical ? 2 : 1.5;
                const marker =
                  isCriticalDep && showCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)';

                // Bezier curve for smooth arrow
                const midX = (x1 + x2) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isCriticalDep ? undefined : '4 2'}
                    markerEnd={marker}
                    opacity={0.7}
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Legend */}
      {showDeps && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#E8ECF4] dark:border-gray-700 text-xs text-[#919AA3]">
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 bg-[#919AA3] inline-block"
              style={{ borderTop: '1.5px dashed #919AA3' }}
            />
            依赖关系 (FS)
          </span>
          {showCritical && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-red-500 inline-block" />
              关键路径
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 opacity-60 inline-block" />
            今日
          </span>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
