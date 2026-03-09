import React from 'react';
import { Bot } from 'lucide-react';
import './TypingIndicator.css';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator-wrapper animate-fade-in">
      <div className="typing-avatar">
        <Bot size={18} />
      </div>

      <div className="typing-body">
        <span className="typing-label">Agent 正在思考...</span>

        <div className="typing-bubble">
          <div className="typing-dots">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
};
