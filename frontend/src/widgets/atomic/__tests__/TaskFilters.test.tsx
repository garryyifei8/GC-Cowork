import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';

// ---------------------------------------------------------------------------
// Store mock — must be declared before any imports that use the store
// ---------------------------------------------------------------------------

const mockSetFilterStatus = vi.fn();
const mockSetFilterPriority = vi.fn();
const mockSetFilterProjectId = vi.fn();
const mockSetSearchQuery = vi.fn();
const mockFetchTasks = vi.fn();
const mockSetGroupBy = vi.fn();
const mockSetSortBy = vi.fn();
const mockToggleSortDir = vi.fn();

vi.mock('../../../stores/taskWorkbenchStore', () => ({
  useTaskWorkbenchStore: (selector: (s: any) => any) => {
    const state = {
      tasks: [],
      filterStatus: null,
      filterPriority: null,
      filterProjectId: null,
      viewMode: 'list' as const,
      groupBy: 'date' as const,
      searchQuery: '',
      sortBy: null,
      sortDir: 'asc' as const,
      setFilterStatus: mockSetFilterStatus,
      setFilterPriority: mockSetFilterPriority,
      setFilterProjectId: mockSetFilterProjectId,
      setSearchQuery: mockSetSearchQuery,
      fetchTasks: mockFetchTasks,
      setGroupBy: mockSetGroupBy,
      setSortBy: mockSetSortBy,
      toggleSortDir: mockToggleSortDir,
    };
    return selector(state);
  },
}));

// Import after mocks are registered
import TaskFilters from '../TaskFilters';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskFilters', () => {
  it('renders the new-task button', () => {
    renderWithRouter(<TaskFilters />);
    expect(screen.getByRole('button', { name: /新建任务/i })).toBeInTheDocument();
  });

  it('renders search toggle button', () => {
    renderWithRouter(<TaskFilters />);
    // The collapsed search button shows "搜索" label
    expect(screen.getByRole('button', { name: /搜索/i })).toBeInTheDocument();
  });

  it('expands search input when search button is clicked', () => {
    renderWithRouter(<TaskFilters />);
    const searchBtn = screen.getByRole('button', { name: /搜索/i });
    fireEvent.click(searchBtn);
    // After expanding, the real input appears
    expect(screen.getByRole('searchbox', { name: /搜索任务/i })).toBeInTheDocument();
  });

  it('renders status and priority filter inside the 筛选 dropdown', () => {
    renderWithRouter(<TaskFilters />);
    // Open the 筛选 dropdown
    const filterBtn = screen.getByRole('button', { name: /筛选/i });
    fireEvent.click(filterBtn);
    // Status section label
    expect(screen.getByText('状态')).toBeInTheDocument();
    // Priority section label
    expect(screen.getByText('优先级')).toBeInTheDocument();
    // "全部状态" and "全部优先级" options are present
    expect(screen.getByRole('button', { name: /全部状态/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /全部优先级/i })).toBeInTheDocument();
  });

  it('calls setFilterStatus with the selected status when a status filter item is clicked', () => {
    renderWithRouter(<TaskFilters />);
    // Open the 筛选 dropdown
    fireEvent.click(screen.getByRole('button', { name: /筛选/i }));
    // Click "进行中" status option
    fireEvent.click(screen.getByRole('button', { name: '进行中' }));
    expect(mockSetFilterStatus).toHaveBeenCalledWith('in_progress');
  });

  it('calls setFilterPriority with the selected priority when a priority filter item is clicked', () => {
    renderWithRouter(<TaskFilters />);
    // Open the 筛选 dropdown
    fireEvent.click(screen.getByRole('button', { name: /筛选/i }));
    // Click "高优先级" option
    fireEvent.click(screen.getByRole('button', { name: /高优先级/i }));
    expect(mockSetFilterPriority).toHaveBeenCalledWith('high');
  });

  it('search input fires setSearchQuery immediately on change', () => {
    renderWithRouter(<TaskFilters />);
    // Expand the search
    fireEvent.click(screen.getByRole('button', { name: /搜索/i }));
    const input = screen.getByRole('searchbox', { name: /搜索任务/i });

    fireEvent.change(input, { target: { value: '测试任务' } });
    // setSearchQuery is called immediately (store update is instant)
    expect(mockSetSearchQuery).toHaveBeenCalledWith('测试任务');
  });

  it('search input triggers fetchTasks after 300ms debounce', async () => {
    renderWithRouter(<TaskFilters />);
    // Expand the search
    fireEvent.click(screen.getByRole('button', { name: /搜索/i }));
    const input = screen.getByRole('searchbox', { name: /搜索任务/i });

    // Type in the search box
    fireEvent.change(input, { target: { value: 'debounce test' } });

    // fetchTasks should NOT have been called yet
    expect(mockFetchTasks).not.toHaveBeenCalled();

    // Advance timers past the debounce threshold
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // After 300 ms, fetchTasks should have been called
    expect(mockFetchTasks).toHaveBeenCalledTimes(1);
  });

  it('rapid search typing only triggers one fetchTasks after the debounce window', () => {
    renderWithRouter(<TaskFilters />);
    fireEvent.click(screen.getByRole('button', { name: /搜索/i }));
    const input = screen.getByRole('searchbox', { name: /搜索任务/i });

    // Simulate rapid typing — multiple changes within debounce window
    fireEvent.change(input, { target: { value: 'a' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: 'ab' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: 'abc' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Still within debounce window — should not have fired
    expect(mockFetchTasks).not.toHaveBeenCalled();

    // Complete the debounce window
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should fire exactly once despite 3 change events
    expect(mockFetchTasks).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape clears the search and collapses the input', () => {
    renderWithRouter(<TaskFilters />);
    fireEvent.click(screen.getByRole('button', { name: /搜索/i }));
    const input = screen.getByRole('searchbox', { name: /搜索任务/i });

    fireEvent.keyDown(input, { key: 'Escape' });

    // setSearchQuery should have been called with ''
    expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    // The input collapses back to the search button
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('calls onNewTask callback when 新建任务 button is clicked', () => {
    const onNewTask = vi.fn();
    renderWithRouter(<TaskFilters onNewTask={onNewTask} />);
    fireEvent.click(screen.getByRole('button', { name: /新建任务/i }));
    expect(onNewTask).toHaveBeenCalledTimes(1);
  });
});
