import React from 'react';
import {
    Filter,
    Plus,
    Sparkles,
    Map,
    MonitorPlay,
    Building2,
    ChevronDown
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import type { StatusVariant } from '../components/ui/StatusBadge';
import './ProjectsDashboard.css';

interface Project {
    id: number;
    title: string;
    type: string;
    status: 'active' | 'risk' | 'planning';
    statusVariant: StatusVariant;
    statusLabel: string;
    progress: number;
    dueDate: string;
    budget: string;
    icon: React.ReactNode;
    iconColor: string;
    teamSize: number;
    group: 'active' | 'planning';
}

const mockProjects: Project[] = [
    {
        id: 1,
        title: '省立博物馆EPC工程',
        type: 'EPC / 展馆',
        status: 'active',
        statusVariant: 'success',
        statusLabel: '施工中',
        progress: 68,
        dueDate: '2026-10-15',
        budget: '1.2亿',
        icon: <Map size={16} />,
        iconColor: '#00C875',
        teamSize: 12,
        group: 'active'
    },
    {
        id: 2,
        title: '发改委平台信息化二期',
        type: '信息化开发',
        status: 'risk',
        statusVariant: 'danger',
        statusLabel: '进度延误',
        progress: 35,
        dueDate: '2026-06-30',
        budget: '450万',
        icon: <MonitorPlay size={16} />,
        iconColor: '#E2445C',
        teamSize: 8,
        group: 'active'
    },
    {
        id: 3,
        title: '智慧园区专项债可研',
        type: '专项债咨询',
        status: 'planning',
        statusVariant: 'info',
        statusLabel: '立项评估',
        progress: 15,
        dueDate: '2026-04-20',
        budget: '80万',
        icon: <Building2 size={16} />,
        iconColor: '#0086C0',
        teamSize: 5,
        group: 'planning'
    }
];

const avatarColors = [
    '#6161FF', '#00C875', '#FDAB3D', '#E2445C',
    '#0086C0', '#9B51E0', '#FF7A59', '#37B4E3'
];

interface TeamStackProps {
    teamSize: number;
    projectTitle: string;
}

const TeamStack: React.FC<TeamStackProps> = ({ teamSize, projectTitle }) => {
    const visibleCount = Math.min(teamSize, 3);
    const remainder = teamSize - visibleCount;
    return (
        <div className="team-stack">
            {Array.from({ length: visibleCount }).map((_, i) => (
                <div
                    key={i}
                    className="team-avatar-circle"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                    title={`${projectTitle} 成员 ${i + 1}`}
                >
                    {String.fromCharCode(65 + (projectTitle.charCodeAt(0) + i) % 26)}
                </div>
            ))}
            {remainder > 0 && (
                <div className="team-avatar-circle team-avatar-count">
                    +{remainder}
                </div>
            )}
        </div>
    );
};

interface ProjectRowProps {
    project: Project;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project }) => {
    const progressColor =
        project.status === 'active' ? 'var(--color-success)' :
        project.status === 'risk' ? 'var(--color-danger)' :
        'var(--color-info)';

    return (
        <div className="board-row">
            <div className="board-cell board-cell--name">
                <span
                    className="project-row-icon"
                    style={{ background: project.iconColor + '1A', color: project.iconColor }}
                >
                    {project.icon}
                </span>
                <span className="project-row-title">{project.title}</span>
            </div>
            <div className="board-cell board-cell--type">
                <span className="cell-text-muted">{project.type}</span>
            </div>
            <div className="board-cell board-cell--status">
                <StatusBadge
                    status={project.statusVariant}
                    label={project.statusLabel}
                    size="sm"
                />
            </div>
            <div className="board-cell board-cell--progress">
                <div className="progress-bar-inline">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${project.progress}%`, background: progressColor }}
                    />
                </div>
                <span className="progress-bar-pct">{project.progress}%</span>
            </div>
            <div className="board-cell board-cell--due">
                <span className="cell-text-muted">{project.dueDate}</span>
            </div>
            <div className="board-cell board-cell--budget">
                <span className="cell-text-main">{project.budget}</span>
            </div>
            <div className="board-cell board-cell--team">
                <TeamStack teamSize={project.teamSize} projectTitle={project.title} />
                <span className="team-count-label">{project.teamSize}人</span>
            </div>
        </div>
    );
};

interface GroupSectionProps {
    label: string;
    color: string;
    bgTint: string;
    projects: Project[];
}

const GroupSection: React.FC<GroupSectionProps> = ({ label, color, bgTint, projects }) => {
    return (
        <div className="board-group">
            <div
                className="group-header"
                style={{ borderLeftColor: color, background: bgTint }}
            >
                <ChevronDown size={14} style={{ color }} />
                <span className="group-header-label" style={{ color }}>{label}</span>
                <span className="group-header-count">{projects.length}</span>
            </div>
            {projects.map(project => (
                <ProjectRow key={project.id} project={project} />
            ))}
        </div>
    );
};

export const ProjectsDashboard: React.FC = () => {
    const activeProjects = mockProjects.filter(p => p.group === 'active');
    const planningProjects = mockProjects.filter(p => p.group === 'planning');

    return (
        <div className="projects-dashboard animate-fade-in">
            {/* Header */}
            <div className="projects-header">
                <div className="projects-title">
                    <h2>项目集概览</h2>
                    <span className="projects-subtitle">3 个活跃项目 · 智能调度进行中</span>
                </div>
                <div className="projects-actions">
                    <button className="btn btn-outline hover-lift">
                        <Filter size={16} /> 筛选
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={16} /> 新建立项
                    </button>
                </div>
            </div>

            {/* AI Insights Card */}
            <div className="ai-insights-card hover-lift">
                <div className="insight-icon-wrap">
                    <Sparkles size={18} />
                </div>
                <div className="insight-body">
                    <h4 className="insight-title">智能调度洞察</h4>
                    <p className="insight-desc">
                        发改委平台信息化二期后端开发进度延后3天，已导致测试阶段产生瓶颈。建议将博物馆项目空闲的1名全栈工程师调配至本组。已生成调整方案。
                    </p>
                    <div className="insight-actions">
                        <button className="btn btn-primary btn--sm">一键调配资源</button>
                        <button className="btn btn-outline btn--sm">查看详情</button>
                    </div>
                </div>
            </div>

            {/* Board / Table */}
            <div className="projects-board">
                {/* Column header row */}
                <div className="board-header-row">
                    <div className="board-cell board-cell--name">项目名称</div>
                    <div className="board-cell board-cell--type">类型</div>
                    <div className="board-cell board-cell--status">状态</div>
                    <div className="board-cell board-cell--progress">进度</div>
                    <div className="board-cell board-cell--due">截止日期</div>
                    <div className="board-cell board-cell--budget">预算</div>
                    <div className="board-cell board-cell--team">团队</div>
                </div>

                {/* Active projects group */}
                <GroupSection
                    label="活跃项目"
                    color="#00C875"
                    bgTint="rgba(0, 200, 117, 0.06)"
                    projects={activeProjects}
                />

                {/* Planning group */}
                <GroupSection
                    label="规划中"
                    color="#0086C0"
                    bgTint="rgba(0, 134, 192, 0.06)"
                    projects={planningProjects}
                />
            </div>
        </div>
    );
};
