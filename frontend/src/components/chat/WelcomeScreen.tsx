import React from 'react';
import {
  BarChart3,
  FileText,
  Receipt,
  CalendarDays,
  AlertTriangle,
  BookOpen,
  Users,
  CheckSquare,
} from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <BarChart3 size={20} />,
    iconBg: '#0073ea',
    title: '项目概览',
    description: '查看项目进度',
    message: '请给我查看当前所有项目的进度概览',
  },
  {
    icon: <FileText size={20} />,
    iconBg: '#00C875',
    title: '生成周报',
    description: '自动汇总工作',
    message: '帮我生成本周的工作周报',
  },
  {
    icon: <Receipt size={20} />,
    iconBg: '#FFB264',
    title: '报销查询',
    description: '报销单状态',
    message: '列出所有待审批的报销单',
  },
  {
    icon: <CalendarDays size={20} />,
    iconBg: '#A25DDC',
    title: '请假申请',
    description: '快速发起请假',
    message: '我想发起一个请假申请，请指导我完成流程',
  },
  {
    icon: <AlertTriangle size={20} />,
    iconBg: '#E74C3C',
    title: '风险分析',
    description: '分析项目风险',
    message: '分析当前项目存在哪些风险点',
  },
  {
    icon: <BookOpen size={20} />,
    iconBg: '#579BFC',
    title: '搜索知识',
    description: '查找知识库',
    message: '帮我搜索知识库中与项目管理相关的文档',
  },
  {
    icon: <Users size={20} />,
    iconBg: '#FF642E',
    title: '团队概况',
    description: '人员与考勤',
    message: '给我一个当前所有在职员工的整体概况',
  },
  {
    icon: <CheckSquare size={20} />,
    iconBg: '#00C875',
    title: '待办任务',
    description: '查看未完成',
    message: '列出分配给我的所有进行中任务',
  },
];

interface WelcomeScreenProps {
  onAction: (message: string) => void;
  disabled?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onAction, disabled }) => {
  const randomMascot = React.useMemo(() => {
    const mascots = [
      '/avocado_ceo.png',
      '/avocado_programmer.png',
      '/avocado_builder.png',
      '/avocado_designer.png',
      '/avocado_pm.png',
      '/avocado_hr.png'
    ];
    return mascots[Math.floor(Math.random() * mascots.length)];
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 max-w-[640px] mx-auto w-full">
      {/* Avatar + greeting */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-32 h-32 flex items-center justify-center shrink-0">
          <img src={randomMascot} alt="AI小助理" className="w-[120%] h-[120%] object-contain object-center drop-shadow-md" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-light-text mb-1">AI小助理</h2>
          <p className="text-sm text-light-text-secondary">你的智能工作伙伴，试试下面的快捷操作吧</p>
        </div>
      </div>

      {/* Quick action grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => onAction(action.message)}
            disabled={disabled}
            className="group flex flex-col items-center gap-2.5 p-4 rounded-[10px] bg-white border border-[#d0d4e4] text-center
              transition-all duration-150 hover:border-[#0073ea]/40 hover:bg-[#cce5ff]/20 hover:shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: action.iconBg }}
            >
              {action.icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-light-text">{action.title}</span>
              <span className="text-[11px] text-light-text-secondary">{action.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
