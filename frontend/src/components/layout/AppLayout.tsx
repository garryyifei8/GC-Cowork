import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Bell, Bot, ListTodo, Users, Search,
  ChevronDown, ChevronRight, CircleDollarSign, Sparkles, BookOpen,
  Coffee, Target, Scale, ShieldCheck, HardHat, BarChart3, FolderKanban,
  Menu, X, FileText, Cog, Package, ClipboardList,
} from 'lucide-react';
import { NotificationToast } from '../ui/NotificationToast';
import { NotificationPanel } from '../ui/NotificationPanel';
import { useNotificationStore } from '../../stores/notificationStore';
import { useProjectStore } from '../../stores/projectStore';

// ---------------------------------------------------------------------------
// Sidebar menu structure (Preclinic-inspired grouping)
// ---------------------------------------------------------------------------

interface MenuItem {
  path?: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: '主菜单',
    items: [
      { path: '/', label: '仪表盘', icon: <LayoutDashboard size={18} /> },
      { path: '/tasks', label: '我的工作', icon: <ListTodo size={18} /> },
      { path: '/daily', label: '我的日常', icon: <Coffee size={18} /> },
    ],
  },
  {
    title: '项目管理',
    items: [
      { path: '/projects', label: '项目总览', icon: <FolderKanban size={18} /> },
      { path: '/bidding', label: '投标管理', icon: <Target size={18} /> },
    ],
  },
  {
    title: '企业管理',
    items: [
      { path: '/hr', label: '人事管理', icon: <Users size={18} /> },
      { path: '/finance', label: '财务管理', icon: <CircleDollarSign size={18} /> },
      { path: '/legal', label: '法务管理', icon: <Scale size={18} /> },
      { path: '/audit', label: '审计管理', icon: <ShieldCheck size={18} /> },
      { path: '/supervision', label: '监理管理', icon: <HardHat size={18} /> },
    ],
  },
  {
    title: '知识与分析',
    items: [
      { path: '/knowledge', label: '知识库', icon: <BookOpen size={18} /> },
      { path: '/analytics', label: '经营分析', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'AI 助手',
    items: [
      { path: '/agents', label: 'Agent中心', icon: <Bot size={18} /> },
      { path: '/chat', label: 'AI小助理', icon: <Sparkles size={18} /> },
    ],
  },
];

// Flat list for page title mapping
const ALL_NAV: { path: string; label: string }[] = MENU_SECTIONS.flatMap((s) =>
  s.items.filter((i) => i.path).map((i) => ({ path: i.path!, label: i.label }))
);

// ---------------------------------------------------------------------------
// Sidebar Nav Item
// ---------------------------------------------------------------------------

const SideNavItem: React.FC<{ item: MenuItem; collapsed?: boolean }> = ({ item, collapsed }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (item.children) {
    const isChildActive = item.children.some((c) => c.path && location.pathname.startsWith(c.path));
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            isChildActive ? 'text-primary font-semibold bg-primary-50' : 'text-light-text hover:bg-[#F4F6FC]'
          }`}
        >
          <span className="shrink-0 opacity-70">{item.icon}</span>
          {!collapsed && <><span className="flex-1 text-left">{item.label}</span><ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} /></>}
        </button>
        {open && !collapsed && (
          <div className="ml-7 mt-0.5 flex flex-col gap-0.5">
            {item.children.map((c) => c.path && <SideNavItem key={c.path} item={c} />)}
          </div>
        )}
      </div>
    );
  }

  if (!item.path) return null;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-[9px] text-[15px] font-medium transition-all duration-150 rounded-lg mx-2 ${
          isActive
            ? 'bg-primary-tint text-primary'
            : 'text-light-text hover:bg-[#F4F6FC]'
        }`
      }
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
};

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 pt-4 pb-1.5">
    <span className="text-[12px] font-medium uppercase tracking-wider text-light-text-secondary">{title}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Main Layout
// ---------------------------------------------------------------------------

export const AppLayout: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const logoSrc = '/avocado_logo.png';

  useEffect(() => { if (projects.length === 0) fetchProjects() }, []);

  useEffect(() => {
    if (!isNotificationOpen) return;
    const h = (e: MouseEvent) => { if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setIsNotificationOpen(false) };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isNotificationOpen]);

  const getPageTitle = () => {
    const pm = location.pathname.match(/^\/projects\/(.+)/);
    if (pm) { const p = projects.find((pr) => pr.id === pm[1]); return p ? p.name : '项目详情'; }
    const item = ALL_NAV.find((n) => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path));
    return item?.label ?? '牛油果CoWork';
  };

  const SIDEBAR_W = sidebarCollapsed ? 'w-[70px]' : 'w-[260px]';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">

      {/* ============================================================== */}
      {/* Sidebar — Fila-style white sidebar                             */}
      {/* ============================================================== */}
      <aside className={`${SIDEBAR_W} flex flex-col bg-white border-r border-[#E8ECF4] shrink-0 transition-all duration-200 z-40`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 p-[25px] h-[82px] border-b border-[#E8ECF4] shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-light-text">Avocado</span>
              <span className="text-xs text-light-text-secondary -mt-0.5">CoWork Platform</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5" style={{ scrollbarWidth: 'thin' }}>
          {MENU_SECTIONS.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && <SectionHeader title={section.title} />}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <SideNavItem key={item.label} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          ))}

          {/* Project boards — show when not collapsed */}
          {!sidebarCollapsed && projects.length > 0 && (
            <div>
              <SectionHeader title="项目看板" />
              <div className="flex flex-col gap-0.5">
                {projects.slice(0, 6).map((p) => {
                  const c = p.status === 'active' ? '#00C875' : p.status === 'risk' ? '#E53935' : p.status === 'completed' ? '#6C7688' : '#2F80ED';
                  return (
                    <NavLink
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-primary-50 text-primary font-medium' : 'text-light-text hover:bg-[#F4F6FC]'
                        }`
                      }
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                      <span className="truncate">{p.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#E8ECF4] p-2.5 shrink-0">
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-white' : 'text-light-text hover:bg-[#F4F6FC]'}`}>
            <Settings size={18} />{!sidebarCollapsed && <span>设置</span>}
          </NavLink>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* Main area                                                       */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ============================================================ */}
        {/* Header — Fila-style top bar                                  */}
        {/* ============================================================ */}
        <header className="flex items-center justify-between h-[68px] px-6 bg-white border-b border-white shrink-0 z-30">
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-[#F4F6FC] text-light-text transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-[18px] font-medium text-light-text">{getPageTitle()}</h1>
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFF3F9] border-none h-[42px] text-sm text-light-text-secondary w-56">
              <Search size={14} />
              <span>搜索...</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-xs rounded bg-white border border-[#E8ECF4] text-light-text-secondary">/</kbd>
            </div>

            {/* AI assistant */}
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-light-text hover:bg-[#F4F6FC]'
                }`
              }
              title="AI小助理"
            >
              <Bot size={18} />
            </NavLink>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  isNotificationOpen ? 'bg-primary text-white' : 'text-light-text hover:bg-[#F4F6FC]'
                }`}
                onClick={() => setIsNotificationOpen((p) => !p)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-[#E8ECF4] cursor-pointer">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f8fafc"
                alt="用户"
                className="w-8 h-8 rounded-full border-2 border-primary/20"
              />
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-medium text-light-text">用户</span>
                <span className="text-xs text-light-text-secondary -mt-0.5">管理员</span>
              </div>
              <ChevronDown size={14} className="text-light-text-secondary hidden lg:block" />
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* Content area                                                  */}
        {/* ============================================================ */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <NotificationToast />
    </div>
  );
};
