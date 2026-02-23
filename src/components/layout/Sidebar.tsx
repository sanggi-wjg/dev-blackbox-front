import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { ChartBarIcon, UsersIcon, UserCircleIcon, ArrowRightOnRectangleIcon, ChevronDoubleLeftIcon, SunIcon, MoonIcon, ShieldCheckIcon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      console.warn('[Sidebar] Failed to read collapse preference:', e);
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch (e) {
      console.warn('[Sidebar] Failed to save collapse preference:', e);
    }
  }, [collapsed]);

  const userNavItems: { to: string; label: string; icon: ReactNode }[] = [
    { to: '/', label: '업무일지', icon: <ChartBarIcon className="h-5 w-5" /> },
    { to: '/profile', label: '내 프로필', icon: <UserCircleIcon className="h-5 w-5" /> },
  ];

  const adminNavItems: { to: string; label: string; icon: ReactNode }[] = [
    { to: '/users', label: '사용자 관리', icon: <UsersIcon className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-border-primary bg-surface-secondary transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border-primary px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-text-inverse">
          DB
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-text-primary whitespace-nowrap">Dev Blackbox</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {userNavItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="shrink-0">{icon}</span>
                {!collapsed && <span>{label}</span>}
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-brand-600" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* 관리자 섹션 */}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-border-primary" />
            {!collapsed && (
              <span className="mb-1 px-3 text-xs font-semibold text-text-tertiary">관리</span>
            )}
            {adminNavItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="shrink-0">{icon}</span>
                    {!collapsed && <span>{label}</span>}
                    {isActive && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-brand-600" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-border-primary p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
              <p className="truncate text-xs text-text-tertiary">{user.email}</p>
            </div>
            {isAdmin && (
              <span title="관리자">
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-brand-600" />
              </span>
            )}
          </div>
        )}
        {collapsed && isAdmin && (
          <div className="mb-2 flex justify-center" title="관리자">
            <ShieldCheckIcon className="h-5 w-5 text-brand-600" />
          </div>
        )}
        <button
          onClick={toggleTheme}
          title={collapsed ? (isDark ? '라이트 모드로 전환' : '다크 모드로 전환') : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <span className="shrink-0">
            {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </span>
          {!collapsed && (
            <span className="flex items-center gap-2">
              {isDark ? '라이트 모드' : '다크 모드'}
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  isDark ? 'bg-brand-600' : 'bg-border-strong'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-text-inverse shadow-xs transition-transform ${
                    isDark ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </span>
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? '로그아웃' : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>로그아웃</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="hidden md:flex mt-1 w-full items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors"
        >
          <ChevronDoubleLeftIcon
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
}
