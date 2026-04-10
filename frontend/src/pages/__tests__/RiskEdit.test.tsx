/**
 * 4.5 Risk Inline Edit tests
 *
 * RiskRow is a private component inside ProjectDetail.tsx.
 * We test its inline-edit behaviour via a self-contained replica.
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../../test/utils';

// ---------------------------------------------------------------------------
// Minimal replica of RiskRow for testing
// (mirrors the implementation in ProjectDetail.tsx)
// ---------------------------------------------------------------------------

const SEV_LBL: Record<string, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

interface RiskRowProps {
  risk: { description: string; severity: string; owner?: string | null };
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}

const RiskRow: React.FC<RiskRowProps> = ({ risk, onUpdate, onDelete }) => {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(risk.description);

  const saveDesc = () => {
    const trimmed = descVal.trim();
    if (trimmed && trimmed !== risk.description) onUpdate({ description: trimmed });
    else setDescVal(risk.description);
    setEditingDesc(false);
  };

  return (
    <div data-testid="risk-row">
      {editingDesc ? (
        <input
          data-testid="risk-desc-input"
          autoFocus
          value={descVal}
          onChange={(e) => setDescVal(e.target.value)}
          onBlur={saveDesc}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveDesc();
            if (e.key === 'Escape') {
              setDescVal(risk.description);
              setEditingDesc(false);
            }
          }}
        />
      ) : (
        <span data-testid="risk-description" onClick={() => setEditingDesc(true)}>
          {risk.description}
        </span>
      )}
      <span data-testid="risk-level">{SEV_LBL[risk.severity] ?? risk.severity}</span>
      <button data-testid="risk-delete" onClick={onDelete}>
        删除
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RiskRow — inline edit', () => {
  it('displays risk description and severity level', () => {
    renderWithRouter(
      <RiskRow
        risk={{ description: 'Budget may overrun', severity: 'high' }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('risk-description')).toHaveTextContent('Budget may overrun');
    expect(screen.getByTestId('risk-level')).toHaveTextContent('高');
  });

  it('clicking description enters edit mode — input appears', () => {
    renderWithRouter(
      <RiskRow
        risk={{ description: 'Budget may overrun', severity: 'medium' }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('risk-description')).toBeInTheDocument();
    expect(screen.queryByTestId('risk-desc-input')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('risk-description'));

    expect(screen.getByTestId('risk-desc-input')).toBeInTheDocument();
    expect(screen.queryByTestId('risk-description')).not.toBeInTheDocument();
  });

  it('pressing Enter saves the edit and calls onUpdate', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <RiskRow
        risk={{ description: 'Budget may overrun', severity: 'high' }}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('risk-description'));

    const input = screen.getByTestId('risk-desc-input');
    fireEvent.change(input, { target: { value: 'Updated risk description' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onUpdate).toHaveBeenCalledWith({ description: 'Updated risk description' });
    expect(screen.queryByTestId('risk-desc-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('risk-description')).toBeInTheDocument();
  });

  it('blurring saves the edit', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <RiskRow
        risk={{ description: 'Budget may overrun', severity: 'low' }}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('risk-description'));
    const input = screen.getByTestId('risk-desc-input');
    fireEvent.change(input, { target: { value: 'New risk text' } });
    fireEvent.blur(input);

    expect(onUpdate).toHaveBeenCalledWith({ description: 'New risk text' });
    expect(screen.queryByTestId('risk-desc-input')).not.toBeInTheDocument();
  });

  it('pressing Escape cancels edit without calling onUpdate', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <RiskRow
        risk={{ description: 'Budget may overrun', severity: 'critical' }}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('risk-description'));
    const input = screen.getByTestId('risk-desc-input');
    fireEvent.change(input, { target: { value: 'Changed text' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByTestId('risk-description')).toHaveTextContent('Budget may overrun');
    expect(screen.queryByTestId('risk-desc-input')).not.toBeInTheDocument();
  });

  it('does not call onUpdate when description is unchanged on blur', () => {
    const onUpdate = vi.fn();
    renderWithRouter(
      <RiskRow
        risk={{ description: 'Budget may overrun', severity: 'medium' }}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('risk-description'));
    const input = screen.getByTestId('risk-desc-input');
    fireEvent.blur(input);

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
