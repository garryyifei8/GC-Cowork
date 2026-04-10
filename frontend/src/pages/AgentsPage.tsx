import React, { useState } from 'react';
import {
  Bot,
  Brain,
  Shield,
  FileText,
  Users,
  Briefcase,
  Scale,
  ShoppingCart,
  TrendingUp,
  BookOpen,
  Activity,
  Eye,
  Search,
  CheckCircle,
  X,
  BarChart3,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useChatStore } from '../stores/chatStore';

// ─── Agent Definitions ────────────────────────────────────────────────────────

interface AgentDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  defaultPrompt: string;
  capabilities: string[];
  examplePrompts: string[];
  scenarios: string;
}

const AGENTS: AgentDef[] = [
  {
    id: 'project',
    name: '项目管理Agent',
    description: '项目全周期管理，进度追踪、里程碑管理、风险预警、资源调度建议',
    icon: <Briefcase className="w-5 h-5" />,
    color: '#00C875',
    category: '核心业务',
    defaultPrompt: '请给我查看当前所有项目的进度概览',
    capabilities: [
      '项目进度追踪与里程碑管理',
      '风险识别与预警分析',
      '资源调度建议',
      'WBS工作分解结构',
      '跨项目对比分析',
      '进度报告自动生成',
    ],
    examplePrompts: [
      '请给我查看当前所有项目的进度概览',
      '分析博物馆EPC项目存在哪些风险点',
      '帮我生成本周的项目进度报告',
    ],
    scenarios: '适用于项目经理、PMO和高管了解项目执行状况，进行进度跟踪、风险预警和资源调配决策。',
  },
  {
    id: 'finance',
    name: '财务Agent',
    description: '费用报销审核、预算对比分析、资金计划提醒、发票校验、财评协助',
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#FFCB00',
    category: '核心业务',
    defaultPrompt: '给我一份当前财务状况的整体概览',
    capabilities: [
      '费用报销智能审核',
      '预算对比与偏差分析',
      '资金计划与现金流预测',
      '发票真伪与合规校验',
      '财评辅助与建议',
      '财务报表自动生成',
    ],
    examplePrompts: [
      '给我一份当前财务状况的整体概览',
      '分析本季度的预算执行情况',
      '帮我审核这份报销单是否合规',
    ],
    scenarios: '适用于财务部门、项目经理和管理层进行财务状况监控、费用审核和预算管理。',
  },
  {
    id: 'legal',
    name: '法务Agent',
    description: '合同条款审查、风险条款标注、合规性检查、招标文件法律审查',
    icon: <Scale className="w-5 h-5" />,
    color: '#E2445C',
    category: '核心业务',
    defaultPrompt: '请列出当前所有合同的状态和风险项',
    capabilities: [
      '合同条款智能审查',
      '风险条款自动标注',
      '合规性全面检查',
      '招标文件法律审查',
      '争议条款对比分析',
      '合同履约进度跟踪',
    ],
    examplePrompts: [
      '请列出当前所有合同的状态和风险项',
      '审查这份EPC合同中的风险条款',
      '检查最新采购合同的合规性',
    ],
    scenarios: '适用于法务团队、项目经理和管理层进行合同管理、法律风险防控和合规性审查。',
  },
  {
    id: 'procurement',
    name: '采购Agent',
    description: '供应商匹配推荐、比价分析、采购流程跟踪、政府采购合规校验',
    icon: <ShoppingCart className="w-5 h-5" />,
    color: '#0085FF',
    category: '核心业务',
    defaultPrompt: '列出当前所有采购包的执行状态',
    capabilities: [
      '供应商智能匹配推荐',
      '多方报价比价分析',
      '采购流程全程跟踪',
      '政府采购合规校验',
      '采购计划优化建议',
      '历史采购数据分析',
    ],
    examplePrompts: [
      '列出当前所有采购包的执行状态',
      '推荐适合钢结构施工的供应商',
      '分析近三个月的采购成本趋势',
    ],
    scenarios: '适用于采购部门和项目经理进行供应商管理、比价决策和采购合规性控制。',
  },
  {
    id: 'hr',
    name: '人事Agent',
    description: '考勤统计、绩效数据汇总、招聘进度追踪、政策答疑',
    icon: <Users className="w-5 h-5" />,
    color: '#9D44FF',
    category: '核心业务',
    defaultPrompt: '给我一个当前所有在职员工的整体概况',
    capabilities: [
      '考勤数据自动统计',
      '绩效数据汇总分析',
      '招聘进度全程追踪',
      '人事政策答疑解惑',
      '人员配置优化建议',
      '员工离职风险预警',
    ],
    examplePrompts: [
      '给我一个当前所有在职员工的整体概况',
      '统计本月各部门的考勤情况',
      '查看当前进行中的招聘岗位',
    ],
    scenarios: '适用于HR部门和管理层进行人员管理、考勤统计、绩效评估和招聘流程跟踪。',
  },
  {
    id: 'document',
    name: '文档Agent',
    description: '文档生成与模板填充、格式转换、版本管理、智能摘要',
    icon: <BookOpen className="w-5 h-5" />,
    color: '#6B5CE7',
    category: '核心业务',
    defaultPrompt: '帮我搜索知识库中最近更新的文档',
    capabilities: [
      '文档自动生成与填充',
      '多格式智能转换',
      '文档版本管理追踪',
      '长文档智能摘要',
      '文档模板库管理',
      '多人协作审阅支持',
    ],
    examplePrompts: [
      '帮我搜索知识库中最近更新的文档',
      '生成本月的项目月报草稿',
      '帮我总结这份60页的施工方案',
    ],
    scenarios: '适用于项目团队所有成员进行日常文档处理、报告生成和知识沉淀。',
  },
  {
    id: 'knowledge',
    name: '知识Agent',
    description: '经验检索、案例推荐、标准规范查询、新员工培训引导',
    icon: <Brain className="w-5 h-5" />,
    color: '#00D2D3',
    category: '核心业务',
    defaultPrompt: '搜索知识库中与项目管理相关的经验',
    capabilities: [
      '企业知识库智能检索',
      '历史案例精准推荐',
      '行业标准规范查询',
      '政策法规问答解读',
      '新员工培训引导',
      '最佳实践经验提炼',
    ],
    examplePrompts: [
      '搜索知识库中与项目管理相关的经验',
      '查询房屋建筑工程的验收规范',
      '推荐类似地铁工程的历史案例',
    ],
    scenarios: '适用于全体员工进行知识检索、经验复用和新人培训，降低知识获取门槛。',
  },
  {
    id: 'process_control',
    name: '过控Agent',
    description: '四控管理：进度控制、质量控制、安全控制、成本控制，偏差预警和纠偏建议',
    icon: <Activity className="w-5 h-5" />,
    color: '#FF6900',
    category: '专项管理',
    defaultPrompt: '分析当前项目的进度和质量控制情况',
    capabilities: [
      '施工进度偏差监控',
      '质量问题追踪管理',
      '安全隐患预警分析',
      '成本超支实时预警',
      '四控综合看板展示',
      '纠偏措施智能建议',
    ],
    examplePrompts: [
      '分析当前项目的进度和质量控制情况',
      '查看本周的安全检查情况',
      '分析成本超支的主要原因',
    ],
    scenarios: '适用于工程项目的过程控制管理人员，实现进度、质量、安全、成本的一体化管控。',
  },
  {
    id: 'supervision',
    name: '监理Agent',
    description: '旁站监理、巡视检查、平行检验、监理报告生成',
    icon: <Eye className="w-5 h-5" />,
    color: '#579BFC',
    category: '专项管理',
    defaultPrompt: '查看最近的监理巡检和平行检验记录',
    capabilities: [
      '旁站监理记录管理',
      '巡视检查任务调度',
      '平行检验数据分析',
      '监理报告自动生成',
      '质量问题台账管理',
      '整改通知单跟踪',
    ],
    examplePrompts: [
      '查看最近的监理巡检和平行检验记录',
      '生成本周的监理日志',
      '列出当前未整改的质量问题',
    ],
    scenarios: '适用于监理工程师和总监进行日常监理工作记录、质量把控和监理报告生成。',
  },
];

// ─── AI Capability Matrix ─────────────────────────────────────────────────────

const CAPABILITY_MATRIX = [
  {
    id: 'analytics',
    name: '数据分析',
    icon: <BarChart3 className="w-5 h-5" />,
    color: '#00CAE3',
    bgColor: '#E8FAFB',
    items: ['项目进度分析', '风险评估建模', '预算对比分析', '资源热力图'],
  },
  {
    id: 'docgen',
    name: '文档生成',
    icon: <FileText className="w-5 h-5" />,
    color: '#796DF6',
    bgColor: '#F0EFFE',
    items: ['周报自动生成', '合同草拟辅助', '投标书框架', '会议纪要整理'],
  },
  {
    id: 'review',
    name: '智能审核',
    icon: <Shield className="w-5 h-5" />,
    color: '#FFB264',
    bgColor: '#FFF5EA',
    items: ['报销智能审核', '合同条款检查', '合规性校验', '财评分析辅助'],
  },
  {
    id: 'knowledge',
    name: '知识检索',
    icon: <BookOpen className="w-5 h-5" />,
    color: '#2ED47E',
    bgColor: '#EAFAF2',
    items: ['案例经验检索', '标准规范查询', '政策法规问答', '培训指导服务'],
  },
];

// ─── Agent Card ───────────────────────────────────────────────────────────────

interface AgentCardProps {
  agent: AgentDef;
  onTry: (agent: AgentDef) => void;
  onSelect: (agent: AgentDef) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onTry, onSelect }) => {
  return (
    <div
      className="bg-white rounded-[10px] p-5 border border-[#E8ECF4] hover:bg-[#F4F6FC] transition-colors duration-150 cursor-pointer flex flex-col gap-4"
      onClick={() => onSelect(agent)}
    >
      {/* Top row: icon + name + status */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: agent.color }}
        >
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-light-text text-sm leading-tight">{agent.name}</h3>
            <span className="w-2 h-2 rounded-full bg-[#2ED47E] flex-shrink-0" title="在线" />
          </div>
          <span className="text-xs text-light-text-secondary mt-0.5 inline-block">
            {agent.category}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-light-text-secondary leading-relaxed line-clamp-2 -mt-1">
        {agent.description}
      </p>

      {/* Capability tags – first 3 only */}
      <div className="flex flex-wrap gap-1.5">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="text-xs bg-[#EFF3F9] text-light-text-secondary px-2 py-0.5 rounded-full"
          >
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="text-xs text-light-text-secondary px-1">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(agent);
          }}
          className="text-xs text-light-text-secondary flex items-center gap-1 hover:text-light-text transition-colors"
        >
          查看详情 <ChevronRight className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTry(agent);
          }}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-[6px] hover:bg-primary/90 transition-colors"
        >
          <Play className="w-3 h-3" />
          试用
        </button>
      </div>
    </div>
  );
};

// ─── Agent Detail Drawer ──────────────────────────────────────────────────────

interface AgentDetailDrawerProps {
  agent: AgentDef | null;
  onClose: () => void;
  onSendPrompt: (prompt: string) => void;
}

const AgentDetailDrawer: React.FC<AgentDetailDrawerProps> = ({ agent, onClose, onSendPrompt }) => {
  if (!agent) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECF4]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: agent.color }}
            >
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-light-text">{agent.name}</h2>
                <span className="w-2 h-2 rounded-full bg-[#2ED47E]" title="在线" />
              </div>
              <span className="text-xs text-light-text-secondary">{agent.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EFF3F9] text-light-text-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          <div>
            <p className="text-sm text-light-text-secondary leading-relaxed">{agent.description}</p>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-sm font-medium text-light-text mb-3">核心能力</h3>
            <ul className="space-y-2">
              {agent.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-[#2ED47E] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-light-text-secondary">{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Example prompts */}
          <div>
            <h3 className="text-sm font-medium text-light-text mb-3">示例对话</h3>
            <div className="flex flex-col gap-2">
              {agent.examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSendPrompt(prompt)}
                  className="flex items-center gap-2 text-left w-full px-3 py-2.5 rounded-[8px] border border-[#E8ECF4] bg-[#EFF3F9] hover:bg-[#E4EAF6] transition-colors group"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-sm text-light-text-secondary group-hover:text-light-text transition-colors">
                    {prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scenarios */}
          <div>
            <h3 className="text-sm font-medium text-light-text mb-2">适用场景</h3>
            <p className="text-sm text-light-text-secondary leading-relaxed bg-[#EFF3F9] rounded-[8px] px-3 py-2.5">
              {agent.scenarios}
            </p>
          </div>
        </div>

        {/* Footer action */}
        <div className="px-6 py-4 border-t border-[#E8ECF4]">
          <button
            onClick={() => onSendPrompt(agent.defaultPrompt)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-medium text-sm py-2.5 rounded-[8px] hover:bg-primary/90 transition-colors"
          >
            <Bot className="w-4 h-4" />
            开始对话
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AgentsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const openPanel = useChatStore((s) => s.openPanel);

  const categories = ['全部', '核心业务', '专项管理'];

  const filteredAgents = AGENTS.filter((agent) => {
    const matchesCategory = selectedCategory === '全部' || agent.category === selectedCategory;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTryAgent = (agent: AgentDef) => {
    openPanel();
    sendMessage(agent.defaultPrompt);
  };

  const handleSendPrompt = (prompt: string) => {
    setSelectedAgent(null);
    openPanel();
    sendMessage(prompt);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-xl font-medium text-light-text flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-primary" />
          AI Agent 中心
        </h1>
        <p className="text-sm text-light-text-secondary mt-1.5">
          选择专业的 AI Agent 处理不同领域的任务，点击「试用」直接开始对话
        </p>
      </div>

      {/* ── Search & Filter ────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary" />
          <input
            type="text"
            placeholder="搜索 Agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white text-light-text placeholder:text-light-text-secondary"
          />
        </div>
        <div className="flex gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-[8px] text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-[#EFF3F9] text-light-text-secondary hover:bg-[#E4EAF6]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Agent Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onTry={handleTryAgent}
            onSelect={setSelectedAgent}
          />
        ))}
        {filteredAgents.length === 0 && (
          <div className="col-span-3 py-16 text-center text-light-text-secondary text-sm">
            未找到匹配的 Agent
          </div>
        )}
      </div>

      {/* ── AI Capability Matrix ───────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-base font-medium text-light-text flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          AI 能力矩阵
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CAPABILITY_MATRIX.map((cap) => (
            <div
              key={cap.id}
              className="bg-white rounded-[10px] p-4 border border-[#E8ECF4] hover:bg-[#F4F6FC] transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cap.bgColor, color: cap.color }}
                >
                  {cap.icon}
                </div>
                <span className="text-sm font-medium text-light-text">{cap.name}</span>
              </div>
              <ul className="space-y-1.5">
                {cap.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cap.color }}
                    />
                    <span className="text-xs text-light-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Banner ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary to-[#00CAE3] rounded-[10px] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium">共 {AGENTS.length} 个专业 Agent</h3>
            <p className="text-white/80 text-sm mt-1">覆盖项目管理全生命周期</p>
          </div>
          <div className="text-5xl font-medium opacity-90">{AGENTS.length}+</div>
        </div>
      </div>

      {/* ── Agent Detail Drawer ────────────────────────────────────────────── */}
      <AgentDetailDrawer
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onSendPrompt={handleSendPrompt}
      />
    </div>
  );
};

export default AgentsPage;
