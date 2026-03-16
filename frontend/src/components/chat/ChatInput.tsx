import React, { useRef, useState } from 'react';
import { Paperclip, Image as ImageIcon, Mic, Send } from 'lucide-react';

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
    <div className="px-3 py-2.5">
      {/* Pill container */}
      <div className="flex items-end gap-1.5 bg-light-surface border border-light-border rounded-3xl px-2.5 py-2 transition-shadow focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
        {/* Left: attachment icons */}
        <div className="flex items-center gap-0.5 pb-0.5 shrink-0">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-light-text-secondary bg-transparent border-0 cursor-pointer transition-colors hover:bg-light-surface-hover hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed"
            title="附件"
            type="button"
            disabled={disabled}
          >
            <Paperclip size={17} />
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-light-text-secondary bg-transparent border-0 cursor-pointer transition-colors hover:bg-light-surface-hover hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed"
            title="图片"
            type="button"
            disabled={disabled}
          >
            <ImageIcon size={17} />
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-light-text-secondary bg-transparent border-0 cursor-pointer transition-colors hover:bg-light-surface-hover hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed"
            title="语音"
            type="button"
            disabled={disabled}
          >
            <Mic size={17} />
          </button>
        </div>

        {/* Center: auto-resize textarea */}
        <textarea
          ref={textareaRef}
          className="flex-1 border-0 bg-transparent font-sans text-[0.9375rem] text-light-text leading-relaxed resize-none outline-none min-h-6 max-h-[150px] py-1.5 px-1 self-end placeholder:text-light-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="发送消息或 @Agent, 使用 '/' 触发快捷指令..."
          rows={1}
          disabled={disabled}
        />

        {/* Right: send button */}
        <button
          className={`w-9 h-9 rounded-full border-0 flex items-center justify-center shrink-0 mb-0.5 cursor-pointer transition-all ${
            canSend
              ? 'bg-primary text-white shadow-[0_3px_8px_rgba(59,130,246,0.35)] hover:scale-105 hover:shadow-[0_5px_12px_rgba(59,130,246,0.45)] active:scale-95'
              : 'bg-light-border text-light-text-secondary shadow-none cursor-not-allowed'
          }`}
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
