import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';
import { ProjectCreateDrawer } from '../ProjectCreateDrawer';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof ProjectCreateDrawer>> = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectCreateDrawer', () => {
  // -------------------------------------------------------------------------
  // Visibility
  // -------------------------------------------------------------------------

  it('renders when open=true', () => {
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ open: true })} />);

    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ open: false })} />);

    expect(screen.queryByText('新建项目')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Form fields
  // -------------------------------------------------------------------------

  it('shows all form fields: name, type, budget, due date, manager', () => {
    renderWithRouter(<ProjectCreateDrawer {...makeProps()} />);

    // Project name — required field with asterisk label
    expect(screen.getByPlaceholderText('输入项目名称')).toBeInTheDocument();

    // Project type — rendered as toggle buttons (one per type)
    expect(screen.getByRole('button', { name: 'EPC / 展馆' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EPC / 公建' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EPC / 市政' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '信息化开发' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '专项债咨询' })).toBeInTheDocument();

    // Budget display
    expect(screen.getByPlaceholderText('如: 1.2亿、450万')).toBeInTheDocument();

    // Due date
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();

    // Manager
    expect(screen.getByPlaceholderText('输入项目经理姓名')).toBeInTheDocument();

    // Description textarea
    expect(screen.getByPlaceholderText('简要描述项目概况...')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  it('disables submit button when name is empty', () => {
    renderWithRouter(<ProjectCreateDrawer {...makeProps()} />);

    const submitBtn = screen.getByRole('button', { name: /创建项目/ });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button once a project name is typed', () => {
    renderWithRouter(<ProjectCreateDrawer {...makeProps()} />);

    fireEvent.change(screen.getByPlaceholderText('输入项目名称'), {
      target: { value: '测试项目' },
    });

    const submitBtn = screen.getByRole('button', { name: /创建项目/ });
    expect(submitBtn).not.toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Cancel / close behaviour
  // -------------------------------------------------------------------------

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ onClose })} />);

    const cancelBtn = screen.getByRole('button', { name: '取消' });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the X header button is clicked', () => {
    const onClose = vi.fn();
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ onClose })} />);

    // The X icon button is in the header alongside the title
    const header = screen.getByText('新建项目').closest('div')!;
    const closeBtn = header.querySelector('button')!;
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop overlay is clicked', () => {
    const onClose = vi.fn();
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ onClose })} />);

    const overlay = document.querySelector('.fixed.inset-0')!;
    const backdrop = overlay.querySelector('.absolute.inset-0')!;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Submission
  // -------------------------------------------------------------------------

  it('calls onSubmit with form data on submit and then calls onClose', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ onSubmit, onClose })} />);

    // Fill project name (required)
    fireEvent.change(screen.getByPlaceholderText('输入项目名称'), {
      target: { value: '智慧城市项目' },
    });

    // Select project type
    fireEvent.click(screen.getByRole('button', { name: 'EPC / 展馆' }));

    // Fill manager
    fireEvent.change(screen.getByPlaceholderText('输入项目经理姓名'), {
      target: { value: '张三' },
    });

    // Fill budget
    fireEvent.change(screen.getByPlaceholderText('如: 1.2亿、450万'), {
      target: { value: '1.2亿' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /创建项目/ }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '智慧城市项目',
          project_type: 'EPC / 展馆',
          manager: '张三',
          budget_display: '1.2亿',
        })
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    renderWithRouter(<ProjectCreateDrawer {...makeProps({ onSubmit })} />);

    fireEvent.change(screen.getByPlaceholderText('输入项目名称'), {
      target: { value: '测试项目' },
    });

    fireEvent.click(screen.getByRole('button', { name: /创建项目/ }));

    await waitFor(() => {
      expect(screen.getByText('创建失败，请重试')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Form reset
  // -------------------------------------------------------------------------

  it('resets form when the drawer is reopened after closing', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderWithRouter(
      <ProjectCreateDrawer {...makeProps({ open: true, onSubmit })} />
    );

    // Type something in name
    const nameInput = screen.getByPlaceholderText('输入项目名称');
    fireEvent.change(nameInput, { target: { value: '旧项目名称' } });
    expect(nameInput).toHaveValue('旧项目名称');

    // Close the drawer
    rerender(<ProjectCreateDrawer {...makeProps({ open: false, onSubmit })} />);

    // Reopen the drawer
    rerender(<ProjectCreateDrawer {...makeProps({ open: true, onSubmit })} />);

    // Name should be cleared
    const resetInput = screen.getByPlaceholderText('输入项目名称');
    expect(resetInput).toHaveValue('');
  });
});
