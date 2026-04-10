/**
 * 4.7 Task Detail Update Button tests
 *
 * Tests the "更新" button in TaskDetailModal: typing a message and clicking
 * send creates a comment that appears in the activity/comments list.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';

// ---------------------------------------------------------------------------
// Mock taskService — use vi.hoisted so refs are available before vi.mock hoisting
// ---------------------------------------------------------------------------

const { mockCreateComment, mockListComments } = vi.hoisted(() => ({
  mockCreateComment: vi.fn(),
  mockListComments: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
  taskService: {
    listComments: mockListComments,
    createComment: mockCreateComment,
  },
}));

import { TaskDetailModal } from '../TaskDetailModal';
import type { TaskWithProject } from '../../../types';
import type { TaskComment } from '../../../services/api';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<TaskWithProject> = {}): TaskWithProject {
  return {
    id: 'task-1',
    project_id: 'proj-1',
    project_name: 'Test Project',
    name: 'Fix login bug',
    assignee: 'Alice',
    status: 'in_progress',
    priority: 'high',
    due_date: '2099-06-01',
    description: 'The login page throws an error.',
    ...overrides,
  };
}

function makeComment(overrides: Partial<TaskComment> = {}): TaskComment {
  return {
    id: 'c-1',
    project_id: 'proj-1',
    event_type: 'comment',
    actor: '当前用户',
    summary: 'This is a test comment',
    detail: {},
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // listComments resolves with an empty array by default
  mockListComments.mockResolvedValue([]);
  mockCreateComment.mockResolvedValue(makeComment());
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskDetailModal — Update Button', () => {
  it('renders the update textarea and send button', async () => {
    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    // The updates tab should be active by default
    expect(screen.getByPlaceholderText('撰写动态更新...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /更新/i })).toBeInTheDocument();
  });

  it('send button is disabled when textarea is empty', () => {
    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const sendBtn = screen.getByRole('button', { name: /更新/i });
    expect(sendBtn).toBeDisabled();
  });

  it('send button is enabled after typing a message', async () => {
    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const textarea = screen.getByPlaceholderText('撰写动态更新...');
    fireEvent.change(textarea, { target: { value: 'Progress update: completed step 1' } });

    const sendBtn = screen.getByRole('button', { name: /更新/i });
    expect(sendBtn).not.toBeDisabled();
  });

  it('clicking send calls taskService.createComment with the message', async () => {
    const createdComment = makeComment({ summary: 'Progress update: completed step 1' });
    mockCreateComment.mockResolvedValue(createdComment);

    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const textarea = screen.getByPlaceholderText('撰写动态更新...');
    fireEvent.change(textarea, { target: { value: 'Progress update: completed step 1' } });

    const sendBtn = screen.getByRole('button', { name: /更新/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith('task-1', 'Progress update: completed step 1');
    });
  });

  it('comment appears in the list after sending', async () => {
    const createdComment = makeComment({
      id: 'c-new',
      actor: '当前用户',
      summary: 'My new comment',
    });
    mockCreateComment.mockResolvedValue(createdComment);

    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const textarea = screen.getByPlaceholderText('撰写动态更新...');
    fireEvent.change(textarea, { target: { value: 'My new comment' } });

    const sendBtn = screen.getByRole('button', { name: /更新/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('My new comment')).toBeInTheDocument();
    });
  });

  it('clears the textarea after sending', async () => {
    mockCreateComment.mockResolvedValue(makeComment());

    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const textarea = screen.getByPlaceholderText('撰写动态更新...');
    fireEvent.change(textarea, { target: { value: 'A comment to send' } });

    const sendBtn = screen.getByRole('button', { name: /更新/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('existing comments from the API are displayed on mount', async () => {
    const existingComment = makeComment({
      id: 'c-existing',
      actor: 'Bob',
      summary: 'Existing comment from API',
    });
    mockListComments.mockResolvedValue([existingComment]);

    renderWithRouter(
      <TaskDetailModal
        task={makeTask()}
        onClose={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Existing comment from API')).toBeInTheDocument();
    });
  });
});
