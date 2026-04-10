import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithRouter, setupFetchMock } from '../../../test/utils';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before imports that use them
// ---------------------------------------------------------------------------

const mockUpdateTaskStatus = vi.fn();
const mockUpdateTaskPriority = vi.fn();

vi.mock('../../../stores/taskWorkbenchStore', () => ({
  useTaskWorkbenchStore: (selector: (s: any) => any) => {
    const state = {
      tasks: [],
      groupBy: 'none',
      updateTaskStatus: mockUpdateTaskStatus,
      updateTaskPriority: mockUpdateTaskPriority,
      selectedTaskIds: new Set<string>(),
      toggleTaskSelection: vi.fn(),
      selectAllTasks: vi.fn(),
      clearSelection: vi.fn(),
    };
    return selector(state);
  },
}));

import TaskList from '../TaskList';
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
    due_date: '2099-05-01', // future — not overdue
    description: '',
    ...overrides,
  };
}

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const PAST_DATE = '2020-01-01';

const SAMPLE_TASKS: TaskWithProject[] = [
  makeTask({
    id: 't1',
    name: 'Alpha Task',
    status: 'todo',
    priority: 'high',
    due_date: '2099-03-01',
    project_name: 'Alpha Project',
  }),
  makeTask({
    id: 't2',
    name: 'Beta Task',
    status: 'done',
    priority: 'low',
    due_date: '2099-01-15',
    project_name: 'Beta Project',
  }),
  makeTask({
    id: 't3',
    name: 'Gamma Task',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2099-06-30',
    project_name: 'Alpha Project',
  }),
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  setupFetchMock({ '/api/tasks': { body: [] } });
});

// ---------------------------------------------------------------------------
// 4.1 Task List Sorting
// ---------------------------------------------------------------------------

describe('TaskList — Sorting', () => {
  it('renders sortable column headers', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    // Column headers should be rendered as clickable buttons
    expect(screen.getByRole('button', { name: /名称|任务名|name/i })).toBeInTheDocument();
  });

  it('renders sort headers for name, status, priority, due_date', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    // All sortable columns should be present
    expect(screen.getByTestId('sort-header-name')).toBeInTheDocument();
    expect(screen.getByTestId('sort-header-status')).toBeInTheDocument();
    expect(screen.getByTestId('sort-header-priority')).toBeInTheDocument();
    expect(screen.getByTestId('sort-header-due_date')).toBeInTheDocument();
  });

  it('sorts tasks by name ascending on first click', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    const nameHeader = screen.getByTestId('sort-header-name');
    fireEvent.click(nameHeader);

    // After sorting by name ascending, Alpha should appear before Beta before Gamma
    // Task names are rendered as h4 headings
    const taskNames = screen.getAllByRole('heading', { level: 4 });
    const textContents = taskNames.map((el) => el.textContent ?? '');
    // alpha < beta < gamma alphabetically
    const alphaIdx = textContents.findIndex((t) => t.includes('Alpha'));
    const betaIdx = textContents.findIndex((t) => t.includes('Beta'));
    const gammaIdx = textContents.findIndex((t) => t.includes('Gamma'));
    expect(alphaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(gammaIdx);
  });

  it('toggles sort direction on second click of same header', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    const nameHeader = screen.getByTestId('sort-header-name');

    // First click: asc
    fireEvent.click(nameHeader);
    let taskHeadings = screen.getAllByRole('heading', { level: 4 });
    const firstAsc = taskHeadings.map((el) => el.textContent ?? '');
    const alphaFirst =
      firstAsc.findIndex((t) => t.includes('Alpha')) <
      firstAsc.findIndex((t) => t.includes('Gamma'));
    expect(alphaFirst).toBe(true);

    // Second click: desc
    fireEvent.click(nameHeader);
    taskHeadings = screen.getAllByRole('heading', { level: 4 });
    const firstDesc = taskHeadings.map((el) => el.textContent ?? '');
    const gammaFirst =
      firstDesc.findIndex((t) => t.includes('Gamma')) <
      firstDesc.findIndex((t) => t.includes('Alpha'));
    expect(gammaFirst).toBe(true);
  });

  it('shows sort indicator (arrow) on the active sort column', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    const nameHeader = screen.getByTestId('sort-header-name');
    fireEvent.click(nameHeader);

    // Active sort column should have aria-sort attribute or a sort indicator element
    expect(nameHeader).toHaveAttribute('aria-sort');
  });

  it('sorts tasks by priority', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    fireEvent.click(screen.getByTestId('sort-header-priority'));

    // After sorting by priority ascending (high=0, medium=1, low=2)
    // Alpha Task (high) should come first, then Gamma (medium), then Beta (low)
    const taskNames = screen.getAllByText(/Alpha Task|Beta Task|Gamma Task/);
    const textContents = taskNames.map((el) => el.textContent);
    const alphaIdx = textContents.findIndex((t) => t?.includes('Alpha'));
    const betaIdx = textContents.findIndex((t) => t?.includes('Beta'));
    const gammaIdx = textContents.findIndex((t) => t?.includes('Gamma'));
    expect(alphaIdx).toBeLessThan(gammaIdx);
    expect(gammaIdx).toBeLessThan(betaIdx);
  });

  it('sorts tasks by due_date', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    fireEvent.click(screen.getByTestId('sort-header-due_date'));

    // 2099-01-15 (Beta) < 2099-03-01 (Alpha) < 2099-06-30 (Gamma)
    const taskNames = screen.getAllByText(/Alpha Task|Beta Task|Gamma Task/);
    const textContents = taskNames.map((el) => el.textContent);
    const betaIdx = textContents.findIndex((t) => t?.includes('Beta'));
    const alphaIdx = textContents.findIndex((t) => t?.includes('Alpha'));
    const gammaIdx = textContents.findIndex((t) => t?.includes('Gamma'));
    expect(betaIdx).toBeLessThan(alphaIdx);
    expect(alphaIdx).toBeLessThan(gammaIdx);
  });
});

// ---------------------------------------------------------------------------
// 4.2 Task Grouping — already supported by TaskList, test the group-by selector
// ---------------------------------------------------------------------------

describe('TaskList — Grouping', () => {
  it('renders a group-by selector', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    // A group-by dropdown/select should exist
    expect(screen.getByTestId('group-by-selector')).toBeInTheDocument();
  });

  it('group-by selector has options: none, priority, project, date', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'none' }} />);

    const selector = screen.getByTestId('group-by-selector');
    expect(selector).toBeInTheDocument();
    // Options should include the four grouping modes
    expect(screen.getByText(/不分组|无/)).toBeInTheDocument();
  });

  it('renders section headers when grouped by priority', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'priority' }} />);

    // Priority group headers are rendered as h5 elements: 高, 中, 低
    const headings = screen.getAllByRole('heading', { level: 5 });
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts.some((t) => t?.includes('高'))).toBe(true);
    expect(headingTexts.some((t) => t?.includes('中'))).toBe(true);
    expect(headingTexts.some((t) => t?.includes('低'))).toBe(true);
  });

  it('renders project names as section headers when grouped by project', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'project' }} />);

    const headings = screen.getAllByRole('heading', { level: 5 });
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts.some((t) => t?.includes('Alpha Project'))).toBe(true);
    expect(headingTexts.some((t) => t?.includes('Beta Project'))).toBe(true);
  });

  it('sections are collapsible — clicking header collapses tasks', () => {
    renderWithRouter(<TaskList data={{ tasks: SAMPLE_TASKS, groupBy: 'priority' }} />);

    // Tasks in the high group should be visible initially
    expect(screen.getByText('Alpha Task')).toBeInTheDocument();

    // Find the collapse button for the '高' section (first aria-expanded button)
    const collapseButtons = screen.getAllByRole('button', { expanded: true });
    expect(collapseButtons.length).toBeGreaterThanOrEqual(1);

    // Click the first collapse button (高 priority group)
    fireEvent.click(collapseButtons[0]);

    // Tasks in the high group should now be hidden
    expect(screen.queryByText('Alpha Task')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4.3 Overdue Task Highlighting — TaskList
// ---------------------------------------------------------------------------

describe('TaskList — Overdue Highlighting', () => {
  it('overdue tasks (past due_date, not done) have red highlight', () => {
    const overdueTask = makeTask({
      id: 'overdue-1',
      name: 'Overdue Task',
      status: 'todo',
      due_date: PAST_DATE,
    });
    renderWithRouter(<TaskList data={{ tasks: [overdueTask], groupBy: 'none' }} />);

    const taskEl = screen.getByText('Overdue Task').closest('[data-overdue]');
    expect(taskEl).not.toBeNull();
    expect(taskEl).toHaveAttribute('data-overdue', 'true');
  });

  it('done tasks with past due_date do NOT have red highlight', () => {
    const doneOverdueTask = makeTask({
      id: 'done-overdue',
      name: 'Done Overdue Task',
      status: 'done',
      due_date: PAST_DATE,
    });
    renderWithRouter(<TaskList data={{ tasks: [doneOverdueTask], groupBy: 'none' }} />);

    const taskEl = screen.getByText('Done Overdue Task').closest('[data-overdue]');
    // Either no data-overdue attribute, or it's false
    if (taskEl) {
      expect(taskEl).toHaveAttribute('data-overdue', 'false');
    } else {
      // No overdue attribute at all — that's also fine
      expect(taskEl).toBeNull();
    }
  });

  it('tasks with no due_date have no overdue highlight', () => {
    const noDueTask = makeTask({
      id: 'no-due',
      name: 'No Due Task',
      status: 'todo',
      due_date: null,
    });
    renderWithRouter(<TaskList data={{ tasks: [noDueTask], groupBy: 'none' }} />);

    const taskEl = screen.getByText('No Due Task').closest('[data-overdue]');
    if (taskEl) {
      expect(taskEl).toHaveAttribute('data-overdue', 'false');
    } else {
      expect(taskEl).toBeNull();
    }
  });
});
