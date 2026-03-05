import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useContentWidth } from '@/hooks/useContentWidth';
import { MenuIcon, ArrowsRightLeftIcon } from '@/components/icons';

const pageTitleMap: Record<string, string> = {
  '/': '대시보드',
  '/platform': '플랫폼 업무일지',
  '/work-board': '업무 보드',
  '/profile': '내 프로필',
  '/users': '사용자 관리',
  '/jira-secrets': 'Jira Secret 관리',
  '/slack-secrets': 'Slack Secret 관리',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = pageTitleMap[pathname] ?? 'Dev Blackbox';
  const { widthClass, widthLabel, cycleWidth } = useContentWidth();

  return (
    <div className="flex h-screen bg-surface-secondary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 shadow-xs lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="메뉴 열기"
            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-text-inverse">
            DB
          </div>
          <span className="flex-1 text-sm font-bold text-text-primary">{pageTitle}</span>
          {user && <span className="text-xs text-text-secondary">{user.name}</span>}
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-gutter:stable] md:px-4 md:py-3 lg:px-5 lg:py-4">
          <div className={`mx-auto h-full ${widthClass} transition-[max-width] duration-300 animate-fade-in`}>
            {/* 너비 토글 버튼 — 데스크톱 전용 */}
            <div className="mb-1 hidden justify-end lg:flex">
              <button
                onClick={cycleWidth}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary"
                title={`콘텐츠 너비: ${widthLabel}`}
              >
                <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                <span>{widthLabel}</span>
              </button>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
