import React from 'react';
import { X, Zap, FileText } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { WidgetRenderer, detectWidgetType } from './WidgetRenderer';
import { TaskListCard } from '../cards/TaskListCard';
import { ProgressCard } from '../cards/ProgressCard';
import { TableCard } from '../cards/TableCard';
import { KanbanMiniCard } from '../cards/KanbanMiniCard';
import { ChartCard } from '../cards/ChartCard';
import { FileCard } from '../cards/FileCard';
import { ReportCard } from '../cards/ReportCard';
import { ActionCard } from '../cards/ActionCard';
import { AlertCard } from '../cards/AlertCard';
import { DataCard } from '../cards/DataCard';

interface ArtifactContent {
  type: 'card' | 'text';
  card?: InteractiveCard;
  text?: string;
  title?: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactContent | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  data: '数据',
  action: '操作',
  alert: '告警',
  form: '表单',
  task_list: '任务列表',
  progress: '进度',
  table: '表格',
  kanban: '看板',
  chart: '图表',
  file: '文件',
  report: '报告',
};

const WIDGET_LABELS: Record<string, string> = {
  task_kanban: '任务看板',
  task_list: '任务列表',
  project_table: '项目表格',
  project_kanban: '项目看板',
  gantt: '甘特图',
  budget_overview: '预算概览',
  risk_heatmap: '风险热图',
  task_donut: '任务分布',
  progress_chart: '进度图表',
  stage_pipeline: '阶段管线',
  procurement_table: '采购管理',
  process_timeline: '过程记录',
};

/** Fallback expanded card for non-widget types */
function ExpandedCardFallback({ card }: { card: InteractiveCard }) {
  switch (card.type) {
    case 'task_list':
      return <TaskListCard card={card} compact={false} />;
    case 'progress':
      return <ProgressCard card={card} compact={false} />;
    case 'table':
      return <TableCard card={card} compact={false} />;
    case 'kanban':
      return <KanbanMiniCard card={card} compact={false} />;
    case 'chart':
      return <ChartCard card={card} compact={false} />;
    case 'file':
      return <FileCard card={card} />;
    case 'report':
      return <ReportCard card={card} compact={false} />;
    case 'action':
      return <ActionCard card={card} />;
    case 'alert':
      return <AlertCard card={card} />;
    default:
      return <DataCard card={card} />;
  }
}

/**
 * Renders rich text content with basic markdown formatting.
 */
function RichTextDisplay({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<div key={i} className="h-3" />);
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim()) || /^_{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-3 border-t border-[#E8ECF4]" />);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const className =
        level === 1
          ? 'text-lg font-bold mt-4 mb-2'
          : level === 2
            ? 'text-base font-bold mt-3 mb-1.5'
            : 'text-[15px] font-medium mt-2 mb-1';
      elements.push(
        <div key={i} className={`${className} text-light-text`}>
          {headerMatch[2]}
        </div>
      );
      continue;
    }

    // Bullet list
    if (/^[\s]*[-*•]\s+/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2.5 py-0.5 pl-1">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-[15px] text-light-text leading-relaxed">
            {line.replace(/^[\s]*[-*•]\s+/, '')}
          </span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^[\s]*(\d+)[.、]\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2.5 py-0.5 pl-1">
          <span className="shrink-0 w-6 h-6 rounded-full bg-[#EFF3F9] text-[11px] font-bold text-primary flex items-center justify-center mt-0.5">
            {numMatch[1]}
          </span>
          <span className="text-[15px] text-light-text leading-relaxed">{numMatch[2]}</span>
        </div>
      );
      continue;
    }

    // Bold text within line
    const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    elements.push(
      <p
        key={i}
        className="text-[15px] text-light-text leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifact, onClose }) => {
  if (!artifact) return null;

  // Text artifact
  if (artifact.type === 'text' && artifact.text) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-[#E8ECF4] animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8ECF4] shrink-0 bg-[#F4F6FC]">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[14px] font-medium text-light-text truncate">{artifact.title}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 uppercase tracking-wider bg-[#EFF3F9] text-light-text-secondary">
              <FileText size={9} />
              全文
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-light-text-secondary hover:bg-[#E8ECF4] hover:text-light-text transition-colors shrink-0 ml-2"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
          <RichTextDisplay content={artifact.text} />
        </div>
      </div>
    );
  }

  // Card artifact
  const card = artifact.card;
  if (!card) return null;

  const widgetType = detectWidgetType(card);
  const isWidget = widgetType !== null;
  const typeLabel = isWidget
    ? WIDGET_LABELS[widgetType] || TYPE_LABELS[card.type] || card.type
    : TYPE_LABELS[card.type] || card.type;

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E8ECF4] animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8ECF4] shrink-0 bg-[#F4F6FC]">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[14px] font-medium text-light-text truncate">{card.title}</h3>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[10px] font-medium shrink-0 uppercase tracking-wider ${
              isWidget ? 'bg-primary/10 text-primary' : 'bg-[#EFF3F9] text-light-text-secondary'
            }`}
          >
            {isWidget && <Zap size={9} />}
            {typeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-light-text-secondary hover:bg-[#E8ECF4] hover:text-light-text transition-colors shrink-0 ml-2"
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      {isWidget ? (
        <div className="flex-1 overflow-hidden">
          <WidgetRenderer card={card} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
          <ExpandedCardFallback card={card} />
          {card.content && card.type !== 'report' && card.type !== 'file' && (
            <div className="mt-4">
              <h4 className="text-[13px] font-medium text-light-text-secondary mb-2">详细说明</h4>
              <div className="text-[14px] text-light-text leading-relaxed whitespace-pre-wrap">
                {card.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
