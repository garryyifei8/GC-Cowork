import { screen } from '@testing-library/react';
import { renderWithRouter, setupFetchMock } from '../../test/utils';
import { Overview } from '../Overview';
import { ProjectsDashboard } from '../ProjectsDashboard';
import { Tasks } from '../Tasks';
import { HRDashboard } from '../HRDashboard';
import { FinanceDashboard } from '../FinanceDashboard';
import { KnowledgeBase } from '../KnowledgeBase';
import { MyDaily } from '../MyDaily';

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

describe('Overview page', () => {
  it('renders Overview without crashing', async () => {
    setupFetchMock({
      '/api/dashboard/metrics': {
        body: {
          total_projects: 5,
          active_projects: 3,
          at_risk_projects: 1,
          overdue_tasks: 2,
          ai_insights: [],
        },
      },
      '/api/activities': { body: [] },
      '/api/projects': { body: [] },
      '/api/dashboard/activities': { body: [] },
      '/api/hr/': { body: [] },
      '/api/dashboard': {
        body: {
          total_projects: 5,
          active_projects: 3,
          at_risk_projects: 1,
          overdue_tasks: 2,
          ai_insights: [],
        },
      },
    });

    renderWithRouter(<Overview />);

    // The greeting is always rendered synchronously
    expect(await screen.findByText(/用户/)).toBeInTheDocument();
  });

  it('renders KPI labels on Overview', async () => {
    setupFetchMock({
      '/api/dashboard/metrics': {
        body: {
          total_projects: 5,
          active_projects: 3,
          at_risk_projects: 1,
          overdue_tasks: 2,
          ai_insights: [],
        },
      },
      '/api/activities': { body: [] },
      '/api/projects': { body: [] },
      '/api/dashboard/activities': { body: [] },
    });

    renderWithRouter(<Overview />);

    expect(await screen.findByText(/项目总数/)).toBeInTheDocument();
    expect(await screen.findByText(/活跃项目/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ProjectsDashboard
// ---------------------------------------------------------------------------

describe('ProjectsDashboard page', () => {
  it('renders ProjectsDashboard heading without crashing', async () => {
    setupFetchMock({
      '/api/projects': { body: [] },
    });

    renderWithRouter(<ProjectsDashboard />);

    expect(await screen.findByText(/项目管理/)).toBeInTheDocument();
  });

  it('renders new project button on ProjectsDashboard', async () => {
    setupFetchMock({
      '/api/projects': { body: [] },
    });

    renderWithRouter(<ProjectsDashboard />);

    expect(await screen.findByText(/新建项目/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

describe('Tasks page', () => {
  it('renders Tasks workbench heading without crashing', async () => {
    setupFetchMock({
      '/api/tasks': { body: [] },
      '/api/projects': { body: [] },
    });

    renderWithRouter(<Tasks />);

    expect(await screen.findByText(/任务工作台/)).toBeInTheDocument();
  });

  it('renders view mode buttons on Tasks page', async () => {
    setupFetchMock({
      '/api/tasks': { body: [] },
      '/api/projects': { body: [] },
    });

    renderWithRouter(<Tasks />);

    expect(await screen.findByText(/列表/)).toBeInTheDocument();
    expect(await screen.findByText(/看板/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// HRDashboard
// ---------------------------------------------------------------------------

describe('HRDashboard page', () => {
  it('renders HRDashboard heading without crashing', async () => {
    setupFetchMock({
      '/api/hr/employees': { body: [] },
      '/api/hr/attendance': { body: [] },
      '/api/hr/leaves': { body: [] },
      '/api/hr/salary': { body: [] },
      '/api/hr/summary': {
        body: {
          total_employees: 10,
          active_count: 8,
          on_leave_count: 2,
          attendance_rate: 0.95,
        },
      },
      '/api/hr/insights': { body: [] },
    });

    renderWithRouter(<HRDashboard />);

    expect(await screen.findByText(/人力资源/)).toBeInTheDocument();
  });

  it('renders HR tab navigation', async () => {
    setupFetchMock({
      '/api/hr/employees': { body: [] },
      '/api/hr/attendance': { body: [] },
      '/api/hr/leaves': { body: [] },
      '/api/hr/salary': { body: [] },
      '/api/hr/summary': {
        body: {
          total_employees: 10,
          active_count: 8,
          on_leave_count: 2,
          attendance_rate: 0.95,
        },
      },
      '/api/hr/insights': { body: [] },
    });

    renderWithRouter(<HRDashboard />);

    // Use role="tab" queries to avoid matching stat card labels
    const tabs = await screen.findAllByRole('tab');
    const tabLabels = tabs.map((t) => t.textContent);
    expect(tabLabels).toEqual(expect.arrayContaining(['员工', '考勤', '请假', '薪资']));
  });
});

// ---------------------------------------------------------------------------
// FinanceDashboard
// ---------------------------------------------------------------------------

describe('FinanceDashboard page', () => {
  it('renders FinanceDashboard heading without crashing', async () => {
    setupFetchMock({
      '/api/finance/expenses': { body: [] },
      '/api/finance/budgets': { body: [] },
      '/api/finance/invoices': { body: [] },
      '/api/finance/summary': {
        body: {
          total_expenses: 50000,
          pending_approvals: 3,
          budget_utilization_rate: 0.75,
          overdue_invoices: 1,
        },
      },
    });

    renderWithRouter(<FinanceDashboard />);

    expect(await screen.findByText(/财务管理/)).toBeInTheDocument();
  });

  it('renders finance tab navigation', async () => {
    setupFetchMock({
      '/api/finance/expenses': { body: [] },
      '/api/finance/budgets': { body: [] },
      '/api/finance/invoices': { body: [] },
      '/api/finance/summary': {
        body: {
          total_expenses: 0,
          pending_approvals: 0,
          budget_utilization_rate: 0,
          overdue_invoices: 0,
        },
      },
    });

    renderWithRouter(<FinanceDashboard />);

    // Use role="tab" queries to avoid matching stat card labels
    const tabs = await screen.findAllByRole('tab');
    const tabLabels = tabs.map((t) => t.textContent);
    expect(tabLabels).toEqual(expect.arrayContaining(['报销', '预算', '发票']));
  });
});

// ---------------------------------------------------------------------------
// KnowledgeBase
// ---------------------------------------------------------------------------

describe('KnowledgeBase page', () => {
  it('renders KnowledgeBase heading without crashing', async () => {
    setupFetchMock({
      '/api/knowledge/documents': { body: [] },
    });

    renderWithRouter(<KnowledgeBase />);

    expect(await screen.findByText(/企业智能知识库/)).toBeInTheDocument();
  });

  it('renders search button on KnowledgeBase', async () => {
    setupFetchMock({
      '/api/knowledge/documents': { body: [] },
    });

    renderWithRouter(<KnowledgeBase />);

    expect(await screen.findByText(/智能检索/)).toBeInTheDocument();
  });

  it('renders category sidebar on KnowledgeBase', async () => {
    setupFetchMock({
      '/api/knowledge/documents': {
        body: [
          {
            id: 'doc-1',
            title: '测试文档',
            doc_type: 'report',
            project_id: null,
            content_summary: '摘要内容',
            version: '1.0',
            author: '作者',
            status: 'final',
          },
        ],
      },
    });

    renderWithRouter(<KnowledgeBase />);

    expect(await screen.findByText(/知识分类/)).toBeInTheDocument();
    expect(await screen.findByText(/全部分类/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MyDaily
// ---------------------------------------------------------------------------

describe('MyDaily page', () => {
  it('renders MyDaily greeting without crashing', async () => {
    setupFetchMock({
      '/api/hr/leaves': { body: [] },
      '/api/hr/attendance': { body: [] },
      '/api/hr/salary': { body: [] },
      '/api/finance/expenses': { body: [] },
      '/api/daily/pending-approvals': {
        body: { leaves: [], expenses: [], vehicles: [] },
      },
      '/api/daily/notices': { body: [] },
      '/api/daily/vehicles': { body: [] },
      '/api/hr/pending-approvals': {
        body: { leaves: [], expenses: [], vehicles: [] },
      },
    });

    renderWithRouter(<MyDaily />);

    // Greeting + user name always rendered synchronously
    expect(await screen.findByText(/张工/)).toBeInTheDocument();
  });

  it('renders tab navigation on MyDaily', async () => {
    setupFetchMock({
      '/api/hr/leaves': { body: [] },
      '/api/hr/attendance': { body: [] },
      '/api/hr/salary': { body: [] },
      '/api/finance/expenses': { body: [] },
      '/api/daily/pending-approvals': {
        body: { leaves: [], expenses: [], vehicles: [] },
      },
      '/api/daily/notices': { body: [] },
      '/api/daily/vehicles': { body: [] },
      '/api/hr/pending-approvals': {
        body: { leaves: [], expenses: [], vehicles: [] },
      },
    });

    renderWithRouter(<MyDaily />);

    expect(await screen.findByText(/概览/)).toBeInTheDocument();
    expect(await screen.findByText(/我的请假/)).toBeInTheDocument();
    expect(await screen.findByText(/我的报销/)).toBeInTheDocument();
  });
});
