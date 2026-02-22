import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { ChartBarIcon, UsersIcon, ChevronDoubleLeftIcon } from '@/components/icons';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

const navItems: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: '업무일지', icon: <ChartBarIcon className="h-5 w-5" /> },
  { to: '/users', label: '사용자 관리', icon: <UsersIcon className="h-5 w-5" /> },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch { /* noop */ }
  }, [collapsed]);

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
        {navItems.map(({ to, label, icon }) => (
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
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden border-t border-border-primary p-3 md:block">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="flex w-full items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors"
        >
          <ChevronDoubleLeftIcon
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
}
