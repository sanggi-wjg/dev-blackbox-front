import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useGetUsersUsersGet } from '@/api/generated/user/user';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { TableRowSkeleton } from '@/components/common/Skeleton';
import { PlusIcon, ChevronRightIcon } from '@/components/icons';
import UserForm from '@/components/user/UserForm';

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
      {initial}
    </div>
  );
}

export default function UserListPage() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { data: users, isLoading, error } = useGetUsersUsersGet();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">사용자 관리</h2>
          <p className="mt-1 text-sm text-text-secondary">등록된 사용자를 관리하고 새 사용자를 추가합니다</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          사용자 생성
        </Button>
      </div>

      {error != null && <ErrorMessage error={error} />}

      {/* Loading skeleton */}
      {isLoading && (
        <Card padding="none">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-primary bg-surface-tertiary text-xs font-medium tracking-wide text-text-tertiary uppercase">
              <tr>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">타임존</th>
                <th className="px-4 py-3">생성일</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </Card>
      )}

      {/* Empty */}
      {users && users.length === 0 && (
        <EmptyState
          message="등록된 사용자가 없습니다"
          description="새 사용자를 생성하여 시작하세요"
          actionLabel="사용자 생성"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Data */}
      {users && users.length > 0 && (
        <>
          {/* Desktop table */}
          <Card padding="none" className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-primary bg-surface-tertiary text-xs font-medium tracking-wide text-text-tertiary uppercase">
                <tr>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">타임존</th>
                  <th className="px-4 py-3">생성일</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} />
                        <span className="font-medium text-text-primary">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                    <td className="px-4 py-3 text-text-secondary">{user.timezone}</td>
                    <td className="px-4 py-3 text-text-tertiary">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRightIcon className="h-4 w-4 text-text-tertiary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/users/${user.id}`}
                className="flex items-center gap-3 rounded-xl border border-border-primary bg-surface p-4 shadow-xs transition-shadow hover:shadow-sm active:bg-surface-hover"
              >
                <UserAvatar name={user.name} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <p className="truncate text-sm text-text-secondary">{user.email}</p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-tertiary" />
              </Link>
            ))}
          </div>
        </>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
