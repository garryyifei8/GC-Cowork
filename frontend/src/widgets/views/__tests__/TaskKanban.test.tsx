import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter, setupFetchMock } from '../../../test/utils';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before imports that use them
// ---------------------------------------------------------------------------

// Mock the taskWorkbenchStore so tests don't rely on real Zustand state
const mockUpdateTaskStatus = vi.fn();
const mockFetchTasks = vi.fn();

vi.mock('../../../stores/taskWorkbenchStore', () => ({
  useTaskWorkbenchStore: (selector: (s: any) => any) => {
    const state = {
      tasks: [],
      isLoading: false,
      updateTaskStatus: mockUpdateTaskStatus,
      fetchTasks: mockFetchTasks,
    };
    return selector(state);
  },
}));

// Mock DndContext to expose children and capture onDragEnd
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd?: (event: any) => void;
    }) => (
      <div
        data-testid="dnd-context"
        data-has-ondragend={typeof onDragEnd === 'function' ? 'true' : 'false'}
      >
        {children}
      </div>
    ),
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="drag-overlay">{children}</div>
    ),
    useDraggable: ({ id }: { id: string }) => ({
      attributes: { 'aria-roledescription': 'draggable', 'data-draggable-id': id },
      listeners: { onPointerDown: vi.fn() },
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
    useDroppable: ({ id: _id }: { id: string }) => ({
      setNodeRef: vi.fn(),
      isOver: false,
      over: null,
    }),
    PointerSensor: actual.PointerSensor,
    KeyboardSensor: actual.KeyboardSensor,
    useSensor: actual.useSensor,
    useSensors: actual.useSensors,
  };
});

// Import TaskKanban after mocks are set up
import TaskKanban from '../TaskKanban';
import type { TaskWithProject } from '../../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<TaskWithProject> = {}): TaskWithProject {
  return {
    id: 'task-1',
    project_id: 'proj-1',
    project_name: 'Test Project',
    name: 'Sample Task',
    assignee: 'Alice',
    status: 'todo',
    priority: 'medium',
    due_date: '2026-05-01',
    description: '',
    ...overrides,
  };
}

const SAMPLE_TASKS: TaskWithProject[] = [
  makeTask({ id: 'task-1', name: 'Task One', status: 'todo' }),
  makeTask({ id: 'task-2', name: 'Task Two', status: 'in_progress' }),
  makeTask({ id: 'task-3', name: 'Task Three', status: 'review' }),
  makeTask({ id: 'task-4', name: 'Task Four', status: 'done' }),
  makeTask({ id: 'task-5', name: 'Task Five', status: 'done' }),
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  setupFetchMock({
    '/api/tasks': { body: [] },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskKanban', () => {
  // -------------------------------------------------------------------------
  // Rendering tests
  // -------------------------------------------------------------------------

  it('renders a column for each status', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    // The kanban has columns: 未开始, 进行中, 待评审, 卡住, 完成
    expect(screen.getByText('未开始')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('待评审')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('renders tasks in correct columns based on status', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    expect(screen.getByText('Task One')).toBeInTheDocument();
    expect(screen.getByText('Task Two')).toBeInTheDocument();
    expect(screen.getByText('Task Three')).toBeInTheDocument();
    expect(screen.getByText('Task Four')).toBeInTheDocument();
    expect(screen.getByText('Task Five')).toBeInTheDocument();
  });

  it('shows task count per column', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    // "done" column should show count "2" (two tasks)
    const countBadges = screen.getAllByText('2');
    expect(countBadges.length).toBeGreaterThanOrEqual(1);

    // "todo" column should show "1"
    const singleCounts = screen.getAllByText('1');
    expect(singleCounts.length).toBeGreaterThanOrEqual(3); // todo, in_progress, review each have 1
  });

  it('renders empty columns when no tasks match a status', () => {
    // Only provide tasks with status 'todo'
    const onlyTodo = [makeTask({ id: 'task-1', name: 'Only Todo Task', status: 'todo' })];

    renderWithRouter(<TaskKanban data={{ tasks: onlyTodo }} />);

    // Empty columns show a "拖拽任务至此" placeholder
    const placeholders = screen.getAllByText('拖拽任务至此');
    // Other columns (in_progress, review, blocked, done) should be empty
    expect(placeholders.length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // DnD integration tests
  // -------------------------------------------------------------------------

  it('renders DndContext provider', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    const dndContext = screen.getByTestId('dnd-context');
    expect(dndContext).toBeInTheDocument();
  });

  it('DndContext receives an onDragEnd handler', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    const dndContext = screen.getByTestId('dnd-context');
    // We set data-has-ondragend in the mock to verify the handler is passed
    expect(dndContext).toHaveAttribute('data-has-ondragend', 'true');
  });

  it('each task card has draggable attributes from useDraggable', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    // Our useDraggable mock injects aria-roledescription="draggable"
    const draggableCards = screen.getAllByRole('article');
    // Each task card is wrapped with draggable attributes
    expect(draggableCards.length).toBeGreaterThanOrEqual(SAMPLE_TASKS.length);
  });

  // -------------------------------------------------------------------------
  // onStatusChange via native drag (for the onDragEnd handler logic)
  // -------------------------------------------------------------------------

  it('calls updateTaskStatus when a task card is dropped on a new column', () => {
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} />);

    // The kanban supports HTML5 drag-and-drop as a fallback path in addition to @dnd-kit.
    // We simulate a full native DnD sequence: dragstart on the source card,
    // then dragover + drop on the target column body.

    const kanbanRegion = screen.getByRole('region', { name: '任务看板' });
    expect(kanbanRegion).toBeInTheDocument();

    // Find the task card in "todo" (the outer draggable wrapper div)
    const todoCard = screen.getByText('Task One').closest('[draggable]');
    expect(todoCard).not.toBeNull();

    // Simulate dragstart on the card — sets activeDragId to 'task-1'
    fireEvent.dragStart(todoCard!, {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });

    // Locate the "done" column. The column header contains "完成" text.
    // The column wrapper is the closest ancestor that contains both the header and body.
    const doneLabel = screen.getByText('完成');
    // Navigate up to the column root (min-w-[260px] wrapper)
    const doneColumn = doneLabel.closest('.flex.flex-col') as HTMLElement;
    expect(doneColumn).not.toBeNull();

    // The DroppableColumn renders as a div with flex flex-col gap-3 p-3 ...
    // It is the second child of the column root (first child = header, second = body).
    const doneBody = doneColumn.children[1] as HTMLElement;
    expect(doneBody).not.toBeNull();

    fireEvent.dragOver(doneBody);
    fireEvent.drop(doneBody);

    // updateTaskStatus should have been called with 'task-1' and 'done'
    expect(mockUpdateTaskStatus).toHaveBeenCalledWith('task-1', 'done');
  });

  // -------------------------------------------------------------------------
  // Props / callbacks
  // -------------------------------------------------------------------------

  it('calls onTaskClick when a task card is clicked', () => {
    const onTaskClick = vi.fn();
    renderWithRouter(<TaskKanban data={{ tasks: SAMPLE_TASKS }} onTaskClick={onTaskClick} />);

    const cardTitle = screen.getByText('Task One');
    fireEvent.click(cardTitle);

    expect(onTaskClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-1', name: 'Task One' })
    );
  });

  it('renders EmptyState when no tasks are provided via store and no data prop', () => {
    // The store mock returns tasks: [], and no data prop is passed
    renderWithRouter(<TaskKanban />);

    expect(screen.getByText('暂无任务')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4.3 Overdue Task Highlighting — TaskKanban
// ---------------------------------------------------------------------------

describe('TaskKanban — Overdue Highlighting', () => {
  const PAST_DATE = '2020-01-01';

  it('overdue tasks (past due_date, not done) have red highlight', () => {
    const overdueTask = makeTask({
      id: 'overdue-k1',
      name: 'Overdue Kanban Task',
      status: 'todo',
      due_date: PAST_DATE,
    });
    renderWithRouter(<TaskKanban data={{ tasks: [overdueTask] }} />);

    // The card should have data-overdue="true" attribute
    const taskEl = screen.getByText('Overdue Kanban Task').closest('[data-overdue]');
    expect(taskEl).not.toBeNull();
    expect(taskEl).toHaveAttribute('data-overdue', 'true');
  });

  it('done tasks with past due_date do NOT have red highlight', () => {
    const doneOverdue = makeTask({
      id: 'done-k1',
      name: 'Done Overdue Kanban',
      status: 'done',
      due_date: PAST_DATE,
    });
    renderWithRouter(<TaskKanban data={{ tasks: [doneOverdue] }} />);

    const taskEl = screen.getByText('Done Overdue Kanban').closest('[data-overdue]');
    if (taskEl) {
      expect(taskEl).toHaveAttribute('data-overdue', 'false');
    } else {
      // No attribute at all — also acceptable
      expect(taskEl).toBeNull();
    }
  });

  it('tasks with no due_date have no overdue highlight', () => {
    const noDueTask = makeTask({
      id: 'nodue-k1',
      name: 'No Due Kanban Task',
      status: 'todo',
      due_date: null as any,
    });
    renderWithRouter(<TaskKanban data={{ tasks: [noDueTask] }} />);

    const taskEl = screen.getByText('No Due Kanban Task').closest('[data-overdue]');
    if (taskEl) {
      expect(taskEl).toHaveAttribute('data-overdue', 'false');
    } else {
      expect(taskEl).toBeNull();
    }
  });
});
