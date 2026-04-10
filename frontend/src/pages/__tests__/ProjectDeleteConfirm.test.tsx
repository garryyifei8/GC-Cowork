import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../../test/utils';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  return {
    open: true,
    title: '删除项目',
    message: '确定要删除该项目吗？此操作不可撤销，项目下的所有任务、里程碑、风险等数据将一并删除。',
    confirmLabel: '删除',
    cancelLabel: '取消',
    variant: 'danger' as const,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Project Delete Confirmation', () => {
  // -------------------------------------------------------------------------
  // Visibility
  // -------------------------------------------------------------------------

  it('ConfirmDialog renders when open=true', () => {
    renderWithRouter(<ConfirmDialog {...makeProps({ open: true })} />);

    expect(screen.getByText('删除项目')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('ConfirmDialog is hidden when open=false', () => {
    renderWithRouter(<ConfirmDialog {...makeProps({ open: false })} />);

    expect(screen.queryByText('删除项目')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Content
  // -------------------------------------------------------------------------

  it('shows warning message about irreversible action', () => {
    renderWithRouter(<ConfirmDialog {...makeProps()} />);

    // The message contains the irreversible warning phrase
    expect(screen.getByText(/此操作不可撤销/)).toBeInTheDocument();
  });

  it('renders with danger variant: confirm button has red styling', () => {
    renderWithRouter(<ConfirmDialog {...makeProps({ variant: 'danger' })} />);

    const confirmBtn = screen.getByRole('button', { name: '删除' });
    // danger variant applies bg-red-600 class to the confirm button
    expect(confirmBtn.className).toMatch(/bg-red/);
  });

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    renderWithRouter(<ConfirmDialog {...makeProps({ onConfirm })} />);

    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderWithRouter(<ConfirmDialog {...makeProps({ onCancel })} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the backdrop overlay is clicked', () => {
    const onCancel = vi.fn();
    renderWithRouter(<ConfirmDialog {...makeProps({ onCancel })} />);

    // Backdrop is the absolute overlay inside the fixed container
    const backdrop = document.querySelector('.fixed.inset-0 .absolute.inset-0')!;
    fireEvent.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it('disables both buttons and shows loading text when loading=true', () => {
    renderWithRouter(<ConfirmDialog {...makeProps({ loading: true })} />);

    const confirmBtn = screen.getByRole('button', { name: /处理中/ });
    const cancelBtn = screen.getByRole('button', { name: '取消' });

    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Custom labels
  // -------------------------------------------------------------------------

  it('uses custom confirmLabel and cancelLabel props', () => {
    renderWithRouter(
      <ConfirmDialog
        {...makeProps({
          confirmLabel: '确认删除',
          cancelLabel: '再想想',
        })}
      />
    );

    expect(screen.getByRole('button', { name: '确认删除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再想想' })).toBeInTheDocument();
  });
});
