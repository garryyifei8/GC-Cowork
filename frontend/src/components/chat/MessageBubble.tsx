import React from 'react';
import { AlertTriangle, Bot, ChevronRight } from 'lucide-react';
import type { ChatMessage, InteractiveCard } from '../../types';
import { CardRenderer } from '../cards/CardRenderer';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: ChatMessage;
  onCardClick?: (card: InteractiveCard) => void;
  /** Called when user clicks an action/suggestion button */
  onSuggestionClick?: (text: string) => void;
  /** Called when user clicks "展开全文" to view full text in artifact panel */
  onExpandText?: (text: string, title?: string) => void;
  /** Called when user clicks the retry button on an error message */
  onRetry?: () => void;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  dispatch: '调度',
  project: '项目',
  finance: '财务',
  legal: '法务',
  procurement: '采购',
  hr: '人事',
  bidding: '招投标',
  document: '文档',
  knowledge: '知识库',
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Max lines of text to show in chat bubble before truncating */
const MAX_SUMMARY_LINES = 4;

/**
 * Renders a line of text with inline formatting:
 * **bold**, *italic*, `code`
 */
function renderInlineFormatting(text: string, isUser: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={match.index} className="font-bold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          className={`px-1 py-0.5 rounded text-[0.85em] font-mono ${
            isUser ? 'bg-white/20' : 'bg-[#EFF3F9] text-primary'
          }`}
        >
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

/**
 * Renders message content with light markdown — full version for user messages,
 * truncated for agent messages.
 */
function RichContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim()) || /^_{3,}$/.test(line.trim())) {
      elements.push(
        <hr
          key={i}
          className={`my-2 border-t ${isUser ? 'border-white/30' : 'border-[#E8ECF4]'}`}
        />
      );
      i++;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch && !isUser) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const className =
        level === 1
          ? 'text-[15px] font-bold mt-2 mb-1'
          : level === 2
            ? 'text-[14px] font-bold mt-1.5 mb-0.5'
            : 'text-[13px] font-medium mt-1 mb-0.5';
      elements.push(
        <div key={i} className={`${className} text-light-text`}>
          {renderInlineFormatting(text, isUser)}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
    if (bulletMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const bm = lines[i].match(/^[\s]*[-*•]\s+(.+)/);
        if (!bm) break;
        listItems.push(
          <li key={i} className="flex gap-2 py-0.5">
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isUser ? 'bg-white/60' : 'bg-primary'}`}
            />
            <span>{renderInlineFormatting(bm[1], isUser)}</span>
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-none space-y-0.5 my-1">
          {listItems}
        </ul>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^[\s]*(\d+)[.、]\s+(.+)/);
    if (numMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const nm = lines[i].match(/^[\s]*(\d+)[.、]\s+(.+)/);
        if (!nm) break;
        listItems.push(
          <li key={i} className="flex gap-2 py-0.5">
            <span
              className={`shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5 ${
                isUser ? 'bg-white/20 text-white' : 'bg-[#EFF3F9] text-primary'
              }`}
            >
              {nm[1]}
            </span>
            <span>{renderInlineFormatting(nm[2], isUser)}</span>
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-none space-y-0.5 my-1">
          {listItems}
        </ol>
      );
      continue;
    }

    // Regular line
    elements.push(<div key={i}>{renderInlineFormatting(line, isUser)}</div>);
    i++;
  }

  return <div className="space-y-0">{elements}</div>;
}

/**
 * Extract a short summary from agent text. Returns the first N non-empty lines.
 */
function getSummaryText(
  content: string,
  maxLines: number
): { summary: string; isTruncated: boolean } {
  const lines = content.split('\n').filter((l) => l.trim() !== '');
  if (lines.length <= maxLines) {
    return { summary: content, isTruncated: false };
  }
  return { summary: lines.slice(0, maxLines).join('\n'), isTruncated: true };
}

/**
 * Extract suggestion buttons from the message: either from card actions
 * or from numbered/bullet options in the text.
 */
function extractSuggestions(message: ChatMessage): string[] {
  const suggestions: string[] = [];

  // 1. Collect action labels from cards
  if (message.cards) {
    for (const card of message.cards) {
      if (card.actions) {
        for (const action of card.actions) {
          if (action.label && !suggestions.includes(action.label)) {
            suggestions.push(action.label);
          }
        }
      }
    }
  }

  // 2. Extract numbered/bullet options from text (e.g., "1. 查看详情" or "- 生成报告")
  const optionRegex = /^[\s]*(?:\d+[.、]|[-*•])\s+(.{2,30})$/gm;
  let match;
  while ((match = optionRegex.exec(message.content)) !== null) {
    const text = match[1].trim();
    // Skip generic text that doesn't look like an actionable option
    if (text.length >= 2 && text.length <= 30 && !suggestions.includes(text)) {
      suggestions.push(text);
    }
  }

  return suggestions.slice(0, 6); // Max 6 suggestion buttons
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCardClick,
  onSuggestionClick,
  onExpandText,
  onRetry,
}) => {
  // Error message rendering
  if (message.error) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] rounded-[10px] bg-[#E74C3C]/5 border border-[#E74C3C]/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-[#E74C3C]" />
            <span className="text-sm font-medium text-[#E74C3C]">发送失败</span>
          </div>
          <p className="text-sm text-light-text-secondary mb-3">
            {message.errorMessage || 'AI 服务暂时不可用，请稍后重试'}
          </p>
          {onRetry && (
            <button onClick={onRetry} className="text-xs text-primary hover:underline">
              点击重试
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAgent = message.role === 'agent';
  const hasCards = message.cards && message.cards.length > 0;
  const isStreaming = message.isStreaming;

  // For agent messages with cards, show truncated summary
  const shouldTruncate = isAgent && hasCards && !isStreaming && message.content.length > 0;
  const { summary, isTruncated } = shouldTruncate
    ? getSummaryText(message.content, MAX_SUMMARY_LINES)
    : { summary: message.content, isTruncated: false };

  // Extract suggestion buttons (only for completed agent messages)
  const suggestions = isAgent && !isStreaming ? extractSuggestions(message) : [];

  return (
    <div
      className={`flex gap-3 max-w-[85%] ${
        isAgent ? 'self-start flex-row' : 'self-end flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      {isAgent ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center shrink-0 self-end shadow-sm">
          <Bot size={18} />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-light-surface border border-light-border overflow-hidden flex items-center justify-center shrink-0 self-end">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f8fafc"
            alt="User"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Meta row: badge + name + timestamp */}
        <div className={`flex items-center gap-1.5 flex-wrap ${isAgent ? '' : 'justify-end'}`}>
          {isAgent && message.agentType && (
            <span className="inline-flex items-center px-2 h-[18px] rounded-full bg-gradient-to-br from-primary to-primary-light text-white text-[0.6875rem] font-semibold tracking-[0.02em] whitespace-nowrap">
              {AGENT_TYPE_LABELS[message.agentType] ?? message.agentType} Agent
            </span>
          )}
          <span className="text-xs text-light-text-secondary font-medium">
            {message.senderName}
          </span>
          <span className="text-[0.6875rem] text-light-text-secondary">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Bubble — for agent messages: summary text + cards */}
        <div
          className={`px-4 py-3 text-[0.9375rem] leading-relaxed break-words ${
            isAgent
              ? 'bg-light-surface text-light-text border border-light-border rounded-[16px_16px_16px_4px] shadow-sm'
              : 'bg-gradient-to-br from-primary to-primary-dark text-white rounded-[16px_16px_4px_16px] shadow-[0_4px_10px_rgba(59,130,246,0.2)]'
          }`}
        >
          {/* Text content: summary for agent with cards, full for user/streaming */}
          {summary && (
            <div className={shouldTruncate ? 'text-[13px]' : ''}>
              <RichContent content={summary} isUser={!isAgent} />
            </div>
          )}

          {/* "展开全文" link when truncated */}
          {isTruncated && (
            <button
              type="button"
              onClick={() => onExpandText?.(message.content, '完整回复')}
              className="inline-flex items-center gap-0.5 mt-1.5 text-[12px] text-primary font-medium hover:underline cursor-pointer"
            >
              展开全文
              <ChevronRight size={12} />
            </button>
          )}

          {/* Blinking cursor while streaming */}
          {isStreaming && (
            <span className="streaming-cursor" aria-hidden="true">
              ▊
            </span>
          )}

          {/* Interactive cards — compact inline preview */}
          {hasCards && !isStreaming && (
            <div className="mt-3">
              <CardRenderer cards={message.cards!} onCardClick={onCardClick} />
            </div>
          )}
        </div>

        {/* Suggestion buttons — below the bubble */}
        {suggestions.length > 0 && onSuggestionClick && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestionClick(s)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                  border border-[#E8ECF4] bg-white text-[12px] font-medium text-light-text-secondary
                  hover:bg-primary/10 hover:border-primary/40 hover:text-primary
                  transition-colors cursor-pointer shadow-sm"
              >
                {s}
                <ChevronRight size={12} className="text-light-text-secondary/60" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
