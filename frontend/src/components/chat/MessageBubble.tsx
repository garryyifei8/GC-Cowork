import React from 'react';
import { Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { CardRenderer } from '../cards/CardRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAgent = message.role === 'agent';

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
        <div className="w-8 h-8 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden flex items-center justify-center shrink-0 self-end">
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
        <div
          className={`flex items-center gap-1.5 flex-wrap ${
            isAgent ? '' : 'justify-end'
          }`}
        >
          {isAgent && message.agentType && (
            <span className="inline-flex items-center px-2 h-[18px] rounded-full bg-gradient-to-br from-primary to-primary-light text-white text-[0.6875rem] font-semibold tracking-[0.02em] whitespace-nowrap">
              {AGENT_TYPE_LABELS[message.agentType] ?? message.agentType} Agent
            </span>
          )}
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium">
            {message.senderName}
          </span>
          <span className="text-[0.6875rem] text-light-text-secondary dark:text-dark-text-secondary">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-3 text-[0.9375rem] leading-relaxed break-words ${
            isAgent
              ? 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-[16px_16px_16px_4px] shadow-sm'
              : 'bg-gradient-to-br from-primary to-primary-dark text-white rounded-[16px_16px_4px_16px] shadow-[0_4px_10px_rgba(59,130,246,0.2)]'
          }`}
        >
          <div className="whitespace-pre-wrap">
            {message.content.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>

          {message.cards && message.cards.length > 0 && (
            <div className="mt-3.5">
              <CardRenderer cards={message.cards} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
