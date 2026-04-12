import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';
import { NotificationPanel } from '../NotificationPanel';
import { NotificationToast } from '../NotificationToast';
import { useNotificationStore } from '../../../stores/notificationStore';

afterEach(() => {
  vi.restoreAllMocks();
  // Reset notification store between tests
  useNotificationStore.setState({ notifications: [], unreadCount: 0 });
});

// ---------------------------------------------------------------------------
// NotificationPanel
// ---------------------------------------------------------------------------

describe('NotificationPanel', () => {
  it('does not render when isOpen is false', () => {
    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the panel when isOpen is true', () => {
    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows empty state message when there are no notifications', () => {
    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    expect(screen.getByText('暂无通知')).toBeInTheDocument();
  });

  it('renders notification title in panel when notifications exist', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'notif-1',
          title: '系统通知',
          message: '有新消息需要处理',
          type: 'info',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 1,
    });

    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    expect(screen.getByText('系统通知')).toBeInTheDocument();
  });

  it('renders notification message text', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'notif-2',
          title: '任务提醒',
          message: '有一个逾期任务需要处理',
          type: 'warning',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 1,
    });

    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    expect(screen.getByText('有一个逾期任务需要处理')).toBeInTheDocument();
  });

  it('shows unread count in panel header', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'notif-3',
          title: '提醒',
          message: '内容',
          type: 'info',
          read: false,
          timestamp: new Date(),
        },
        {
          id: 'notif-4',
          title: '提醒2',
          message: '内容2',
          type: 'success',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 2,
    });

    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    // Header should show "通知（2）"
    expect(screen.getByText(/通知（2）/)).toBeInTheDocument();
  });

  it('shows mark-all-read button when there are unread notifications', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'notif-5',
          title: '新通知',
          message: '内容',
          type: 'info',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 1,
    });

    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    expect(screen.getByText('全部已读')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'notif-6',
          title: '通知',
          message: '内容',
          type: 'success',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 1,
    });

    const onClose = vi.fn();
    renderWithRouter(<NotificationPanel isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByText('关闭');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// NotificationToast
// ---------------------------------------------------------------------------

describe('NotificationToast', () => {
  it('renders nothing when there are no unread notifications', () => {
    renderWithRouter(<NotificationToast />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders a toast for an unread notification', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'toast-1',
          title: '操作成功',
          message: '任务已成功创建',
          type: 'success',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 1,
    });

    renderWithRouter(<NotificationToast />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('操作成功')).toBeInTheDocument();
    expect(screen.getByText('任务已成功创建')).toBeInTheDocument();
  });

  it('does not render toast for read notifications', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'toast-read',
          title: '已读通知',
          message: '此通知已被阅读',
          type: 'info',
          read: true,
          timestamp: new Date(),
        },
      ],
      unreadCount: 0,
    });

    renderWithRouter(<NotificationToast />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders at most 3 toast items for multiple unread notifications', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 't1',
          title: '通知1',
          message: '消息1',
          type: 'info',
          read: false,
          timestamp: new Date(),
        },
        {
          id: 't2',
          title: '通知2',
          message: '消息2',
          type: 'success',
          read: false,
          timestamp: new Date(),
        },
        {
          id: 't3',
          title: '通知3',
          message: '消息3',
          type: 'warning',
          read: false,
          timestamp: new Date(),
        },
        {
          id: 't4',
          title: '通知4',
          message: '消息4',
          type: 'error',
          read: false,
          timestamp: new Date(),
        },
      ],
      unreadCount: 4,
    });

    renderWithRouter(<NotificationToast />);

    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeLessThanOrEqual(3);
  });
});
