import React, { useEffect, useRef } from 'react';
import { PenSquare } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { MessageBubble } from '../components/chat/MessageBubble';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { ChatInput } from '../components/chat/ChatInput';
import { WelcomeScreen } from '../components/chat/WelcomeScreen';
import { ArtifactPanel } from '../components/chat/ArtifactPanel';
import { ErrorBanner } from '../components/chat/ErrorBanner';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const selectedArtifact = useChatStore((s) => s.selectedArtifact);
  const openArtifact = useChatStore((s) => s.openArtifact);
  const openTextArtifact = useChatStore((s) => s.openTextArtifact);
  const closeArtifact = useChatStore((s) => s.closeArtifact);

  const isWelcome = messages.length <= 1 && messages[0]?.id === 'welcome';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const panelOpen = selectedArtifact !== null;

  return (
    <div className="chat-page flex h-full w-full overflow-hidden">
      {/* Left: Chat area — shrinks to ~40% when artifact panel is open */}
      <div
        className="flex flex-col min-w-[320px] transition-all duration-300 ease-in-out"
        style={{ flex: panelOpen ? '0 0 40%' : '1 1 100%' }}
      >
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-[#E8ECF4] shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            {/* Mascot SVG */}
            <div className="w-[36px] h-[36px] min-w-[36px] rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-500/20 shadow-sm flex items-center justify-center shrink-0 relative overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-sm">
                <defs>
                  <linearGradient id="avo-body-chat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#84CC16" />
                    <stop offset="100%" stopColor="#22C55E" />
                  </linearGradient>
                  <linearGradient id="avo-pit-chat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#92400E" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 15 C30 15, 20 45, 20 68 C20 88, 38 98, 50 98 C62 98, 80 88, 80 68 C80 45, 70 15, 50 15 Z"
                  fill="url(#avo-body-chat)"
                />
                <path
                  d="M50 20 C35 20, 27 46, 27 68 C27 82, 40 92, 50 92 C60 92, 73 82, 73 68 C73 46, 65 20, 50 20 Z"
                  fill="#D9F99D"
                />
                <circle cx="50" cy="70" r="15" fill="url(#avo-pit-chat)" />
                <path
                  d="M42 63 C46 58, 54 58, 58 63"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <circle cx="40" cy="42" r="4.5" fill="#1F2937" />
                <circle cx="60" cy="42" r="4.5" fill="#1F2937" />
                <circle cx="41.5" cy="40.5" r="1.5" fill="white" />
                <circle cx="61.5" cy="40.5" r="1.5" fill="white" />
                <path
                  d="M45 49 Q50 54 55 49"
                  fill="none"
                  stroke="#1F2937"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <ellipse cx="33" cy="48" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.7" />
                <ellipse cx="67" cy="48" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.7" />
                <path
                  d="M76 60 C85 64, 90 70, 88 80"
                  fill="none"
                  stroke="#65A30D"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <circle cx="88" cy="80" r="3.5" fill="#65A30D" />
                <g className="animate-avocado-wave">
                  <path
                    d="M24 60 C15 55, 8 45, 12 30"
                    fill="none"
                    stroke="#65A30D"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="30" r="3.5" fill="#65A30D" />
                  <path
                    d="M4 25 Q8 18 14 22"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-avocado-fade"
                  />
                  <path
                    d="M1 35 Q5 27 10 35"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-avocado-fade-delayed"
                  />
                </g>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-medium text-light-text">AI小助理</span>
              <span className="text-[11px] text-light-text-secondary">你的智能工作伙伴</span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-light-text-secondary
              hover:bg-[#E8ECF4] hover:text-light-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="新对话"
          >
            <PenSquare size={14} />
            新对话
          </button>
        </div>

        {/* Error banner — shown when LLM is unavailable */}
        <ErrorBanner />

        {/* Messages area OR Welcome screen */}
        {isWelcome ? (
          <WelcomeScreen onAction={handleSend} disabled={isLoading} />
        ) : (
          <div
            className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-1 scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCardClick={openArtifact}
                onSuggestionClick={handleSend}
                onExpandText={openTextArtifact}
                onRetry={() => useChatStore.getState().retryLastMessage()}
              />
            ))}
            {isLoading && !messages.some((m) => m.isStreaming) && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick suggestion chips — show only after welcome is dismissed */}
        {!isWelcome && (
          <div className="flex flex-wrap gap-2 px-6 py-2.5 border-t border-[#E8ECF4] bg-[#F4F6FC] shrink-0">
            {[
              { label: '查看进度', message: '请给我查看当前所有项目的进度概览' },
              { label: '风险分析', message: '分析当前项目存在哪些风险点' },
              { label: '本周任务', message: '列出本周需要完成的重要任务' },
              { label: '生成周报', message: '帮我生成本周的工作周报' },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleSend(s.message)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#E8ECF4] bg-white text-light-text-secondary text-xs font-medium
                  hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Chat input */}
        <div className="border-t border-[#E8ECF4] bg-white shrink-0">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>

      {/* Right: Artifact panel — 60% width when open */}
      <div
        className={`chat-artifact-panel shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          panelOpen ? 'flex-[0_0_60%]' : 'w-0'
        }`}
      >
        {selectedArtifact && (
          <div className="h-full">
            <ArtifactPanel artifact={selectedArtifact} onClose={closeArtifact} />
          </div>
        )}
      </div>
    </div>
  );
};
