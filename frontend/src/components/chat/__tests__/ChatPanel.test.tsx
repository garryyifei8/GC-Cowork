import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';
import { ChatInput } from '../ChatInput';
import { WelcomeScreen } from '../WelcomeScreen';
import { AIChatPanel } from '../AIChatPanel';
import { useChatStore } from '../../../stores/chatStore';

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

describe('ChatInput', () => {
  it('renders the chat textarea', () => {
    const onSend = vi.fn();
    renderWithRouter(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/发送消息/);
    expect(textarea).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    const onSend = vi.fn();
    renderWithRouter(<ChatInput onSend={onSend} />);

    const sendButton = screen.getByTitle('发送');
    expect(sendButton).toBeDisabled();
  });

  it('does not call onSend when input is blank', () => {
    const onSend = vi.fn();
    renderWithRouter(<ChatInput onSend={onSend} />);

    const sendButton = screen.getByTitle('发送');
    fireEvent.click(sendButton);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('send button becomes enabled when text is entered', () => {
    const onSend = vi.fn();
    renderWithRouter(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/发送消息/);
    fireEvent.change(textarea, { target: { value: '你好' } });

    const sendButton = screen.getByTitle('发送');
    expect(sendButton).not.toBeDisabled();
  });

  it('calls onSend with trimmed text when send button is clicked', () => {
    const onSend = vi.fn();
    renderWithRouter(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/发送消息/);
    fireEvent.change(textarea, { target: { value: '  帮我分析一下  ' } });

    const sendButton = screen.getByTitle('发送');
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('帮我分析一下');
  });

  it('is fully disabled when disabled prop is true', () => {
    const onSend = vi.fn();
    renderWithRouter(<ChatInput onSend={onSend} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/发送消息/);
    expect(textarea).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// WelcomeScreen
// ---------------------------------------------------------------------------

describe('WelcomeScreen', () => {
  it('renders the AI assistant title', () => {
    const onAction = vi.fn();
    renderWithRouter(<WelcomeScreen onAction={onAction} />);

    expect(screen.getByText('AI小助理')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    const onAction = vi.fn();
    renderWithRouter(<WelcomeScreen onAction={onAction} />);

    expect(screen.getByText('项目概览')).toBeInTheDocument();
    expect(screen.getByText('生成周报')).toBeInTheDocument();
    expect(screen.getByText('风险分析')).toBeInTheDocument();
  });

  it('calls onAction when a quick action button is clicked', () => {
    const onAction = vi.fn();
    renderWithRouter(<WelcomeScreen onAction={onAction} />);

    const btn = screen.getByText('项目概览');
    fireEvent.click(btn);

    expect(onAction).toHaveBeenCalledWith(expect.stringContaining('进度概览'));
  });

  it('quick action buttons are disabled when disabled prop is true', () => {
    const onAction = vi.fn();
    renderWithRouter(<WelcomeScreen onAction={onAction} disabled={true} />);

    const btn = screen.getByText('项目概览');
    expect(btn.closest('button')).toBeDisabled();
  });

  it('renders subtitle text', () => {
    const onAction = vi.fn();
    renderWithRouter(<WelcomeScreen onAction={onAction} />);

    expect(screen.getByText(/你的智能工作伙伴/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AIChatPanel
// ---------------------------------------------------------------------------

describe('AIChatPanel', () => {
  beforeEach(() => {
    act(() => {
      useChatStore.setState({ isPanelOpen: false, messages: [], isLoading: false });
    });
  });

  afterEach(() => {
    act(() => {
      useChatStore.setState({ isPanelOpen: false });
    });
  });

  it('renders the AI chat panel when open', () => {
    act(() => {
      useChatStore.setState({ isPanelOpen: true });
    });

    renderWithRouter(<AIChatPanel />);

    expect(screen.getByText('AI 智能助手')).toBeInTheDocument();
  });

  it('renders quick suggestion chips when panel is open', () => {
    act(() => {
      useChatStore.setState({ isPanelOpen: true });
    });

    renderWithRouter(<AIChatPanel />);

    // Default suggestions for the root path are dashboard suggestions
    expect(screen.getByText('查看进度')).toBeInTheDocument();
  });

  it('renders the welcome message content when no conversation', () => {
    act(() => {
      useChatStore.setState({
        isPanelOpen: true,
        messages: [
          {
            id: 'welcome',
            role: 'agent',
            content: '你好！我是 AI小助理，你的智能工作伙伴。',
            agentType: 'dispatch',
            senderName: '通用调度 Agent',
            timestamp: new Date(),
          },
        ],
      });
    });

    renderWithRouter(<AIChatPanel />);

    expect(screen.getByText(/AI小助理/)).toBeInTheDocument();
  });
});
