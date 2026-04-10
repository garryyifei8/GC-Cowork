import React from 'react';
import { Maximize2, Zap } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { detectWidgetType } from '../chat/WidgetRenderer';
import { registry } from '../../widgets/registry';
import { ActionCard } from './ActionCard';
import { AlertCard } from './AlertCard';
import { DataCard } from './DataCard';
import { TaskListCard } from './TaskListCard';
import { ProgressCard } from './ProgressCard';
import { TableCard } from './TableCard';
import { KanbanMiniCard } from './KanbanMiniCard';
import { ChartCard } from './ChartCard';
import { FileCard } from './FileCard';
import { ReportCard } from './ReportCard';

interface CardRendererProps {
  cards: InteractiveCard[];
  onCardClick?: (card: InteractiveCard) => void;
}

/** Build hint text from registry title, with fallback map for known types */
function getWidgetHint(widgetType: string): string {
  const def = registry.get(widgetType);
  if (def?.title) return `打开${def.title}`;
  return '展开查看';
}

export const CardRenderer: React.FC<CardRendererProps> = ({ cards, onCardClick }) => {
  if (!cards || cards.length === 0) return null;

  const renderCard = (card: InteractiveCard) => {
    const cardType = card.type || 'data';
    switch (cardType) {
      case 'action':
        return <ActionCard card={card} />;
      case 'alert':
        return <AlertCard card={card} />;
      case 'task_list':
        return <TaskListCard card={card} compact />;
      case 'progress':
        return <ProgressCard card={card} compact />;
      case 'table':
        return <TableCard card={card} compact />;
      case 'kanban':
        return <KanbanMiniCard card={card} compact />;
      case 'chart':
        return <ChartCard card={card} compact />;
      case 'file':
        return <FileCard card={card} />;
      case 'report':
        return <ReportCard card={card} compact />;
      case 'data':
      case 'form':
      default:
        return <DataCard card={card} />;
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((card, i) => {
        const widgetType = card.widget_type ?? detectWidgetType(card);
        const isWidget = widgetType !== null && registry.has(widgetType);
        const hint = isWidget ? getWidgetHint(widgetType!) : '展开查看';

        return (
          <div key={i} className="relative group">
            {/* Expand button (top-right corner on hover) */}
            {onCardClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick(card);
                }}
                className={`absolute top-2 right-2 z-10 rounded-md flex items-center justify-center
                  transition-opacity duration-150 cursor-pointer shadow-sm
                  ${isWidget
                    ? 'opacity-100 gap-1 px-2 py-1 bg-[#0073ea] text-white text-[10px] font-semibold hover:bg-[#0060c2]'
                    : 'opacity-0 group-hover:opacity-100 w-7 h-7 bg-white/90 border border-[#d0d4e4] text-[#676879] hover:bg-[#cce5ff] hover:text-[#0073ea] hover:border-[#0073ea]/40'
                  }`}
                title={hint}
              >
                {isWidget ? (
                  <>
                    <Zap size={10} />
                    {hint}
                  </>
                ) : (
                  <Maximize2 size={13} />
                )}
              </button>
            )}

            {/* Card body */}
            <div
              className={onCardClick ? 'cursor-pointer' : ''}
              onClick={() => onCardClick?.(card)}
            >
              {renderCard(card)}
            </div>

            {/* Interactive footer bar for widget-capable cards */}
            {isWidget && onCardClick && (
              <div
                className="flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-[#0073ea]/5 to-[#00C875]/5 border-t border-[#d0d4e4] rounded-b-xl text-[11px] text-[#0073ea] font-medium cursor-pointer hover:bg-[#cce5ff]/30 transition-colors"
                onClick={() => onCardClick(card)}
              >
                <Zap size={11} />
                点击打开可交互视图
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
