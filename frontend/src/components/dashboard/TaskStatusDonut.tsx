import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../utils/constants';

interface TaskStatusDonutProps {
  distribution: Record<string, number>;
  totalTasks: number;
}

const STATUS_ORDER = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { label: string } }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name: _name, value, payload: data } = payload[0];
  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <strong>{data.label}</strong>: {value} 个
    </div>
  );
};

export const TaskStatusDonut: React.FC<TaskStatusDonutProps> = ({
  distribution,
  totalTasks,
}) => {
  const chartData = STATUS_ORDER.map((key) => ({
    key,
    label: TASK_STATUS_LABELS[key] ?? key,
    value: distribution[key] ?? 0,
    color: TASK_STATUS_COLORS[key] ?? '#999',
  })).filter((d) => d.value > 0);

  const hasData = chartData.length > 0;

  return (
    <div
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 flex flex-col gap-3.5 min-h-[220px]"
      role="region"
      aria-label="任务状态分布环形图"
    >
      <h2 className="text-base font-heading font-semibold flex-shrink-0">任务状态</h2>

      {!hasData ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-8 m-0 flex-1 flex items-center justify-center">
          暂无任务数据
        </p>
      ) : (
        <>
          {/* Donut chart with centered total */}
          <div className="relative flex justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  aria-label="任务状态环形图"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <span className="text-2xl font-extrabold leading-none">{totalTasks}</span>
              <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium">
                任务
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5" role="list">
            {STATUS_ORDER.map((key) => {
              const val = distribution[key] ?? 0;
              const color = TASK_STATUS_COLORS[key] ?? '#999';
              const label = TASK_STATUS_LABELS[key] ?? key;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary"
                  role="listitem"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-[0.8125rem]">{label}</span>
                  <span className="font-semibold text-[0.8125rem] min-w-[24px] text-right">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
