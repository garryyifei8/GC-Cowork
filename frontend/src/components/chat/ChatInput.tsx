import React, { useRef, useState } from 'react';
import { Paperclip, Image as ImageIcon, Mic, Send } from 'lucide-react';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue('');

    // Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="chat-input-outer">
      <div className="chat-input-pill">
        {/* Left: attachment icons */}
        <div className="chat-input-left-icons">
          <button className="chat-icon-btn" title="附件" type="button" disabled={disabled}>
            <Paperclip size={17} />
          </button>
          <button className="chat-icon-btn" title="图片" type="button" disabled={disabled}>
            <ImageIcon size={17} />
          </button>
          <button className="chat-icon-btn" title="语音" type="button" disabled={disabled}>
            <Mic size={17} />
          </button>
        </div>

        {/* Center: auto-resize textarea */}
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="发送消息或 @Agent, 使用 '/' 触发快捷指令..."
          rows={1}
          disabled={disabled}
        />

        {/* Right: send button */}
        <button
          className={`chat-send-btn ${canSend ? 'active' : 'inactive'}`}
          onClick={handleSend}
          disabled={!canSend}
          type="button"
          title="发送"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
};
