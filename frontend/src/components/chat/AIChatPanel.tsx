import React, { useEffect, useRef, useMemo } from 'react';
import { X, Bot, Sparkles, FolderOpen } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import { useProjectStore } from '../../stores/projectStore';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';

interface QuickSuggestion {
  label: string;
  message: string;
}

const DASHBOARD_SUGGESTIONS: QuickSuggestion[] = [
  { label: '查看进度', message: '请给我查看当前所有项目的进度概览' },
  { label: '风险分析', message: '分析当前项目存在哪些风险点' },
  { label: '本周任务', message: '列出本周需要完成的重要任务' },
  { label: '生成周报', message: '帮我生成本周的工作周报' },
];

const PROJECT_LIST_SUGGESTIONS: QuickSuggestion[] = [
  { label: '对比项目进度', message: '请对比所有项目的进度情况，找出落后和领先的项目' },
  { label: '找出风险项目', message: '分析所有项目，找出存在风险或延期风险的项目' },
  { label: '项目统计', message: '给我一个所有项目的整体统计数据汇总' },
  { label: '生成汇报', message: '帮我生成一份项目整体情况的汇报材料' },
];

const KNOWLEDGE_SUGGESTIONS: QuickSuggestion[] = [
  { label: '搜索文档', message: '帮我搜索知识库中与项目管理相关的文档' },
  { label: '最近更新', message: '列出知识库中最近更新的内容' },
  { label: '常用模板', message: '推荐一些常用的项目文档模板' },
  { label: '知识问答', message: '我有一个关于项目管理规范的问题，请帮我解答' },
];

const PAGE_CONTEXT_MAP: Record<string, string> = {
  '/': '首页仪表盘',
  '/projects': '项目管理',
  '/knowledge': '知识库',
  '/settings': '设置',
};

function getProjectDetailSuggestions(projectName: string): QuickSuggestion[] {
  return [
    {
      label: '分析此项目',
      message: `[关于项目: ${projectName}] 请帮我全面分析这个项目的当前状态和关键指标`,
    },
    {
      label: '任务建议',
      message: `[关于项目: ${projectName}] 根据项目当前情况，给我下阶段任务优先级建议`,
    },
    {
      label: '风险评估',
      message: `[关于项目: ${projectName}] 请评估这个项目存在的风险点并给出应对建议`,
    },
    {
      label: '生成进度报告',
      message: `[关于项目: ${projectName}] 帮我生成这个项目的进度报告`,
    },
  ];
}

function getGenericProjectDetailSuggestions(): QuickSuggestion[] {
  return [
    { label: '分析此项目', message: '请帮我全面分析当前项目的状态和关键指标' },
    { label: '任务建议', message: '根据项目当前情况，给我下阶段任务优先级建议' },
    { label: '风险评估', message: '请评估当前项目存在的风险点并给出应对建议' },
    { label: '生成进度报告', message: '帮我生成当前项目的进度报告' },
  ];
}

export const AIChatPanel: React.FC = () => {
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const isPanelOpen = useChatStore((s) => s.isPanelOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const closePanel = useChatStore((s) => s.closePanel);

  const projectDetail = useProjectStore((s) => s.projectDetail);

  // Determine if we are on a project detail page
  const isProjectDetailPage = useMemo(() => {
    return /^\/projects\/[^/]+/.test(location.pathname);
  }, [location.pathname]);

  // Resolve the project name: prefer loaded detail whose id matches the route param
  const projectName = useMemo(() => {
    if (!isProjectDetailPage) return null;
    if (projectDetail && (!params.id || projectDetail.id === params.id)) {
      return projectDetail.name;
    }
    return null;
  }, [isProjectDetailPage, projectDetail, params.id]);

  // Dynamic page context label shown under the AI title
  const pageContext = useMemo(() => {
    if (isProjectDetailPage) {
      return projectName ? `项目: ${projectName}` : '项目详情';
    }
    return PAGE_CONTEXT_MAP[location.pathname] ?? '牛油果CoWork';
  }, [isProjectDetailPage, projectName, location.pathname]);

  // Dynamic quick suggestions per page
  const quickSuggestions: QuickSuggestion[] = useMemo(() => {
    if (isProjectDetailPage) {
      return projectName
        ? getProjectDetailSuggestions(projectName)
        : getGenericProjectDetailSuggestions();
    }
    if (location.pathname === '/projects') return PROJECT_LIST_SUGGESTIONS;
    if (location.pathname.startsWith('/knowledge')) return KNOWLEDGE_SUGGESTIONS;
    return DASHBOARD_SUGGESTIONS;
  }, [isProjectDetailPage, projectName, location.pathname]);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (isPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isPanelOpen]);

  const handleSend = (content: string) => {
    // Prefix project context so the AI knows which project is being discussed
    if (isProjectDetailPage && projectName) {
      sendMessage(`[关于项目: ${projectName}] ${content}`);
    } else {
      sendMessage(content);
    }
  };

  const handleQuickSuggestion = (message: string) => {
    sendMessage(message);
  };

  return (
    <aside
      className={
        isPanelOpen
          ? 'w-[380px] shrink-0 flex flex-col h-full border-l border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden transition-all duration-300'
          : 'w-0 shrink-0 flex flex-col h-full overflow-hidden border-l-0 transition-all duration-300'
      }
      aria-label="AI 智能助手"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shrink-0 min-w-[380px]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar */}
          <div className="w-[30px] h-[30px] min-w-[30px] rounded-lg bg-gradient-to-br from-[#6BBF59] to-[#3EC6C6] flex items-center justify-center text-white shrink-0">
            <Bot size={16} />
          </div>
          {/* Title group */}
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-sm font-semibold text-light-text dark:text-dark-text whitespace-nowrap">
              AI 智能助手
            </span>
            <span className="flex items-center gap-[3px] text-[0.7rem] text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
              <Sparkles size={10} />
              {pageContext}
            </span>
          </div>
        </div>
        <button
          className="w-7 h-7 min-w-[28px] rounded-md flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-light-text dark:hover:text-dark-text transition-colors shrink-0"
          onClick={closePanel}
          aria-label="关闭 AI 助手"
          title="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {/* Project Context Banner — visible only on project detail pages */}
      {isProjectDetailPage && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-light-border dark:border-dark-border bg-primary/[0.04] shrink-0 min-w-[380px]">
          <div className="flex items-center justify-center w-[22px] h-[22px] min-w-[22px] rounded-md bg-primary/10 text-primary shrink-0">
            <FolderOpen size={13} />
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-[0.65rem] font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-[0.04em] whitespace-nowrap">
              当前项目
            </span>
            <span className="text-[0.8rem] font-semibold text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
              {projectName ?? '加载中...'}
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 flex flex-col gap-0 min-w-[380px] scroll-smooth [scrollbar-width:thin]">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap gap-2 px-3.5 py-2.5 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg shrink-0 min-w-[380px]">
        {quickSuggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            className="inline-flex items-center px-3 py-1.5 rounded-full border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary text-xs font-medium whitespace-nowrap cursor-pointer transition-colors hover:bg-primary/[0.06] hover:border-primary/40 hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={() => handleQuickSuggestion(suggestion.message)}
            disabled={isLoading}
            type="button"
          >
            {suggestion.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shrink-0 min-w-[380px]">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </aside>
  );
};
