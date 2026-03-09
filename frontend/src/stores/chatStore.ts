import { create } from 'zustand';
import type { ChatMessage } from '../types';
import { chatService } from '../services/api';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
  clearMessages: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  content: '你好！我是 GC TeamWork 智能协作助手。我可以帮你管理项目进度、起草文档、处理报销，或者检索公司知识库。今天有什么我可以帮你的吗？',
  agentType: 'dispatch',
  senderName: '通用调度 Agent',
  timestamp: new Date(),
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isLoading: false,
  error: null,

  sendMessage: async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      senderName: '用户',
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      // Build context from last few messages
      const context = get().messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const response = await chatService.sendMessage(content, context);

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.reply,
        agentType: response.agent_type,
        senderName: getAgentName(response.agent_type),
        timestamp: new Date(),
        cards: response.cards,
      };

      set((state) => ({
        messages: [...state.messages, agentMsg],
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '发送失败，请重试',
      });
    }
  },

  clearError: () => set({ error: null }),
  clearMessages: () => set({ messages: [WELCOME_MESSAGE] }),
}));

function getAgentName(agentType: string): string {
  const names: Record<string, string> = {
    dispatch: '通用调度 Agent',
    project: '项目管理 Agent',
    finance: '财务 Agent',
    legal: '法务 Agent',
    procurement: '采购 Agent',
    hr: '人事 Agent',
    bidding: '投标 Agent',
    document: '文档 Agent',
    knowledge: '知识库 Agent',
  };
  return names[agentType] || '智能助手';
}
