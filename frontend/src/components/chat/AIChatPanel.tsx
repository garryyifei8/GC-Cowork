import React, { useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, FolderOpen, PenSquare } from 'lucide-react';
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

const HR_SUGGESTIONS: QuickSuggestion[] = [
  { label: '员工概况', message: '给我一个当前所有在职员工的整体概况' },
  { label: '考勤分析', message: '分析本月员工考勤情况，找出异常记录' },
  { label: '待审假单', message: '列出所有待审批的请假申请' },
  { label: '薪资汇总', message: '汇总本月薪资数据，包含各部门均值' },
];

const FINANCE_SUGGESTIONS: QuickSuggestion[] = [
  { label: '财务概览', message: '给我一份当前财务状况的整体概览' },
  { label: '待审报销', message: '列出所有待审批的报销单' },
  { label: '预算执行', message: '分析当前各项目预算执行情况' },
  { label: '逾期发票', message: '查找所有逾期未处理的发票' },
];

const TASKS_SUGGESTIONS: QuickSuggestion[] = [
  { label: '我的任务', message: '列出分配给我的所有进行中任务' },
  { label: '逾期任务', message: '找出所有已逾期或即将逾期的任务' },
  { label: '高优先级', message: '列出所有高优先级待办任务' },
  { label: '任务统计', message: '给我一份任务完成情况的统计汇总' },
];

const PAGE_CONTEXT_MAP: Record<string, string> = {
  '/': '首页仪表盘',
  '/projects': '项目管理',
  '/knowledge': '知识库',
  '/hr': '人事管理',
  '/finance': '财务管理',
  '/tasks': '任务工作台',
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
  const clearMessages = useChatStore((s) => s.clearMessages);
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
    if (location.pathname.startsWith('/hr')) return HR_SUGGESTIONS;
    if (location.pathname.startsWith('/finance')) return FINANCE_SUGGESTIONS;
    if (location.pathname.startsWith('/tasks')) return TASKS_SUGGESTIONS;
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
          ? 'w-[380px] shrink-0 flex flex-col h-full border-l border-light-border bg-light-surface overflow-hidden transition-all duration-300'
          : 'w-0 shrink-0 flex flex-col h-full overflow-hidden border-l-0 transition-all duration-300'
      }
      aria-label="AI 智能助手"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-light-border bg-light-surface shrink-0 min-w-[380px]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mascot SVG */}
          <div className="w-[36px] h-[36px] min-w-[36px] rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-500/20 shadow-sm flex items-center justify-center shrink-0 relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-sm">
              <defs>
                <linearGradient id="avo-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#84CC16" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
                <linearGradient id="avo-pit" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#92400E" />
                </linearGradient>
              </defs>

              {/* Body */}
              <path d="M50 15 C30 15, 20 45, 20 68 C20 88, 38 98, 50 98 C62 98, 80 88, 80 68 C80 45, 70 15, 50 15 Z" fill="url(#avo-body)" />
              <path d="M50 20 C35 20, 27 46, 27 68 C27 82, 40 92, 50 92 C60 92, 73 82, 73 68 C73 46, 65 20, 50 20 Z" fill="#D9F99D" />

              {/* Pit */}
              <circle cx="50" cy="70" r="15" fill="url(#avo-pit)" />
              <path d="M42 63 C46 58, 54 58, 58 63" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />

              {/* Face */}
              <circle cx="40" cy="42" r="4.5" fill="#1F2937" />
              <circle cx="60" cy="42" r="4.5" fill="#1F2937" />
              <circle cx="41.5" cy="40.5" r="1.5" fill="white" />
              <circle cx="61.5" cy="40.5" r="1.5" fill="white" />
              <path d="M45 49 Q50 54 55 49" fill="none" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="33" cy="48" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.7" />
              <ellipse cx="67" cy="48" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.7" />

              {/* Right Arm (Static) */}
              <path d="M76 60 C85 64, 90 70, 88 80" fill="none" stroke="#65A30D" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="88" cy="80" r="3.5" fill="#65A30D" />

              {/* Left Arm (Waving Loop) */}
              <g className="animate-avocado-wave">
                <path d="M24 60 C15 55, 8 45, 12 30" fill="none" stroke="#65A30D" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="12" cy="30" r="3.5" fill="#65A30D" />
                {/* Tiny motion lines */}
                <path d="M4 25 Q8 18 14 22" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" className="animate-avocado-fade" />
                <path d="M1 35 Q5 27 10 35" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" className="animate-avocado-fade-delayed" />
              </g>
            </svg>
          </div>
          {/* Title group */}
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-sm font-semibold text-light-text whitespace-nowrap">
              AI 智能助手
            </span>
            <span className="flex items-center gap-[3px] text-[0.7rem] text-light-text-secondary whitespace-nowrap">
              <Sparkles size={10} />
              {pageContext}
            </span>
          </div>
        </div>
        {/* New-chat button */}
        <button
          className="w-7 h-7 min-w-[28px] rounded-md flex items-center justify-center text-light-text-secondary hover:bg-light-surface-hover hover:text-primary transition-colors shrink-0 mr-1"
          onClick={clearMessages}
          aria-label="新对话"
          title="新对话"
          disabled={isLoading}
        >
          <PenSquare size={15} />
        </button>
        <button
          className="w-7 h-7 min-w-[28px] rounded-md flex items-center justify-center text-light-text-secondary hover:bg-light-surface-hover hover:text-light-text transition-colors shrink-0"
          onClick={closePanel}
          aria-label="关闭 AI 助手"
          title="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {/* Project Context Banner — visible only on project detail pages */}
      {isProjectDetailPage && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-light-border bg-primary/[0.04] shrink-0 min-w-[380px]">
          <div className="flex items-center justify-center w-[22px] h-[22px] min-w-[22px] rounded-md bg-primary/10 text-primary shrink-0">
            <FolderOpen size={13} />
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-[0.65rem] font-medium text-light-text-secondary uppercase tracking-[0.04em] whitespace-nowrap">
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
        {/* Show typing indicator only when loading but no streaming message exists yet */}
        {isLoading && !messages.some((m) => m.isStreaming) && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap gap-2 px-3.5 py-2.5 border-t border-light-border bg-light-bg shrink-0 min-w-[380px]">
        {quickSuggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            className="inline-flex items-center px-3 py-1.5 rounded-full border border-light-border bg-light-surface text-light-text-secondary text-xs font-medium whitespace-nowrap cursor-pointer transition-colors hover:bg-primary/[0.06] hover:border-primary/40 hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={() => handleQuickSuggestion(suggestion.message)}
            disabled={isLoading}
            type="button"
          >
            {suggestion.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-light-border bg-light-surface shrink-0 min-w-[380px]">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </aside>
  );
};
