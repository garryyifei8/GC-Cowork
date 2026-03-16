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
  content: '你好！我是 AI小助理，你的智能工作伙伴。我可以帮你管理项目、分析数据、起草文档、处理报销，或者检索知识库。试试下面的快捷操作，或直接告诉我你需要什么帮助！',
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
    try {
      await chatService.streamMessage(
        content,
        context,
        // onToken — append each arriving token to the placeholder message
        (token) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === agentMsgId ? { ...m, content: m.content + token } : m,
            ),
          }));
        },
        // onDone — finalise the agent message with type, name, and cards
        ({ agent_type, cards }) => {
          const normalizedCards = normalizeCards(cards);
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === agentMsgId
                ? {
                  ...m,
                  agentType: agent_type as ChatMessage['agentType'],
                  senderName: getAgentName(agent_type),
                  cards: normalizedCards,
                  isStreaming: false,
                }
                : m,
            ),
            isLoading: false,
          }));
        },
        // onError — remove the empty placeholder and surface the error
        (errorMessage) => {
          set((state) => ({
            // Keep the placeholder only if some content already arrived
            messages: state.messages.filter(
              (m) => m.id !== agentMsgId || m.content.length > 0,
            ),
            isLoading: false,
            error: errorMessage,
          }));
        },
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
        set({
          isLoading: false,
          error:
            fallbackErr instanceof Error ? fallbackErr.message : '发送失败，请重试',
        });
      }
    }
  },

  clearError: () => set({ error: null }),
  clearMessages: () => set({ messages: [WELCOME_MESSAGE], selectedArtifact: null }),
  openArtifact: (card: InteractiveCard) => set({ selectedArtifact: { type: 'card', card } }),
  openTextArtifact: (text: string, title?: string) => set({ selectedArtifact: { type: 'text', text, title: title || '详细内容' } }),
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
  };
  return names[agentType] || '智能助手';
}
