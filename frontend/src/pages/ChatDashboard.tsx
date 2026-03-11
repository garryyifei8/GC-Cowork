import React, { useEffect, useRef } from 'react';
import { Zap, Plus, MessageSquare, X } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { MessageBubble } from '../components/chat/MessageBubble';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { ChatInput } from '../components/chat/ChatInput';


const SIDEBAR_CONVERSATIONS = [
    { id: 'c1', label: '博物馆项目进度', active: true },
    { id: 'c2', label: '采购申请审批', active: false },
    { id: 'c3', label: '上周周报汇总', active: false },
    { id: 'c4', label: '合同审查提醒', active: false },
];

export const ChatDashboard: React.FC = () => {
    const { messages, isLoading, error, sendMessage, clearError } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = (content: string) => {
        sendMessage(content);
    };

    return (
        <div className="chat-dashboard animate-fade-in">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-title">
                    <h2>工作区对话</h2>
                    <span className="chat-subtitle">随时流式唤醒跨部门 Agent 协作</span>
                </div>
                <div className="chat-header-actions">
                    <button className="btn btn-outline">
                        <Zap size={15} />
                        快捷指令
                    </button>
                    <button className="btn btn-outline">
                        <Plus size={15} />
                        新建对话
                    </button>
                </div>
            </div>

            {/* Body: sidebar + main */}
            <div className="chat-layout">
                {/* Left sidebar */}
                <aside className="chat-sidebar">
                    <div className="sidebar-section-label">最近对话</div>
                    <ul className="conversation-list">
                        {SIDEBAR_CONVERSATIONS.map((conv) => (
                            <li
                                key={conv.id}
                                className={`conversation-item${conv.active ? ' active' : ''}`}
                            >
                                <MessageSquare size={14} className="conv-icon" />
                                <span className="conv-label">{conv.label}</span>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main chat panel */}
                <div className="chat-main">
                    {/* Inline error bar */}
                    {error && (
                        <div className="chat-error">
                            <span>{error}</span>
                            <button
                                className="chat-error-dismiss"
                                onClick={clearError}
                                aria-label="关闭错误提示"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Messages area */}
                    <div className="chat-messages-area">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {isLoading && <TypingIndicator />}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-input-section">
                        <ChatInput onSend={handleSend} disabled={isLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
};
