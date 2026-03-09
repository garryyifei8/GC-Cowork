import React from 'react';
import { Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { CardRenderer } from '../cards/CardRenderer';
import './MessageBubble.css';

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
    <div className={`message-bubble-wrapper ${isAgent ? 'agent' : 'user'}`}>
      {isAgent ? (
        <div className="message-avatar agent-avatar">
          <Bot size={18} />
        </div>
      ) : (
        <div className="message-avatar user-avatar">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f8fafc"
            alt="User"
          />
        </div>
      )}

      <div className="message-body">
        <div className={`message-meta ${isAgent ? '' : 'meta-right'}`}>
          {isAgent && message.agentType && (
            <span className="agent-type-badge">
              {AGENT_TYPE_LABELS[message.agentType] ?? message.agentType} Agent
            </span>
          )}
          <span className="message-sender-name">{message.senderName}</span>
          <span className="message-timestamp">{formatTime(message.timestamp)}</span>
        </div>

        <div className={`message-bubble ${isAgent ? 'bubble-agent' : 'bubble-user'}`}>
          <div className="bubble-text">
            {message.content.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>

          {message.cards && message.cards.length > 0 && (
            <div className="bubble-cards">
              <CardRenderer cards={message.cards} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
