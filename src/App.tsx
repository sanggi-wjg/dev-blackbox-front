import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import PlatformWorkLogPage from '@/pages/PlatformWorkLogPage';
import ManualWorkLogPage from '@/pages/ManualWorkLogPage';
import UserListPage from '@/pages/UserListPage';
import JiraSecretListPage from '@/pages/JiraSecretListPage';
import SlackSecretListPage from '@/pages/SlackSecretListPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/common/Toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-text-secondary">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return children;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin) {
      toast('error', '관리자 권한이 필요합니다');
    }
  }, [isAdmin, toast]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PlatformWorkLogPage />} />
          <Route path="manual" element={<ManualWorkLogPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="users"
            element={
              <AdminRoute>
                <UserListPage />
              </AdminRoute>
            }
          />
          <Route
            path="jira-secrets"
            element={
              <AdminRoute>
                <JiraSecretListPage />
              </AdminRoute>
            }
          />
          <Route
            path="slack-secrets"
            element={
              <AdminRoute>
                <SlackSecretListPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
