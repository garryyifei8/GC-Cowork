import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  FolderKanban,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import StatusBadge, { StatusVariant } from '../components/ui/StatusBadge';
import './Overview.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function getChineseDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];
  return `${year}年${month}月${day}日 · ${weekday}`;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  name: string;
  project: string;
  status: StatusVariant;
  statusLabel: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  overdue?: boolean;
}

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    name: '准备投标技术方案',
    project: '城市基础设施升级项目',
    status: 'warning',
    statusLabel: '进行中',
    dueDate: '3月12日',
    priority: 'high',
  },
  {
    id: '2',
    name: '审核采购合同',
    project: '供应链优化专项',
    status: 'danger',
    statusLabel: '待审核',
    dueDate: '3月8日',
    priority: 'high',
    overdue: true,
  },
  {
    id: '3',
    name: '更新项目周报',
    project: '智慧园区建设',
    status: 'success',
    statusLabel: '已完成',
    dueDate: '3月10日',
    priority: 'low',
  },
  {
    id: '4',
    name: '完成可研报告初稿',
    project: '新能源储能示范工程',
    status: 'info',
    statusLabel: '规划中',
    dueDate: '3月18日',
    priority: 'medium',
  },
];

interface ActivityItem {
  id: string;
  text: React.ReactNode;
  time: string;
  color: string;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    text: <><strong>项目管理 Agent</strong> 生成了智慧园区建设项目周报</>,
    time: '2小时前',
    color: '#6161FF',
  },
  {
    id: '2',
    text: <><strong>法务 Agent</strong> 完成了采购合同的合规性审查</>,
    time: '5小时前',
    color: '#00C875',
  },
  {
    id: '3',
    text: <><strong>王磊</strong> 在城市基础设施升级项目中上传了技术附件</>,
    time: '昨天 17:45',
    color: '#0086C0',
  },
  {
    id: '4',
    text: <><strong>调度 Agent</strong> 将"审核采购合同"标记为高优先级</>,
    time: '昨天 14:30',
    color: '#FDAB3D',
  },
  {
    id: '5',
    text: <><strong>张敏</strong> 创建了新能源储能示范工程项目</>,
    time: '2天前',
    color: '#E2445C',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  borderColor: string;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  borderColor,
  onClick,
}) => (
  <div
    className="quick-action-card"
    style={{ borderTopColor: borderColor }}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label={title}
  >
    <div className="quick-action-card__icon" style={{ color: borderColor }}>
      {icon}
    </div>
    <div className="quick-action-card__title">{title}</div>
    <div className="quick-action-card__desc">{description}</div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const Overview: React.FC = () => {
  const navigate = useNavigate();

  const greeting = useMemo(() => getGreeting(), []);
  const chineseDate = useMemo(() => getChineseDate(), []);

  return (
    <div className="overview-dashboard">

      {/* Greeting */}
      <div className="overview-greeting">
        <h1 className="overview-greeting__heading">
          {greeting}, 用户
        </h1>
        <p className="overview-greeting__date">{chineseDate}</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <QuickActionCard
          icon={<MessageSquare size={22} />}
          title="新建对话"
          description="向 AI 助手发起新的工作对话"
          borderColor="#0086C0"
          onClick={() => navigate('/chat')}
        />
        <QuickActionCard
          icon={<FolderKanban size={22} />}
          title="创建项目"
          description="新建项目并分配 AI Agent 协作"
          borderColor="#00C875"
          onClick={() => navigate('/projects')}
        />
        <QuickActionCard
          icon={<BookOpen size={22} />}
          title="搜索知识库"
          description="在企业知识库中检索相关文档"
          borderColor="#6161FF"
          onClick={() => navigate('/knowledge')}
        />
      </div>

      {/* My Tasks */}
      <section className="overview-section" aria-labelledby="tasks-heading">
        <div className="overview-section__header">
          <h2 className="overview-section__title" id="tasks-heading">
            我的任务
          </h2>
        </div>
        <div className="task-table" role="table" aria-label="我的任务列表">
          <div className="task-table__head" role="row">
            <div className="task-table__head-cell" role="columnheader">任务名称</div>
            <div className="task-table__head-cell" role="columnheader">项目</div>
            <div className="task-table__head-cell" role="columnheader">状态</div>
            <div className="task-table__head-cell" role="columnheader">截止日期</div>
          </div>
          {MOCK_TASKS.map((task) => (
            <div
              key={task.id}
              className={`task-row task-row--${task.priority}`}
              role="row"
            >
              <div className="task-row__cell task-row__name" role="cell">
                {task.name}
              </div>
              <div className="task-row__cell task-row__project" role="cell">
                {task.project}
              </div>
              <div className="task-row__cell" role="cell">
                <StatusBadge
                  status={task.status}
                  label={task.statusLabel}
                  size="sm"
                />
              </div>
              <div
                className={`task-row__cell task-row__due${task.overdue ? ' task-row__due--overdue' : ''}`}
                role="cell"
              >
                {task.overdue ? `${task.dueDate} (逾期)` : task.dueDate}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="overview-section" aria-labelledby="activity-heading">
        <div className="overview-section__header">
          <h2 className="overview-section__title" id="activity-heading">
            最近活动
          </h2>
        </div>
        <div className="activity-timeline" role="log" aria-label="最近活动列表">
          {MOCK_ACTIVITIES.map((item) => (
            <div key={item.id} className="activity-item">
              <div
                className="activity-item__dot"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <div className="activity-item__content">
                <span className="activity-item__text">{item.text}</span>
                <span className="activity-item__time">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Insight */}
      <section className="overview-section" aria-labelledby="insight-heading">
        <div className="overview-section__header">
          <h2 className="overview-section__title" id="insight-heading">
            AI 洞察
          </h2>
        </div>
        <div className="insight-card">
          <div className="insight-card__icon" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div className="insight-card__body">
            <div className="insight-card__title">智能调度洞察</div>
            <p className="insight-card__desc">
              检测到 2 项任务即将逾期，建议优先处理"审核采购合同"。
              法务 Agent 当前负载较低，可自动接入协助审查工作，预计可将完成时间提前 40%。
            </p>
            <div className="insight-card__actions">
              <button className="btn-outline" type="button">查看详情</button>
              <button className="btn-primary" type="button">立即处理</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
