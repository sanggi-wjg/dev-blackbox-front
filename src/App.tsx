import { Routes, Route } from 'react-router';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import WorkLogPage from '@/pages/WorkLogPage.tsx';
import UserListPage from '@/pages/UserListPage';
import UserDetailPage from '@/pages/UserDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<WorkLogPage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
