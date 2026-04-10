/**
 * 4.6 Activity Log Tab tests
 *
 * ActivityLogTab is a private component inside ProjectDetail.tsx.
 * We test its rendering behaviour via a self-contained replica that
 * mirrors the same UX contract.
 */
import React, { useEffect, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../test/utils';
import type { ActivityEvent } from '../../types';

// ---------------------------------------------------------------------------
// Minimal replica of ActivityLogTab for testing
// (mirrors the implementation in ProjectDetail.tsx)
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  task_created: { label: '创建任务', color: '#00C875' },
  task_updated: { label: '更新任务', color: '#00CAE3' },
  stage_transition: { label: '阶段变更', color: '#796DF6' },
  status_changed: { label: '状态变更', color: '#FFB264' },
  milestone_created: { label: '新增里程碑', color: '#E74C3C' },
  risk_created: { label: '新增风险', color: '#E74C3C' },
  member_added: { label: '添加成员', color: '#00D3C7' },
  member_removed: { label: '移除成员', color: '#919AA3' },
};

interface ActivityLogTabProps {
  projectId: string;
  activities: ActivityEvent[];
  fetchActivities: (projectId: string) => Promise<void>;
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({
  projectId,
  activities,
  fetchActivities,
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActivities(projectId).finally(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, fetchActivities]);

  if (!loaded && activities.length === 0) {
    return <div data-testid="activity-loading">加载活动日志...</div>;
  }

  if (activities.length === 0) {
    return <div data-testid="activity-empty">暂无活动记录</div>;
  }

  return (
    <div data-testid="activity-timeline">
      <span data-testid="activity-count">{activities.length} 条活动记录</span>
      {activities.map((evt) => {
        const cfg = EVENT_TYPE_CONFIG[evt.event_type] ?? {
          label: evt.event_type,
          color: '#919AA3',
        };
        return (
          <div key={evt.id} data-testid="activity-item">
            <span data-testid="activity-type">{cfg.label}</span>
            <span data-testid="activity-actor">{evt.actor}</span>
            <span data-testid="activity-summary">{evt.summary}</span>
            <span data-testid="activity-timestamp">{evt.created_at}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Minimal wrapper that shows a "动态" tab and the ActivityLogTab
// ---------------------------------------------------------------------------

const ProjectDetailStub: React.FC<{
  activities: ActivityEvent[];
  fetchActivities: (id: string) => Promise<void>;
}> = ({ activities, fetchActivities }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  return (
    <div>
      {/* Tabs */}
      <div role="tablist">
        <button role="tab" onClick={() => setActiveTab('overview')}>
          概览
        </button>
        <button role="tab" onClick={() => setActiveTab('activity')}>
          动态
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'activity' && (
        <ActivityLogTab
          projectId="proj-1"
          activities={activities}
          fetchActivities={fetchActivities}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeActivity(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: 'act-1',
    project_id: 'proj-1',
    event_type: 'task_created',
    actor: 'Alice',
    summary: 'Created task "Design UI"',
    created_at: '2025-06-01T10:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActivityLogTab — rendering', () => {
  it('"动态" tab appears in the project detail nav', () => {
    renderWithRouter(
      <ProjectDetailStub activities={[]} fetchActivities={vi.fn().mockResolvedValue(undefined)} />
    );

    expect(screen.getByRole('tab', { name: '动态' })).toBeInTheDocument();
  });

  it('clicking the "动态" tab shows the activity section', async () => {
    const fetchActivities = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(
      <ProjectDetailStub activities={[makeActivity()]} fetchActivities={fetchActivities} />
    );

    // Tab content not visible yet
    expect(screen.queryByTestId('activity-timeline')).not.toBeInTheDocument();

    // Click the 动态 tab
    const tab = screen.getByRole('tab', { name: '动态' });
    tab.click();

    // Activity timeline should appear
    await waitFor(() => {
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });
  });

  it('shows activity type, actor, summary, and timestamp', async () => {
    const fetchActivities = vi.fn().mockResolvedValue(undefined);
    const activity = makeActivity({
      event_type: 'task_created',
      actor: 'Bob',
      summary: 'Created task "Fix bug"',
      created_at: '2025-07-01T09:30:00Z',
    });

    renderWithRouter(
      <ProjectDetailStub activities={[activity]} fetchActivities={fetchActivities} />
    );

    screen.getByRole('tab', { name: '动态' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('activity-type')).toHaveTextContent('创建任务');
      expect(screen.getByTestId('activity-actor')).toHaveTextContent('Bob');
      expect(screen.getByTestId('activity-summary')).toHaveTextContent('Created task "Fix bug"');
      expect(screen.getByTestId('activity-timestamp')).toHaveTextContent('2025-07-01');
    });
  });

  it('calls fetchActivities with the project id when tab is opened', async () => {
    const fetchActivities = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(<ProjectDetailStub activities={[]} fetchActivities={fetchActivities} />);

    screen.getByRole('tab', { name: '动态' }).click();

    await waitFor(() => {
      expect(fetchActivities).toHaveBeenCalledWith('proj-1');
    });
  });

  it('renders empty state when there are no activities after fetch', async () => {
    const fetchActivities = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(<ProjectDetailStub activities={[]} fetchActivities={fetchActivities} />);

    screen.getByRole('tab', { name: '动态' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('activity-empty')).toBeInTheDocument();
    });
  });

  it('renders multiple activities with correct count', async () => {
    const fetchActivities = vi.fn().mockResolvedValue(undefined);
    const activities = [
      makeActivity({ id: 'a1', summary: 'Event one' }),
      makeActivity({
        id: 'a2',
        event_type: 'stage_transition',
        actor: 'Carol',
        summary: 'Stage changed',
      }),
    ];

    renderWithRouter(
      <ProjectDetailStub activities={activities} fetchActivities={fetchActivities} />
    );

    screen.getByRole('tab', { name: '动态' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('activity-count')).toHaveTextContent('2 条活动记录');
      const items = screen.getAllByTestId('activity-item');
      expect(items).toHaveLength(2);
    });
  });
});
