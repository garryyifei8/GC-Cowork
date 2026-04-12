import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils';
import { TaskListCard } from '../TaskListCard';
import { ProgressCard } from '../ProgressCard';
import { ChartCard } from '../ChartCard';
import { TableCard } from '../TableCard';
import { AlertCard } from '../AlertCard';
import { ActionCard } from '../ActionCard';
import { FileCard } from '../FileCard';
import { ReportCard } from '../ReportCard';
import { DataCard } from '../DataCard';
import type { InteractiveCard } from '../../../types';

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shared card factory helpers
// ---------------------------------------------------------------------------

function makeCard(overrides: Partial<InteractiveCard> = {}): InteractiveCard {
  return {
    id: 'card-test',
    type: 'data',
    title: '测试卡片',
    content: '这是卡片内容',
    data: {},
    actions: [],
    status: 'info',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TaskListCard
// ---------------------------------------------------------------------------

describe('TaskListCard', () => {
  it('renders task list card title', () => {
    const card = makeCard({
      type: 'task_list',
      title: '项目任务列表',
      data: {
        tasks: [
          {
            id: 'task-1',
            name: '需求分析',
            status: 'in_progress',
            priority: 'high',
            assignee: '张工',
          },
          { id: 'task-2', name: '设计评审', status: 'todo', priority: 'medium' },
        ],
      },
    });

    renderWithRouter(<TaskListCard card={card} />);

    expect(screen.getByText('项目任务列表')).toBeInTheDocument();
  });

  it('renders task items', () => {
    const card = makeCard({
      type: 'task_list',
      title: '任务',
      data: {
        tasks: [
          { id: 'task-1', name: '需求分析', status: 'in_progress' },
          { id: 'task-2', name: '设计评审', status: 'done' },
        ],
      },
    });

    renderWithRouter(<TaskListCard card={card} />);

    expect(screen.getByText('需求分析')).toBeInTheDocument();
    expect(screen.getByText('设计评审')).toBeInTheDocument();
  });

  it('shows item count badge', () => {
    const card = makeCard({
      type: 'task_list',
      title: '任务',
      data: {
        tasks: [
          { name: '任务A', status: 'todo' },
          { name: '任务B', status: 'todo' },
          { name: '任务C', status: 'done' },
        ],
      },
    });

    renderWithRouter(<TaskListCard card={card} />);

    expect(screen.getByText('3 项')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ProgressCard
// ---------------------------------------------------------------------------

describe('ProgressCard', () => {
  it('renders progress card title', () => {
    const card = makeCard({
      type: 'progress',
      title: '项目进度概览',
      data: {
        items: [
          { label: '项目A', value: 75 },
          { label: '项目B', value: 45 },
        ],
      },
    });

    renderWithRouter(<ProgressCard card={card} />);

    expect(screen.getByText('项目进度概览')).toBeInTheDocument();
  });

  it('renders progress item labels', () => {
    const card = makeCard({
      type: 'progress',
      title: '进度',
      data: {
        items: [
          { label: '阶段一', value: 80 },
          { label: '阶段二', value: 60 },
        ],
      },
    });

    renderWithRouter(<ProgressCard card={card} />);

    expect(screen.getByText('阶段一')).toBeInTheDocument();
    expect(screen.getByText('阶段二')).toBeInTheDocument();
  });

  it('renders overall progress percentage', () => {
    const card = makeCard({
      type: 'progress',
      title: '整体进度',
      data: {
        overall: 65,
        items: [{ label: '子项', value: 65 }],
      },
    });

    renderWithRouter(<ProgressCard card={card} />);

    // Overall pct appears at least once (header badge + item label)
    const pctElements = screen.getAllByText('65%');
    expect(pctElements.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// ChartCard
// ---------------------------------------------------------------------------

describe('ChartCard', () => {
  it('renders chart card title', () => {
    const card = makeCard({
      type: 'chart',
      title: '任务状态分布',
      data: {
        chart_type: 'donut',
        items: [
          { label: '已完成', value: 12, color: '#00C875' },
          { label: '进行中', value: 5, color: '#FFB264' },
          { label: '待办', value: 3, color: '#00CAE3' },
        ],
      },
    });

    renderWithRouter(<ChartCard card={card} />);

    expect(screen.getByText('任务状态分布')).toBeInTheDocument();
  });

  it('renders chart item labels', () => {
    const card = makeCard({
      type: 'chart',
      title: '图表',
      data: {
        chart_type: 'donut',
        items: [
          { label: '已完成', value: 10 },
          { label: '进行中', value: 5 },
        ],
      },
    });

    renderWithRouter(<ChartCard card={card} />);

    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TableCard
// ---------------------------------------------------------------------------

describe('TableCard', () => {
  it('renders table card title', () => {
    const card = makeCard({
      type: 'table',
      title: '项目清单',
      data: {
        headers: ['名称', '状态', '负责人'],
        rows: [
          ['项目A', 'active', '张工'],
          ['项目B', 'completed', '李工'],
        ],
      },
    });

    renderWithRouter(<TableCard card={card} />);

    expect(screen.getByText('项目清单')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    const card = makeCard({
      type: 'table',
      title: '表格',
      data: {
        headers: ['姓名', '部门'],
        rows: [['张三', '工程部']],
      },
    });

    renderWithRouter(<TableCard card={card} />);

    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('部门')).toBeInTheDocument();
  });

  it('renders table row data', () => {
    const card = makeCard({
      type: 'table',
      title: '表格',
      data: {
        headers: ['项目', '进度'],
        rows: [['基础设施', '75%']],
      },
    });

    renderWithRouter(<TableCard card={card} />);

    expect(screen.getByText('基础设施')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AlertCard
// ---------------------------------------------------------------------------

describe('AlertCard', () => {
  it('renders alert card title', () => {
    const card = makeCard({
      type: 'alert',
      title: '项目延期预警',
      content: '项目A距截止日期仅剩3天，进度落后20%',
      status: 'warning',
    });

    renderWithRouter(<AlertCard card={card} />);

    expect(screen.getByText('项目延期预警')).toBeInTheDocument();
  });

  it('renders alert card content', () => {
    const card = makeCard({
      type: 'alert',
      title: '风险告警',
      content: '发现潜在风险，请及时处理',
      status: 'danger',
    });

    renderWithRouter(<AlertCard card={card} />);

    expect(screen.getByText('发现潜在风险，请及时处理')).toBeInTheDocument();
  });

  it('renders alert action buttons', () => {
    const card = makeCard({
      type: 'alert',
      title: '审批通知',
      content: '有新的审批请求',
      status: 'info',
      actions: [
        { label: '通过', action: 'approve', primary: true },
        { label: '驳回', action: 'reject', primary: false },
      ],
    });

    renderWithRouter(<AlertCard card={card} />);

    expect(screen.getByText('通过')).toBeInTheDocument();
    expect(screen.getByText('驳回')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ActionCard
// ---------------------------------------------------------------------------

describe('ActionCard', () => {
  it('renders action card title', () => {
    const card = makeCard({
      type: 'action',
      title: '快速操作',
      content: '请选择要执行的操作',
      actions: [{ label: '查看项目', action: 'view_projects', primary: true }],
    });

    renderWithRouter(<ActionCard card={card} />);

    expect(screen.getByText('快速操作')).toBeInTheDocument();
  });

  it('renders action card button', () => {
    const card = makeCard({
      type: 'action',
      title: '操作',
      content: '执行操作',
      actions: [{ label: '前往项目', action: 'view_projects', primary: true }],
    });

    renderWithRouter(<ActionCard card={card} />);

    expect(screen.getByText('前往项目')).toBeInTheDocument();
  });

  it('renders action card data fields', () => {
    const card = makeCard({
      type: 'action',
      title: '项目信息',
      content: '操作说明',
      data: {
        项目名称: '智慧城市项目',
        当前阶段: '设计阶段',
      },
    });

    renderWithRouter(<ActionCard card={card} />);

    expect(screen.getByText('项目名称')).toBeInTheDocument();
    expect(screen.getByText('智慧城市项目')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// FileCard
// ---------------------------------------------------------------------------

describe('FileCard', () => {
  it('renders file card with filename', () => {
    const card = makeCard({
      type: 'file',
      title: '项目方案.pdf',
      data: {
        filename: '项目方案.pdf',
        type: 'PDF',
        size: '2.5MB',
        author: '张工',
      },
    });

    renderWithRouter(<FileCard card={card} />);

    expect(screen.getByText('项目方案.pdf')).toBeInTheDocument();
  });

  it('renders file type badge', () => {
    const card = makeCard({
      type: 'file',
      title: '报告.docx',
      data: {
        filename: '报告.docx',
        type: 'DOCX',
      },
    });

    renderWithRouter(<FileCard card={card} />);

    expect(screen.getByText('DOCX')).toBeInTheDocument();
  });

  it('renders file summary when provided', () => {
    const card = makeCard({
      type: 'file',
      title: '摘要文档.pdf',
      content: '这是一份关于项目进度的综合报告',
      data: {
        filename: '摘要文档.pdf',
      },
    });

    renderWithRouter(<FileCard card={card} />);

    expect(screen.getByText('这是一份关于项目进度的综合报告')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ReportCard
// ---------------------------------------------------------------------------

describe('ReportCard', () => {
  it('renders report card title', () => {
    const card = makeCard({
      type: 'report',
      title: '本周工作周报',
      content: '本周完成了以下工作：\n1. 完成需求分析\n2. 设计评审',
    });

    renderWithRouter(<ReportCard card={card} />);

    expect(screen.getByText('本周工作周报')).toBeInTheDocument();
  });

  it('renders report card content', () => {
    const card = makeCard({
      type: 'report',
      title: '周报',
      content: '工作总结内容摘要',
    });

    renderWithRouter(<ReportCard card={card} />);

    expect(screen.getByText('工作总结内容摘要')).toBeInTheDocument();
  });

  it('renders report with sections', () => {
    const card = makeCard({
      type: 'report',
      title: '项目报告',
      content: '',
      data: {
        sections: [
          { title: '执行摘要', content: '项目整体进展良好' },
          { title: '风险评估', content: '当前无重大风险' },
        ],
      },
    });

    renderWithRouter(<ReportCard card={card} />);

    expect(screen.getByText('执行摘要')).toBeInTheDocument();
    expect(screen.getByText('风险评估')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DataCard
// ---------------------------------------------------------------------------

describe('DataCard', () => {
  it('renders data card title', () => {
    const card = makeCard({
      type: 'data',
      title: '项目统计数据',
      data: {
        项目总数: '12',
        完成率: '75%',
      },
    });

    renderWithRouter(<DataCard card={card} />);

    expect(screen.getByText('项目统计数据')).toBeInTheDocument();
  });

  it('renders data key-value pairs', () => {
    const card = makeCard({
      type: 'data',
      title: '统计',
      data: {
        总员工: '50',
        在职: '45',
      },
    });

    renderWithRouter(<DataCard card={card} />);

    expect(screen.getByText('总员工')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('在职')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('renders data card action buttons', () => {
    const card = makeCard({
      type: 'data',
      title: '数据',
      data: { 状态: '正常' },
      actions: [{ label: '查看详情', action: 'view_projects', primary: true }],
    });

    renderWithRouter(<DataCard card={card} />);

    expect(screen.getByText('查看详情')).toBeInTheDocument();
  });
});
