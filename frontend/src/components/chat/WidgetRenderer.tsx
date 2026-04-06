import React from 'react';
import type {
  InteractiveCard,
  TaskWithProject,
  Project,
  BudgetSummaryItem,
  ProjectRiskSummary,
  ProcurementPackage,
  ProcessRecord,
} from '../../types';
import WidgetHost from '../../widgets/WidgetHost';
import { registry } from '../../widgets/registry';

// ── Data transformers ──────────────────────────────────────────────────────
// These normalize the semi-structured data coming from chat agents into the
// shapes expected by each registered widget's props.

function toTasks(data: Record<string, any>): TaskWithProject[] {
  const raw = data.tasks || data.items || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((t: any, i: number) => ({
    id: t.id || `chat-task-${i}`,
    project_id: t.project_id || '',
    name: t.name || t.title || `任务${i + 1}`,
    assignee: t.assignee || null,
    status: t.status || 'todo',
    priority: t.priority || 'medium',
    due_date: t.due_date || null,
    description: t.description || '',
    project_name: t.project_name || t.project || '',
  }));
}

function toProjects(data: Record<string, any>): Project[] {
  const raw = data.projects || data.items || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((p: any, i: number) => ({
    id: p.id || `chat-proj-${i}`,
    name: p.name || p.label || `项目${i + 1}`,
    project_type: p.project_type || p.type || '信息化',
    stage: p.stage || 'design',
    status: p.status || 'active',
    status_label: p.status_label || '',
    progress_pct: p.progress_pct ?? p.progress ?? p.value ?? 0,
    due_date: p.due_date || null,
    budget: p.budget || null,
    team_size: p.team_size ?? 0,
    team_members: p.team_members || [],
  }));
}

function toBudgetItems(data: Record<string, any>): BudgetSummaryItem[] {
  const raw = data.items || data.budgets || data.projects || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((b: any, i: number) => ({
    project_id: b.project_id || `chat-bgt-${i}`,
    project_name: b.project_name || b.name || b.label || '',
    budget_amount: b.budget_amount ?? b.budget ?? b.total ?? null,
    actual_spend: b.actual_spend ?? b.spent ?? b.actual ?? null,
  }));
}

function toRisks(data: Record<string, any>): ProjectRiskSummary[] {
  const raw = data.risks || data.items || data.projects || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any, i: number) => ({
    project_id: r.project_id || `chat-risk-${i}`,
    project_name: r.project_name || r.name || r.label || '',
    risk_score: r.risk_score ?? r.score ?? 0,
    risk_level: r.risk_level || r.level || 'low',
    top_risk: r.top_risk || r.description || '',
  }));
}

function toTaskDistribution(data: Record<string, any>): {
  distribution: Record<string, number>;
  total: number;
} {
  if (data.distribution) {
    const total = Object.values(data.distribution as Record<string, number>).reduce(
      (s, v) => s + v,
      0
    );
    return { distribution: data.distribution, total };
  }
  const distribution: Record<string, number> = {};
  let total = 0;
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'number' && !['severity', 'total'].includes(key)) {
      distribution[key] = val;
      total += val;
    }
  }
  return { distribution, total: data.total || total };
}

function toStageDistribution(data: Record<string, any>): Record<string, number> {
  if (data.stages) return data.stages;
  if (data.distribution) return data.distribution;
  const dist: Record<string, number> = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'number') dist[key] = val;
  }
  return dist;
}

function toProcurementPackages(data: Record<string, any>): ProcurementPackage[] {
  const raw = data.packages || data.procurement || data.items || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((p: any, i: number) => ({
    id: p.id || `chat-proc-${i}`,
    project_id: p.project_id || '',
    name: p.name || p.title || `采购包${i + 1}`,
    category: p.category || '',
    supplier: p.supplier || null,
    budget_amount: p.budget_amount ?? p.budget ?? null,
    actual_amount: p.actual_amount ?? p.actual ?? null,
    status: p.status || 'planning',
    plan_date: p.plan_date || null,
    arrival_date: p.arrival_date || null,
    responsible: p.responsible || null,
    notes: p.notes || '',
  }));
}

function toProcessRecords(data: Record<string, any>): ProcessRecord[] {
  const raw = data.records || data.processes || data.items || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any, i: number) => ({
    id: r.id || `chat-prec-${i}`,
    project_id: r.project_id || '',
    record_type: r.record_type || r.type || 'daily_log',
    title: r.title || r.name || `记录${i + 1}`,
    date: r.date || '',
    author: r.author || '',
    content: r.content || '',
    status: r.status || 'normal',
    attachments: r.attachments || [],
    related_stage: r.related_stage || '',
  }));
}

// ── Detect which widget a card should render ───────────────────────────────
// Heuristic fallback when card.widget_type is not set.

export type WidgetType =
  | 'task_kanban'
  | 'task_list'
  | 'project_table'
  | 'project_kanban'
  | 'gantt'
  | 'budget_overview'
  | 'risk_heatmap'
  | 'task_donut'
  | 'project_progress'
  | 'stage_pipeline'
  | 'procurement_table'
  | 'process_timeline'
  | null;

// eslint-disable-next-line react-refresh/only-export-components
export function detectWidgetType(card: InteractiveCard): WidgetType {
  const d = card.data || {};
  const t = card.type;

  if ((t === 'task_list' || t === 'kanban') && (d.tasks || d.items)) {
    const items = d.tasks || d.items;
    if (Array.isArray(items) && items.length > 0 && items[0].status !== undefined) {
      return t === 'kanban' ? 'task_kanban' : 'task_list';
    }
  }

  if (t === 'progress' && (d.projects || d.items)) {
    const items = d.projects || d.items;
    if (
      Array.isArray(items) &&
      items.length > 0 &&
      (items[0].progress !== undefined || items[0].progress_pct !== undefined)
    ) {
      return 'project_progress';
    }
  }

  if (t === 'table' && d.projects) return 'project_table';

  if (t === 'chart' && (d.distribution || d.chart_type === 'donut')) return 'task_donut';

  if (
    (t === 'chart' || t === 'table' || t === 'data') &&
    (d.budgets || (d.items && d.items[0]?.budget_amount !== undefined))
  ) {
    return 'budget_overview';
  }

  if (
    (t === 'alert' || t === 'table' || t === 'data') &&
    (d.risks || (d.items && d.items[0]?.risk_score !== undefined))
  ) {
    return 'risk_heatmap';
  }

  if ((t === 'chart' || t === 'data') && (d.stages || d.stage_distribution))
    return 'stage_pipeline';

  if (t === 'kanban' && d.projects) return 'project_kanban';

  if (
    d.packages ||
    d.procurement ||
    ((t === 'table' || t === 'data') &&
      d.items &&
      d.items[0]?.budget_amount !== undefined &&
      d.items[0]?.category !== undefined)
  ) {
    return 'procurement_table';
  }

  if (
    d.records ||
    d.processes ||
    ((t === 'data' || t === 'table') && d.items && d.items[0]?.record_type !== undefined)
  ) {
    return 'process_timeline';
  }

  return null;
}

// ── Transform card data to widget-expected shape ───────────────────────────

function transformCardData(widgetType: string, data: Record<string, any>): any {
  switch (widgetType) {
    case 'task_kanban':
    case 'task_list':
      return { tasks: toTasks(data) };

    case 'project_table':
    case 'project_kanban':
    case 'gantt':
      return { projects: toProjects(data) };

    case 'project_progress':
      return { projects: toProjects(data) };

    case 'budget_overview':
      return { items: toBudgetItems(data) };

    case 'risk_heatmap':
      return { risks: toRisks(data) };

    case 'task_donut': {
      const { distribution, total } = toTaskDistribution(data);
      return { distribution, totalTasks: total };
    }

    case 'stage_pipeline':
      return { stageDistribution: toStageDistribution(data) };

    case 'procurement_table':
      return { packages: toProcurementPackages(data) };

    case 'process_timeline':
      return { records: toProcessRecords(data), project_id: data.project_id };

    default:
      return data;
  }
}

// ── Fallback view for unrecognized cards ───────────────────────────────────

function FallbackCardView({ card }: { card: InteractiveCard }) {
  return (
    <div className="p-4 rounded-lg border border-[#E8E8E8]  bg-[#F5F6FA] ">
      <h4 className="text-sm font-semibold text-[#333]  mb-2">{card.title}</h4>
      {card.content && <p className="text-xs text-[#6C7688] ">{card.content}</p>}
      {card.data && (
        <pre className="mt-2 text-[11px] text-[#6C7688]  overflow-auto max-h-40 bg-[#F0F2F8]  rounded p-2">
          {JSON.stringify(card.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Widget Renderer ────────────────────────────────────────────────────────

interface WidgetRendererProps {
  card: InteractiveCard;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ card }) => {
  const widgetType = card.widget_type ?? detectWidgetType(card);

  if (!widgetType || !registry.has(widgetType)) {
    return <FallbackCardView card={card} />;
  }

  const transformedData = transformCardData(widgetType, card.data || {});

  return <WidgetHost type={widgetType} data={transformedData} showHeader={true} />;
};
