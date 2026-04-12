import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';
import type { DashboardMetrics } from '../../types';

export interface StatCardProps {
  label: string;
  value?: string | number;
  trend?: number;
  icon?: React.ReactNode | string;
  iconColor?: string;
  iconBg?: string;
  metric?: string;
  /** Chat injection data */
  data?: { label?: string; value?: string | number; trend?: number };
}

const StatCard: React.FC<StatCardProps> = (props) => {
  const d = props.data;
  const label = d?.label ?? props.label;
  const trend = d?.trend ?? props.trend;
  const icon = props.icon;
  const iconBg = props.iconBg;
  const metric = props.metric;

  const metrics = useDashboardStore((s) => s.metrics);
  const fetchMetrics = useDashboardStore((s) => s.fetchMetrics);

  React.useEffect(() => {
    if (metric && !metrics) fetchMetrics();
  }, [metric, metrics, fetchMetrics]);

  let value: string | number = d?.value ?? props.value ?? '';
  if (metric && metrics) {
    const mv = metrics[metric as keyof DashboardMetrics];
    if (typeof mv === 'number') value = mv;
  }

  const resolvedIcon =
    typeof icon === 'string'
      ? (LucideIcons[icon as keyof typeof LucideIcons] as React.FC<any>)
      : null;

  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="relative overflow-hidden bg-white border border-[#E8ECF4] rounded-[10px] p-5">
      <div className="flex items-start justify-between mb-3">
        {/* Left: Label + Value */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] text-light-text-secondary mb-1 leading-snug truncate">
            {label}
          </p>
          <h3 className="text-[26px] font-medium text-light-text leading-none">{value}</h3>
        </div>

        {/* Right: Icon */}
        {(typeof icon === 'string' && resolvedIcon) || (icon && typeof icon !== 'string') ? (
          <div
            className="w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0 ml-3"
            style={{ backgroundColor: `${iconBg || '#00C875'}1A` }}
          >
            <span style={{ color: iconBg || '#00C875' }}>
              {typeof icon === 'string' && resolvedIcon
                ? React.createElement(resolvedIcon, { size: 22 })
                : icon}
            </span>
          </div>
        ) : null}
      </div>

      {/* Trend badge */}
      {trend !== undefined && (
        <div>
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium ${
              isPositive ? 'bg-[#2ED47E1A] text-[#2ED47E]' : 'bg-[#E74C3C1A] text-[#E74C3C]'
            }`}
          >
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
