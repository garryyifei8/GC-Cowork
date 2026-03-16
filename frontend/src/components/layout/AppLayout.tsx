import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Settings,
  Bell,
  Home,
  Bot,
  ListTodo,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Sparkles,
  MoreHorizontal,
  Plus,
  LayoutGrid,
  ClipboardList,
  Coffee,
} from 'lucide-react';
import { NotificationToast } from '../ui/NotificationToast';
import { NotificationPanel } from '../ui/NotificationPanel';

import { useNotificationStore } from '../../stores/notificationStore';
import { useProjectStore } from '../../stores/projectStore';

// Project status -> board icon color (Monday.com style)
const PROJECT_STATUS_COLOR: Record<string, string> = {
  active: '#00C875',
  risk: '#E2445C',
  planning: '#FDAB3D',
  completed: '#C4C4C4',
};

// ---------------------------------------------------------------------------
// Monday.com style top-level nav item (Home, My Work)
// ---------------------------------------------------------------------------

const SidebarNavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}> = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 h-8 rounded-md text-[15px] transition-colors duration-100
      ${isActive
        ? 'bg-[#cce5ff] text-[#0073ea] font-semibold'
        : 'text-[#323338] hover:bg-[#dcdfec]'
      }`
    }
  >
    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 opacity-80">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

// ---------------------------------------------------------------------------
// Collapsible section (Monday.com "Favorites", "monday AI" style)
// ---------------------------------------------------------------------------

const SidebarSection: React.FC<{
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ label, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#676879] hover:text-[#323338] transition-colors"
      >
        {open
          ? <ChevronDown size={12} className="opacity-60" />
          : <ChevronRight size={12} className="opacity-60" />
        }
        <span className="uppercase tracking-wider">{label}</span>
      </button>
      {open && <div className="flex flex-col gap-0.5">{children}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Board item in workspace (Monday.com board list style with left accent)
// ---------------------------------------------------------------------------

const BoardItem: React.FC<{
  to: string;
  label: string;
  color: string;
}> = ({ to, label, color }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group flex items-center gap-2.5 pl-5 pr-3 h-[30px] text-[14px] transition-colors duration-100 border-l-[3px]
      ${isActive
        ? 'border-l-[#0073ea] bg-[#cce5ff] text-[#0073ea] font-medium'
        : 'border-l-transparent text-[#323338] hover:bg-[#dcdfec]'
      }`
    }
  >
    {/* Board icon: colored rounded square with clipboard icon like Monday.com */}
    <span className="flex items-center justify-center w-[18px] h-[18px] rounded shrink-0" style={{ backgroundColor: color }}>
      <ClipboardList size={11} className="text-white" />
    </span>
    <span className="truncate">{label}</span>
  </NavLink>
);

// ---------------------------------------------------------------------------
// Main layout — Monday.com exact structure:
//   1. Full-width top header (48px, white)
//   2. Below: sidebar (lavender #f6f7fb) + content card (white, rounded-tl-[12px])
// ---------------------------------------------------------------------------

export const AppLayout: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const logoSrc = '/avocado_logo.png';

  // Load projects for workspace board list
  useEffect(() => {
    if (projects.length === 0) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const allNavItems = [
    { path: '/', label: '首页' },
    { path: '/tasks', label: '我的工作' },
    { path: '/daily', label: '我的日常' },
    { path: '/projects', label: '项目管理' },
    { path: '/hr', label: '人事管理' },
    { path: '/finance', label: '财务管理' },
    { path: '/knowledge', label: '知识库' },
    { path: '/chat', label: 'AI小助理' },
  ];

  const getPageTitle = () => {
    const projectMatch = location.pathname.match(/^\/projects\/(.+)/);
    if (projectMatch) {
      const p = projects.find((proj) => proj.id === projectMatch[1]);
      return p ? p.name : '项目详情';
    }
    const currentItem = allNavItems.find(item =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    );
    return currentItem ? currentItem.label : '牛油果CoWork';
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#edf1fc] transition-colors duration-200">

      {/* ================================================================ */}
      {/* Global Header — Monday.com full-width top bar (transparent)      */}
      {/* ================================================================ */}
      <header className="flex items-center justify-between h-14 pl-2 pr-6 bg-transparent shrink-0 z-40">
        {/* Left: Logo + brand name */}
        <div className="flex items-center gap-3 px-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <img src={logoSrc} alt="Avocado CoWork" className="w-full h-full object-contain" />
          </div>
          <span className="text-[16px] font-bold text-[#323338] tracking-tight">
            Avocado <span className="font-normal text-[#676879]">CoWork</span>
          </span>
        </div>

        {/* Right: Search + action icons + avatar */}
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#edf1fc] border border-[#c3c6d4] text-sm text-[#676879] cursor-pointer hover:bg-[#ecedf5] transition-colors">
            <Search size={15} />
            <span>搜索...</span>
            <kbd className="ml-4 px-1.5 py-0.5 text-[10px] rounded bg-white border border-[#c3c6d4] text-[#676879]">/</kbd>
          </div>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
              ${isActive
                ? 'bg-[#cce5ff] text-[#0073ea]'
                : 'text-[#676879] hover:text-[#323338] hover:bg-[#ecedf5]'
              }`
            }
            aria-label="AI小助理"
            title="AI小助理"
          >
            <Bot size={17} />
          </NavLink>

          <div className="relative" ref={notificationRef}>
            <button
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                ${isNotificationOpen
                  ? 'bg-[#cce5ff] text-[#0073ea]'
                  : 'text-[#676879] hover:text-[#323338] hover:bg-[#ecedf5]'
                }`}
              aria-label="通知"
              aria-expanded={isNotificationOpen}
              aria-haspopup="dialog"
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
            >
              <Bell size={17} />
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

          <div className="flex items-center gap-2 pl-2 ml-2 border-l border-[#d0d4e4] cursor-pointer">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f8fafc"
              alt="用户头像"
              className="w-8 h-8 rounded-full"
            />
            <span className="hidden lg:block text-sm font-medium text-[#323338]">用户</span>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* Body — Sidebar (lavender) + Content Card (white, rounded)        */}
      {/* ================================================================ */}
      <div className="flex flex-1 overflow-hidden pl-2">

        {/* ============================================================== */}
        {/* Sidebar — Monday.com left panel on lavender bg                  */}
        {/* ============================================================== */}
        <aside className="flex flex-col w-[240px] bg-[#edf1fc] shrink-0 z-30">

          {/* ---- Top nav items (Home, My Work) ---- */}
          <div className="flex flex-col gap-0.5 px-2 pt-2 pb-1.5">
            <SidebarNavItem to="/" icon={<Home size={18} />} label="首页" end />
            <SidebarNavItem to="/tasks" icon={<ListTodo size={18} />} label="我的工作" />
            <SidebarNavItem to="/daily" icon={<Coffee size={18} />} label="我的日常" />
          </div>

          {/* ---- "更多" expandable — Monday.com "More" pattern ---- */}
          <div className="px-2 pb-1">
            <SidebarSection label="更多" defaultOpen={false}>
              <SidebarNavItem to="/hr" icon={<Users size={18} />} label="人事管理" />
              <SidebarNavItem to="/finance" icon={<CircleDollarSign size={18} />} label="财务管理" />
              <SidebarNavItem to="/knowledge" icon={<BookOpen size={18} />} label="知识库" />
            </SidebarSection>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-[#d0d4e4]" />

          {/* ---- AI section — Monday.com "monday AI" group ---- */}
          <div className="px-2 pt-0.5">
            <SidebarSection label="AI" defaultOpen={true}>
              <SidebarNavItem to="/chat" icon={<Sparkles size={18} />} label="AI小助理" />
            </SidebarSection>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-[#d0d4e4]" />

          {/* ---- Favorites section — Monday.com pattern ---- */}
          <div className="px-2 pt-0.5">
            <SidebarSection label="收藏" defaultOpen={false}>
              <div className="px-4 py-2 text-xs text-[#676879]">
                将常用看板添加到收藏
              </div>
            </SidebarSection>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-[#d0d4e4]" />

          {/* ============================================================ */}
          {/* Workspaces — Monday.com core workspace / board list pattern   */}
          {/* ============================================================ */}
          <div className="flex-1 flex flex-col min-h-0 pt-1">
            {/* Section header with menu + search icons */}
            <div className="flex items-center justify-between px-4 py-1.5">
              <span className="text-xs font-semibold text-[#676879] uppercase tracking-wider">
                工作区
              </span>
              <div className="flex items-center gap-0.5">
                <button type="button" className="p-1 rounded hover:bg-[#dcdfec] text-[#676879] transition-colors" title="搜索看板">
                  <Search size={13} />
                </button>
                <button type="button" className="p-1 rounded hover:bg-[#dcdfec] text-[#676879] transition-colors" title="更多">
                  <MoreHorizontal size={13} />
                </button>
              </div>
            </div>

            {/* Workspace selector — Monday.com "Main workspace" dropdown + blue add btn */}
            <div className="flex items-center gap-1.5 mx-2 mb-1.5">
              <button
                type="button"
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className="flex-1 flex items-center gap-2 px-2 h-8 rounded-md hover:bg-[#dcdfec] transition-colors min-w-0"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-primary to-emerald-500 text-white text-[11px] font-bold shrink-0">
                  主
                </span>
                <span className="text-sm font-medium text-[#323338] truncate">主工作区</span>
                <ChevronDown size={13} className="text-[#676879] shrink-0 ml-auto" />
              </button>
              <NavLink
                to="/projects"
                className="flex items-center justify-center w-7 h-7 rounded-md bg-primary hover:bg-primary-dark text-white transition-colors shrink-0"
                title="新建项目"
              >
                <Plus size={15} />
              </NavLink>
            </div>

            {/* Board list — scrollable */}
            <div className="flex-1 overflow-y-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              {workspaceOpen && (
                <div className="flex flex-col">
                  {/* "项目总览" — like Monday's dashboard board */}
                  <NavLink
                    to="/projects"
                    end
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 pl-5 pr-3 h-[30px] text-[13px] transition-colors duration-100 border-l-[3px]
                      ${isActive
                        ? 'border-l-[#0073ea] bg-[#cce5ff] text-[#0073ea] font-medium'
                        : 'border-l-transparent text-[#323338] hover:bg-[#dcdfec]'
                      }`
                    }
                  >
                    <span className="flex items-center justify-center w-[18px] h-[18px] rounded shrink-0 bg-[#676879]">
                      <LayoutGrid size={11} className="text-white" />
                    </span>
                    <span className="truncate">项目总览</span>
                  </NavLink>

                  {/* Individual project boards */}
                  {projects.map((project) => (
                    <BoardItem
                      key={project.id}
                      to={`/projects/${project.id}`}
                      label={project.name}
                      color={PROJECT_STATUS_COLOR[project.status] ?? '#C4C4C4'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---- Bottom bar ---- */}
          <div className="flex flex-col gap-0.5 px-2 pb-2 pt-1.5 border-t border-[#d0d4e4] shrink-0">
            <SidebarNavItem to="/settings" icon={<Settings size={18} />} label="设置" />
            <div className="flex items-center gap-2.5 px-4 h-10 mt-0.5 rounded-md cursor-pointer hover:bg-[#dcdfec] transition-colors">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f0f2f5"
                alt="用户头像"
                className="w-7 h-7 rounded-full shrink-0"
              />
              <span className="text-sm font-medium text-[#323338] truncate">用户</span>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* Content Card — Monday.com white panel with rounded-tl-[12px]   */}
        {/* box-shadow matches Monday.com exactly                           */}
        {/* ============================================================== */}
        <main
          className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white mb-2"
          style={{
            borderRadius: '12px 0 0 0',
            boxShadow: 'rgb(237, 241, 252) -5px -5px 20px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px',
          }}
        >
          {/* Page title bar — inside the content card */}
          <div className="flex items-center justify-between h-11 px-6 shrink-0">
            <h1 className="text-[15px] font-heading font-semibold text-[#323338]">{getPageTitle()}</h1>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 animate-fade-in bg-white">
            <Outlet />
          </div>
        </main>

      </div>

      <NotificationToast />
    </div>
  );
};
