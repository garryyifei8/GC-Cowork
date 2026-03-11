import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  BookOpen,
  Settings,
  Bell,
  Home,
  Bot,
  ListTodo,
  Users,
  Wallet,
  Search,
} from 'lucide-react';
import { NotificationToast } from '../ui/NotificationToast';
import { NotificationPanel } from '../ui/NotificationPanel';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useNotificationStore } from '../../stores/notificationStore';
import { useChatStore } from '../../stores/chatStore';
import { AIChatPanel } from '../chat/AIChatPanel';

export const AppLayout: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isPanelOpen = useChatStore((s) => s.isPanelOpen);
  const togglePanel = useChatStore((s) => s.togglePanel);

  useEffect(() => {
    if (!isNotificationOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen]);

  const navItems = [
    { path: '/', label: '首页', icon: <Home size={18} /> },
    { path: '/tasks', label: '任务', icon: <ListTodo size={18} /> },
    { path: '/projects', label: '项目管理', icon: <FolderKanban size={18} /> },
    { path: '/hr', label: '人事管理', icon: <Users size={18} /> },
    { path: '/finance', label: '财务管理', icon: <Wallet size={18} /> },
    { path: '/knowledge', label: '知识库', icon: <BookOpen size={18} /> },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : '牛油果CoWork';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`flex flex-col h-full bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border
          transition-all duration-300 ease-in-out z-30 shrink-0
          ${isHovered ? 'w-60' : 'w-[72px]'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-light-border dark:border-dark-border">
          <div className="w-9 h-9 rounded-lg bg-avocado/10 flex items-center justify-center text-xl shrink-0">
            🥑
          </div>
          <span className={`ml-3 font-heading font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300
            ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            牛油果CoWork
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`
              }
              title={!isHovered ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300
                ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="py-4 px-3 space-y-1 border-t border-light-border dark:border-dark-border">
          <button
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200
              ${isPanelOpen
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            onClick={togglePanel}
            title="AI 助手"
            type="button"
          >
            <div className="shrink-0"><Bot size={18} /></div>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300
              ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              AI 助手
            </span>
          </button>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`
            }
            title={!isHovered ? '设置' : undefined}
          >
            <div className="shrink-0"><Settings size={18} /></div>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300
              ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              设置
            </span>
          </NavLink>

          {/* User avatar */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f0f2f5"
              alt="用户头像"
              className="w-8 h-8 rounded-full shrink-0"
            />
            <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
              ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              用户
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shrink-0">
          <h1 className="text-lg font-heading font-semibold">{getPageTitle()}</h1>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-400 cursor-pointer">
              <Search size={16} />
              <span>搜索...</span>
              <kbd className="ml-4 px-1.5 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">/</kbd>
            </div>

            <ThemeToggle />

            {/* AI toggle */}
            <button
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                ${isPanelOpen
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700'
                }`}
              onClick={togglePanel}
              aria-label="AI 助手"
              title="AI 助手"
              type="button"
            >
              <Bot size={18} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                  ${isNotificationOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                aria-label="通知"
                aria-expanded={isNotificationOpen}
                aria-haspopup="dialog"
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>

            {/* User */}
            <div className="flex items-center gap-2 pl-2 ml-2 border-l border-light-border dark:border-dark-border cursor-pointer">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f8fafc"
                alt="用户头像"
                className="w-8 h-8 rounded-full"
              />
              <span className="hidden lg:block text-sm font-medium">用户</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* AI Chat Panel */}
      <AIChatPanel />
      <NotificationToast />
    </div>
  );
};
