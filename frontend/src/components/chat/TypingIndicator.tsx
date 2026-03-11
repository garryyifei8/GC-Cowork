import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-3 self-start max-w-[85%] animate-fade-in">
    {/* Avatar — matches agent MessageBubble */}
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center shrink-0 shadow-sm">
      <Bot size={18} />
    </div>

    {/* Body */}
    <div className="flex flex-col gap-1">
      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium pl-0.5">
        Agent 正在思考...
      </span>

      {/* Bubble */}
      <div className="inline-flex items-center bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-primary animate-bounce-dot"
              style={{ animationDelay: `${[-0.32, -0.16, 0][i]}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);
