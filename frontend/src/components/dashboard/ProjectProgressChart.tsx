import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';
import type { Project } from '../../types';

interface ProjectProgressChartProps {
  projects: Project[];
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return '#00C875'; // green
  if (pct >= 40) return '#FDAB3D'; // yellow
  return '#E2445C';               // red
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { value, payload: data } = payload[0];
  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-3 shadow-lg text-sm max-w-[200px]">
      <div className="font-semibold mb-0.5">{data.name}</div>
      <div>进度: <strong>{Math.round(value)}%</strong></div>
    </div>
  );
};

// Truncate project name for the Y axis
function truncate(str: string, maxLen = 8): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

export const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ projects }) => {
  // Sort descending by progress so the most-done ones appear at top
  const data = [...projects]
    .sort((a, b) => (b.progress_pct ?? 0) - (a.progress_pct ?? 0))
    .slice(0, 8) // show at most 8 bars to avoid overcrowding
    .map((p) => ({
      name: p.name,
      shortName: truncate(p.name),
      progress: Math.min(Math.max(p.progress_pct ?? 0, 0), 100),
    }));

  const hasData = data.length > 0;

  return (
    <div
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="项目进度对比柱状图"
    >
      <h2 className="text-base font-heading font-semibold flex-shrink-0">项目进度对比</h2>

      {!hasData ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-8 m-0 flex-1 flex items-center justify-center">
          暂无项目数据
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 32)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 36, bottom: 4, left: 8 }}
            aria-label="项目进度条形图"
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={72}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107,191,89,0.06)' }} />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={getProgressColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
