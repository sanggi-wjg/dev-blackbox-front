import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { MenuIcon } from '@/components/icons';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

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
          <span className="flex-1 text-sm font-bold text-text-primary">Dev Blackbox</span>
          {user && (
            <span className="text-xs text-text-secondary">{user.name}</span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-gutter:stable] md:px-4 md:py-3 lg:px-5 lg:py-4">
          <div className="mx-auto max-w-screen-2xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
