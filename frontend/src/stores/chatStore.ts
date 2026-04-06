import { create } from 'zustand';
import type { ChatMessage, InteractiveCard } from '../types';
import { chatService } from '../services/api';

/** What's displayed in the right artifact panel */
interface ArtifactContent {
  type: 'card' | 'text';
  card?: InteractiveCard;
  /** Full message text shown when user clicks "展开全文" */
  text?: string;
  title?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedArtifact: ArtifactContent | null;
  isPanelOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
  retryLastMessage: () => void;
  clearError: () => void;
  clearMessages: () => void;
  openArtifact: (card: InteractiveCard) => void;
  openTextArtifact: (text: string, title?: string) => void;
  closeArtifact: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  content:
    '你好！我是 AI小助理，你的智能工作伙伴。我可以帮你管理项目、分析数据、起草文档、处理报销，或者检索知识库。试试下面的快捷操作，或直接告诉我你需要什么帮助！',
  agentType: 'dispatch',
  senderName: '通用调度 Agent',
  timestamp: new Date(),
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isLoading: false,
  error: null,
  selectedArtifact: null,
  isPanelOpen: false,

  sendMessage: async (content: string) => {
    // ── 1. Add the user message ──────────────────────────────────────────────
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

    // ── 2. Insert an empty placeholder for the streaming agent reply ─────────
    const agentMsgId = (Date.now() + 1).toString();
    const agentPlaceholder: ChatMessage = {
      id: agentMsgId,
      role: 'agent',
      content: '',
      agentType: 'dispatch',
      senderName: '智能助手',
      timestamp: new Date(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, agentPlaceholder],
    }));

    // ── 3. Build context from the recent conversation history ────────────────
    const context = get()
      .messages.slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    // Helper: normalise cards coming from backend
    const normalizeCards = (rawCards: any[]) =>
      rawCards.map((card: any) => ({
        ...card,
        type: card.type || card.card_type || 'data',
        content: card.content || '',
        data: card.data || {},
        status: card.data?.severity || card.status,
        actions: card.actions || [],
      }));

    // ── 4. Stream tokens from the backend ────────────────────────────────────
    // Track <think> blocks to filter them out (qwq/reasoning models)
    let inThinkBlock = false;
    let tokenBuffer = '';

    try {
      await chatService.streamMessage(
        content,
        context,
        // onToken — append each arriving token, filtering <think> blocks
        (token) => {
          tokenBuffer += token;

          // Detect <think> open tag
          if (tokenBuffer.includes('<think>')) {
            inThinkBlock = true;
            tokenBuffer = tokenBuffer.replace(/<think>/g, '');
          }
          // Detect </think> close tag
          if (tokenBuffer.includes('</think>')) {
            inThinkBlock = false;
            tokenBuffer = tokenBuffer.split('</think>').pop() || '';
          }

          // Only emit visible tokens (skip thinking content)
          if (!inThinkBlock && tokenBuffer.length > 0) {
            // Don't emit partial <think or </think tags
            if (tokenBuffer.includes('<') && !tokenBuffer.includes('>')) return;

            const cleanToken = tokenBuffer;
            tokenBuffer = '';
            if (cleanToken.trim()) {
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === agentMsgId ? { ...m, content: m.content + cleanToken } : m
                ),
              }));
            }
          } else if (inThinkBlock) {
            tokenBuffer = ''; // Discard thinking content
          }
        },
        // onDone — finalise the agent message with type, name, and cards
        ({ agent_type, cards }) => {
          const normalizedCards = normalizeCards(cards);
          // Clean up any remaining content
          set((state) => ({
            messages: state.messages.map((m) => {
              if (m.id !== agentMsgId) return m;
              // Strip any leftover <think> tags and clean whitespace
              const cleaned = m.content
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .replace(/<think>[\s\S]*/g, '')
                .trim();
              return {
                ...m,
                content: cleaned,
                agentType: agent_type as ChatMessage['agentType'],
                senderName: getAgentName(agent_type),
                cards: normalizedCards,
                isStreaming: false,
              };
            }),
            isLoading: false,
          }));
        },
        // onError — convert the placeholder to an error message
        (errorMessage) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === agentMsgId
                ? {
                    ...m,
                    content: '',
                    isStreaming: false,
                    error: true,
                    errorMessage: errorMessage || 'AI 服务暂时不可用，请稍后重试',
                  }
                : m
            ),
            isLoading: false,
            error: errorMessage,
          }));
        }
      );
    } catch (err) {
      // Network / fetch-level failure: fall back to the non-streaming endpoint
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== agentMsgId),
        isLoading: true,
      }));

      try {
        const response = await chatService.sendMessage(content, context);

        const normalizedCards = normalizeCards(response.cards || []);

        const agentMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'agent',
          content: response.reply,
          agentType: response.agent_type,
          senderName: getAgentName(response.agent_type),
          timestamp: new Date(),
          cards: normalizedCards,
        };

        set((state) => ({
          messages: [...state.messages, agentMsg],
          isLoading: false,
        }));
      } catch (fallbackErr) {
        const errorText = fallbackErr instanceof Error ? fallbackErr.message : '发送失败，请重试';
        const errorMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'agent',
          content: '',
          agentType: 'dispatch',
          senderName: '智能助手',
          timestamp: new Date(),
          error: true,
          errorMessage: errorText,
        };
        set((state) => ({
          messages: [...state.messages, errorMsg],
          isLoading: false,
          error: errorText,
        }));
      }
    }
  },

  retryLastMessage: () => {
    const { messages, sendMessage } = get();
    // Find the last error message
    const lastError = [...messages].reverse().find((m) => m.error);
    if (!lastError) return;
    const lastErrorIndex = messages.indexOf(lastError);
    // Find the user message right before the error
    const userMsg = messages
      .slice(0, lastErrorIndex)
      .reverse()
      .find((m) => m.role === 'user');
    if (!userMsg) return;
    // Remove the error message and resend
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== lastError.id),
      error: null,
    }));
    sendMessage(userMsg.content);
  },

  clearError: () => set({ error: null }),
  clearMessages: () => set({ messages: [WELCOME_MESSAGE], selectedArtifact: null }),
  openArtifact: (card: InteractiveCard) => set({ selectedArtifact: { type: 'card', card } }),
  openTextArtifact: (text: string, title?: string) =>
    set({ selectedArtifact: { type: 'text', text, title: title || '详细内容' } }),
  closeArtifact: () => set({ selectedArtifact: null }),
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
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
    process_control: '过控 Agent',
    supervision: '监理 Agent',
  };
  return names[agentType] || '智能助手';
}
