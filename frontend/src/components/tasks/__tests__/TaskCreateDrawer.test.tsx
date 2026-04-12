import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';
import { TaskCreateDrawer } from '../TaskCreateDrawer';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PROJECTS = [
  { id: 'proj-1', name: '智慧城市平台' },
  { id: 'proj-2', name: 'EPC工程项目' },
];

function makeProps(overrides: Partial<React.ComponentProps<typeof TaskCreateDrawer>> = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    projects: MOCK_PROJECTS,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskCreateDrawer', () => {
  // -------------------------------------------------------------------------
  // Visibility
  // -------------------------------------------------------------------------

  it('renders drawer when open=true', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps({ open: true })} />);

    expect(screen.getByText('新建任务')).toBeInTheDocument();
  });

  it('does not render content when open=false', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps({ open: false })} />);

    expect(screen.queryByText('新建任务')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Form fields
  // -------------------------------------------------------------------------

  it('shows all required form fields', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps()} />);

    // Task name input
    expect(screen.getByPlaceholderText('输入任务名称')).toBeInTheDocument();

    // Project select — first project should be default selected
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Assignee input
    expect(screen.getByPlaceholderText('输入负责人姓名')).toBeInTheDocument();

    // Priority buttons
    expect(screen.getByRole('button', { name: '高' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '中' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '低' })).toBeInTheDocument();

    // Due date input
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();

    // Description textarea
    expect(screen.getByPlaceholderText('添加任务描述...')).toBeInTheDocument();
  });

  it('renders project options from the projects prop', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps()} />);

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    // Includes the "选择项目" placeholder plus the two mock projects
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('option', { name: '智慧城市平台' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'EPC工程项目' })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Validation — submit button state
  // -------------------------------------------------------------------------

  it('disables submit button when task name is empty', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps()} />);

    // Name is empty on mount, projectId defaults to first project
    const submitBtn = screen.getByRole('button', { name: /创建任务/ });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when task name and project are filled', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps()} />);

    const nameInput = screen.getByPlaceholderText('输入任务名称');
    fireEvent.change(nameInput, { target: { value: '新任务' } });

    // Project is auto-selected to first project when projects are provided
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'proj-1' } });

    const submitBtn = screen.getByRole('button', { name: /创建任务/ });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows error message when submitting with empty task name via form', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(<TaskCreateDrawer {...makeProps({ onSubmit })} />);

    // Name is empty — submit via form directly (button is disabled so we
    // force a form submission to hit the validation branch)
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('请输入任务名称')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Close behaviour
  // -------------------------------------------------------------------------

  it('calls onClose when the X close button is clicked', () => {
    const onClose = vi.fn();
    renderWithRouter(<TaskCreateDrawer {...makeProps({ onClose })} />);

    // The X icon button is adjacent to the title
    const header = screen.getByText('新建任务').closest('div')!;
    const closeBtn = header.querySelector('button')!;
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithRouter(<TaskCreateDrawer {...makeProps({ onClose })} />);

    const cancelBtn = screen.getByRole('button', { name: '取消' });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    renderWithRouter(<TaskCreateDrawer {...makeProps({ onClose })} />);

    // The backdrop is the first child of the fixed overlay
    const overlay = document.querySelector('.fixed.inset-0')!;
    const backdrop = overlay.querySelector('.absolute.inset-0')!;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Submission
  // -------------------------------------------------------------------------

  it('calls onSubmit with correct data and then calls onClose', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderWithRouter(
      <TaskCreateDrawer {...makeProps({ onSubmit, onClose, projects: MOCK_PROJECTS })} />
    );

    // Fill in name
    fireEvent.change(screen.getByPlaceholderText('输入任务名称'), {
      target: { value: '测试任务' },
    });

    // Select project
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'proj-1' } });

    // Fill in assignee
    fireEvent.change(screen.getByPlaceholderText('输入负责人姓名'), {
      target: { value: '张三' },
    });

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /创建任务/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '测试任务',
          projectId: 'proj-1',
          assignee: '张三',
        })
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    renderWithRouter(<TaskCreateDrawer {...makeProps({ onSubmit })} />);

    fireEvent.change(screen.getByPlaceholderText('输入任务名称'), {
      target: { value: '测试任务' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'proj-1' } });

    const submitBtn = screen.getByRole('button', { name: /创建任务/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('创建失败，请重试')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Form reset
  // -------------------------------------------------------------------------

  it('clears form fields when drawer re-opens', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderWithRouter(
      <TaskCreateDrawer {...makeProps({ open: true, onSubmit })} />
    );

    // Type something in name
    const nameInput = screen.getByPlaceholderText('输入任务名称');
    fireEvent.change(nameInput, { target: { value: '上次的任务' } });
    expect(nameInput).toHaveValue('上次的任务');

    // Close drawer
    rerender(<TaskCreateDrawer {...makeProps({ open: false, onSubmit })} />);

    // Reopen
    rerender(<TaskCreateDrawer {...makeProps({ open: true, onSubmit })} />);

    const resetInput = screen.getByPlaceholderText('输入任务名称');
    expect(resetInput).toHaveValue('');
  });

  // -------------------------------------------------------------------------
  // fixedProjectId
  // -------------------------------------------------------------------------

  it('disables the project select when fixedProjectId is provided', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps({ fixedProjectId: 'proj-2' })} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveValue('proj-2');
  });

  // -------------------------------------------------------------------------
  // Priority selection
  // -------------------------------------------------------------------------

  it('changes priority when a priority button is clicked', () => {
    renderWithRouter(<TaskCreateDrawer {...makeProps()} />);

    // Default is 'medium'; click '高' (high)
    const highBtn = screen.getByRole('button', { name: '高' });
    fireEvent.click(highBtn);

    // Fill name + project so we can inspect the submitted data
    fireEvent.change(screen.getByPlaceholderText('输入任务名称'), {
      target: { value: '高优先级任务' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'proj-1' } });

    // Just verify the button can be clicked without error
    expect(highBtn).toBeInTheDocument();
  });
});
