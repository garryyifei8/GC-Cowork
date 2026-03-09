import React from 'react';
import {
    Search,
    FileText,
    BookMarked,
    FolderOpen,
    UploadCloud,
    Clock,
    ThumbsUp
} from 'lucide-react';
import './KnowledgeBase.css';

const categories = [
    { id: 'all', name: '全部分类', count: 128, active: true },
    { id: 'project', name: '项目经验库', count: 45 },
    { id: 'policy', name: '政策与制度', count: 32 },
    { id: 'template', name: '标准模板', count: 28 },
    { id: 'tech', name: '技术文档', count: 23 },
];

const RECENT_DOCS = [
    {
        id: 1,
        title: '智慧园区EPC项目全流程复盘记录_V1.2',
        author: '王项目',
        date: '2小时前',
        type: 'pdf',
        color: '#ef4444',
        likes: 12
    },
    {
        id: 2,
        title: '【国家发改委】2026年专项债申报指南',
        author: '知识库助手 (AI抓取)',
        date: '昨天 14:30',
        type: 'doc',
        color: '#3b82f6',
        likes: 45
    },
    {
        id: 3,
        title: '信息化集成平台公共组件API文档_v2.0',
        author: '李开发',
        date: '昨天 09:15',
        type: 'code',
        color: '#10b981',
        likes: 38
    },
    {
        id: 4,
        title: '博物馆展陈设计标准合同模板(2026版)',
        author: '赵法务',
        date: '3天前',
        type: 'doc',
        color: '#3b82f6',
        likes: 56
    }
];

const docBorderColor: Record<string, string> = {
    pdf: 'var(--color-danger)',
    doc: 'var(--color-info)',
    code: 'var(--color-success)',
};

const docIconBg: Record<string, string> = {
    pdf: 'var(--color-danger)',
    doc: 'var(--color-info)',
    code: 'var(--color-success)',
};

export const KnowledgeBase: React.FC = () => {
    return (
        <div className="knowledge-base animate-fade-in">
            {/* Header */}
            <div className="kb-header">
                <div className="kb-title">
                    <h2>企业智能知识库</h2>
                    <span className="kb-subtitle">构建可进化的组织智能 · 当前检索库含 128 份核心文档</span>
                </div>
                <div className="kb-actions">
                    <button className="kb-upload-btn">
                        <UploadCloud size={16} /> 上传并学习
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="kb-search-container">
                <Search size={18} className="kb-search-icon" />
                <input
                    type="text"
                    className="kb-search-input"
                    placeholder="使用自然语言搜索：例如 '找一下关于专项债申请的最新模板'"
                />
                <button className="kb-search-btn">智能检索</button>
            </div>

            {/* Content */}
            <div className="kb-content">
                {/* Sidebar */}
                <aside className="kb-sidebar">
                    <div className="kb-sidebar-header">
                        <FolderOpen size={16} className="kb-sidebar-icon" />
                        <span>知识分类</span>
                    </div>
                    <div className="category-list">
                        {categories.map(cat => (
                            <div key={cat.id} className={`category-item${cat.active ? ' active' : ''}`}>
                                <span className="category-name">{cat.name}</span>
                                <span className="doc-count">{cat.count}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Area */}
                <main className="kb-main">
                    <div className="section-title">
                        <Clock size={18} className="section-title-icon" />
                        <span>最近更新 / 常用文档</span>
                    </div>

                    <div className="docs-grid">
                        {RECENT_DOCS.map(doc => (
                            <div
                                key={doc.id}
                                className="doc-card"
                                style={{ borderLeftColor: docBorderColor[doc.type] ?? 'var(--color-border)' }}
                            >
                                <div className="doc-header">
                                    <div
                                        className="doc-icon"
                                        style={{ background: docIconBg[doc.type] ?? 'var(--color-text-muted)' }}
                                    >
                                        <FileText size={18} color="white" />
                                    </div>
                                    <div className="doc-info">
                                        <h4 className="doc-title">{doc.title}</h4>
                                        <div className="doc-meta">
                                            <span>{doc.author}</span>
                                            <span className="doc-meta-sep">·</span>
                                            <span>{doc.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="doc-footer">
                                    <div className="doc-tag">
                                        <BookMarked size={13} />
                                        <span>知识库 V2</span>
                                    </div>
                                    <div className="doc-likes">
                                        <ThumbsUp size={13} />
                                        <span>{doc.likes} 人点赞参考</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};
