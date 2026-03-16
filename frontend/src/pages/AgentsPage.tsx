import React from 'react';
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
  Cog,
  Activity,
  Eye,
  Search,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// Agent definitions matching backend AgentType
const AGENTS = [
  {
    id: 'project',
    name: '项目管理Agent',
    description: '项目全周期管理，包括进度追踪、里程碑管理、风险预警、资源调度建议、WBS分解',
    icon: <Briefcase className="w-6 h-6" />,
    color: '#00C875',
    category: '核心业务',
  },
  {
    id: 'finance',
    name: '财务Agent',
    description: '费用报销审核、预算对比分析、资金计划提醒、发票校验、财评协助',
    icon: <TrendingUp className="w-6 h-6" />,
    color: '#FFCB00',
    category: '核心业务',
  },
  {
    id: 'legal',
    name: '法务Agent',
    description: '合同条款审查、风险条款标注、合规性检查、招标文件法律审查',
    icon: <Scale className="w-6 h-6" />,
    color: '#E2445C',
    category: '核心业务',
  },
  {
    id: 'procurement',
    name: '采购Agent',
    description: '供应商匹配推荐、比价分析、采购流程跟踪、政府采购合规校验',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: '#0085FF',
    category: '核心业务',
  },
  {
    id: 'hr',
    name: '人事Agent',
    description: '考勤统计、绩效数据汇总、招聘进度追踪、政策答疑',
    icon: <Users className="w-6 h-6" />,
    color: '#9D44FF',
    category: '核心业务',
  },
  {
    id: 'bidding',
    name: '投标Agent',
    description: '招标信息监控、标书框架生成、历史中标分析、资质匹配、评标模拟',
    icon: <FileText className="w-6 h-6" />,
    color: '#FDAB3D',
    category: '核心业务',
  },
  {
    id: 'document',
    name: '文档Agent',
    description: '文档生成/模板填充、格式转换、版本管理、智能摘要',
    icon: <BookOpen className="w-6 h-6" />,
    color: '#6B5CE7',
    category: '核心业务',
  },
  {
    id: 'knowledge',
    name: '知识Agent',
    description: '经验检索、案例推荐、标准规范查询、新员工培训引导',
    icon: <Brain className="w-6 h-6" />,
    color: '#00D2D3',
    category: '核心业务',
  },
  {
    id: 'process_control',
    name: '过控Agent',
    description: '四控管理：进度控制、质量控制、安全控制、成本控制，偏差预警和纠偏建议',
    icon: <Activity className="w-6 h-6" />,
    color: '#FF6900',
    category: '新增',
  },
  {
    id: 'supervision',
    name: '监理Agent',
    description: '旁站监理、巡视检查、平行检验、监理报告生成',
    icon: <Eye className="w-6 h-6" />,
    color: '#579BFc',
    category: '新增',
  },
];

const SKILLS = [
  {
    id: 'code-review',
    name: '代码审查',
    description: '多角度代码分析，安全、性能、架构审查',
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: 'tdd',
    name: 'TDD开发',
    description: '测试驱动开发，红色-绿色-重构循环',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    id: 'refactor',
    name: '代码重构',
    description: '代码质量改进，设计模式应用',
    icon: <Cog className="w-5 h-5" />,
  },
  {
    id: 'security',
    name: '安全扫描',
    description: 'OWASP安全检查，合规性验证',
    icon: <Shield className="w-5 h-5" />,
  },
];

const AgentsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('全部');
  const [searchQuery, setSearchQuery] = React.useState('');

  const categories = ['全部', '核心业务', '新增'];

  const filteredAgents = AGENTS.filter(agent => {
    const matchesCategory = selectedCategory === '全部' || agent.category === selectedCategory;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#323338] flex items-center gap-3">
          <Bot className="w-8 h-8 text-[#0073ea]" />
          AI Agent 中心
        </h1>
        <p className="text-[#676879] mt-2">
          选择专业的AI Agent来处理不同领域的任务
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#676879]" />
          <input
            type="text"
            placeholder="搜索Agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#d0d4e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0073ea] text-white'
                  : 'bg-[#edf1fc] text-[#676879] hover:bg-[#dcdfec]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredAgents.map(agent => (
          <div
            key={agent.id}
            className="bg-white rounded-xl p-5 border border-[#d0d4e4] hover:shadow-lg hover:border-[#0073ea] transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: agent.color }}
              >
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#323338] group-hover:text-[#0073ea] transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-[#676879] mt-1 line-clamp-2">
                  {agent.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#a0a1a3] bg-[#f5f6f8] px-2 py-1 rounded">
                {agent.category}
              </span>
              <button className="text-[#0073ea] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                试用 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Skills Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-[#323338] flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-[#00D2D3]" />
          技能中心
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SKILLS.map(skill => (
            <div
              key={skill.id}
              className="bg-white rounded-xl p-4 border border-[#d0d4e4] hover:shadow-md hover:border-[#00D2D3] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#edf1fc] flex items-center justify-center text-[#00D2D3]">
                  {skill.icon}
                </div>
                <div>
                  <h3 className="font-medium text-[#323338]">{skill.name}</h3>
                  <p className="text-xs text-[#676879]">{skill.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 bg-gradient-to-r from-[#0073ea] to-[#00D2D3] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">共 {AGENTS.length} 个专业Agent</h3>
            <p className="text-white/80 mt-1">覆盖项目管理全生命周期</p>
          </div>
          <div className="text-4xl font-bold">
            {AGENTS.length}+
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
