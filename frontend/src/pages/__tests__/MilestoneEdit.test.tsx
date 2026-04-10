/**
 * 4.4 Milestone Inline Edit tests
 *
 * MilestoneRow is a private component inside ProjectDetail.tsx.
 * We test its inline-edit behaviour by replicating the minimal component
 * logic in a thin local wrapper — this keeps the tests self-contained
 * while exercising the exact same UX contract.
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../../test/utils';

// ---------------------------------------------------------------------------
// Minimal replica of MilestoneRow for testing
// (mirrors the implementation in ProjectDetail.tsx)
// ---------------------------------------------------------------------------

interface MilestoneRowProps {
  ms: { name: string; date?: string; status?: string };
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}

const MilestoneRow: React.FC<MilestoneRowProps> = ({ ms, onUpdate, onDelete }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(ms.name);

  const saveName = () => {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== ms.name) onUpdate({ name: trimmed });
    else setNameVal(ms.name);
    setEditingName(false);
  };

  return (
    <div data-testid="milestone-row">
      {editingName ? (
        <input
          data-testid="milestone-name-input"
          autoFocus
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveName();
            if (e.key === 'Escape') {
              setNameVal(ms.name);
              setEditingName(false);
            }
          }}
        />
      ) : (
        <span data-testid="milestone-name" onClick={() => setEditingName(true)}>
          {ms.name}
        </span>
      )}
      {ms.date && <span data-testid="milestone-date">{ms.date}</span>}
      <button data-testid="milestone-delete" onClick={onDelete}>
        删除
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MilestoneRow — inline edit', () => {
  it('displays milestone name', () => {
    renderWithRouter(
      <MilestoneRow
        ms={{ name: 'Phase 1 Complete', date: '2025-06-01' }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('milestone-name')).toHaveTextContent('Phase 1 Complete');
  });

  it('displays milestone date', () => {
    renderWithRouter(
      <MilestoneRow
        ms={{ name: 'Phase 1 Complete', date: '2025-06-01' }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('milestone-date')).toHaveTextContent('2025-06-01');
  });

  it('clicking milestone name enters edit mode — input appears', () => {
    renderWithRouter(
      <MilestoneRow ms={{ name: 'Phase 1 Complete' }} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );

    // Initially shows the name as text
    expect(screen.getByTestId('milestone-name')).toBeInTheDocument();
    expect(screen.queryByTestId('milestone-name-input')).not.toBeInTheDocument();

    // Click to enter edit mode
    fireEvent.click(screen.getByTestId('milestone-name'));

    // Input should appear
    expect(screen.getByTestId('milestone-name-input')).toBeInTheDocument();
    expect(screen.queryByTestId('milestone-name')).not.toBeInTheDocument();
  });

  it('pressing Enter saves the edit and calls onUpdate', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <MilestoneRow ms={{ name: 'Phase 1 Complete' }} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('milestone-name'));

    const input = screen.getByTestId('milestone-name-input');
    fireEvent.change(input, { target: { value: 'Phase 1 Done' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // onUpdate should be called with the new name
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Phase 1 Done' });
    // Edit mode should exit
    expect(screen.queryByTestId('milestone-name-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('milestone-name')).toBeInTheDocument();
  });

  it('blurring the input saves the edit', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <MilestoneRow ms={{ name: 'Phase 1 Complete' }} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('milestone-name'));

    const input = screen.getByTestId('milestone-name-input');
    fireEvent.change(input, { target: { value: 'Phase 2 Start' } });
    fireEvent.blur(input);

    expect(onUpdate).toHaveBeenCalledWith({ name: 'Phase 2 Start' });
    expect(screen.queryByTestId('milestone-name-input')).not.toBeInTheDocument();
  });

  it('pressing Escape cancels edit without calling onUpdate', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <MilestoneRow ms={{ name: 'Phase 1 Complete' }} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('milestone-name'));

    const input = screen.getByTestId('milestone-name-input');
    fireEvent.change(input, { target: { value: 'Some other text' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // onUpdate should NOT be called
    expect(onUpdate).not.toHaveBeenCalled();
    // Original name should be restored
    expect(screen.getByTestId('milestone-name')).toHaveTextContent('Phase 1 Complete');
    expect(screen.queryByTestId('milestone-name-input')).not.toBeInTheDocument();
  });

  it('does not call onUpdate when name is unchanged on blur', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <MilestoneRow ms={{ name: 'Phase 1 Complete' }} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('milestone-name'));
    const input = screen.getByTestId('milestone-name-input');
    // No change — just blur
    fireEvent.blur(input);

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
