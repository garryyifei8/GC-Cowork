import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    MessageSquare,
    FolderKanban,
    BookOpen,
    Settings,
    Bell,
    Menu,
    Home,
    Bot
} from 'lucide-react';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { path: '/', label: '首页', icon: <Home size={20} /> },
        { path: '/chat', label: 'AI助手', icon: <MessageSquare size={20} /> },
        { path: '/projects', label: '项目管理', icon: <FolderKanban size={20} /> },
        { path: '/knowledge', label: '知识库', icon: <BookOpen size={20} /> },
    ];

    const getPageTitle = () => {
        const currentItem = navItems.find(item => item.path === location.pathname);
        return currentItem ? currentItem.label : 'GC TeamWork';
    };

    return (
        <div className="layout-container">
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon-wrapper">
                            <Bot size={24} color="white" />
                        </div>
                        {isSidebarOpen && <span className="logo-text">GC TeamWork</span>}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            title={!isSidebarOpen ? item.label : undefined}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            {isSidebarOpen && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-user">
                    {isSidebarOpen ? (
                        <div className="sidebar-user-inner">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=292F4C"
                                alt="用户头像"
                                className="sidebar-avatar"
                            />
                            <span className="sidebar-user-name">用户</span>
                        </div>
                    ) : (
                        <div className="sidebar-user-inner sidebar-user-collapsed">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=292F4C"
                                alt="用户头像"
                                className="sidebar-avatar"
                            />
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <NavLink to="/settings" className="nav-item">
                        <div className="nav-icon"><Settings size={20} /></div>
                        {isSidebarOpen && <span className="nav-label">设置</span>}
                    </NavLink>
                    <button
                        className="nav-item sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title={isSidebarOpen ? "收起侧栏" : "展开侧栏"}
                    >
                        <div className="nav-icon"><Menu size={20} /></div>
                        {isSidebarOpen && <span className="nav-label">收起</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <h1 className="page-title">{getPageTitle()}</h1>
                    </div>

                    <div className="topbar-right">
                        <button className="icon-btn hover-lift" aria-label="通知">
                            <Bell size={20} />
                            <span className="badge indicator"></span>
                        </button>
                        <div className="user-profile hover-lift">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f8fafc"
                                alt="用户头像"
                                className="avatar"
                            />
                            <span className="user-name">用户</span>
                        </div>
                    </div>
                </header>

                <div className="content-area animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
