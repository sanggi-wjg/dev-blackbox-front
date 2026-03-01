import { useState } from 'react';
import {
  useGetUsersAdminApiV1UsersGet,
  useDeleteUserAdminApiV1UsersUserIdDelete,
  getGetUsersAdminApiV1UsersGetQueryKey,
} from '@/api/generated/user-admin/user-admin';
import { useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { TableRowSkeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/Modal';
import { PlusIcon, XMarkIcon } from '@/components/icons';
import { useToast } from '@/components/common/Toast';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: users, isLoading, error } = useGetUsersAdminApiV1UsersGet();
  const deleteUser = useDeleteUserAdminApiV1UsersUserIdDelete();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(
      { userId: deleteTarget.id },
      {
        onSuccess: () => {
          toast('success', `${deleteTarget.name} 사용자가 삭제되었습니다`);
          queryClient.invalidateQueries({ queryKey: getGetUsersAdminApiV1UsersGetQueryKey() });
          setDeleteTarget(null);
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '사용자 삭제에 실패했습니다');
        },
      },
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">사용자 관리</h2>
          <p className="mt-1 text-sm text-text-secondary">등록된 사용자를 관리하고 새 사용자를 추가합니다</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<PlusIcon className="h-4 w-4" />}>
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
                  <tr key={user.id} className="transition-colors hover:bg-surface-hover">
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
                      <button
                        onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                        className="rounded p-1 text-text-tertiary hover:bg-danger-50 hover:text-danger-600 transition-colors"
                        title="사용자 삭제"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-border-primary bg-surface p-4 shadow-xs"
              >
                <UserAvatar name={user.name} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <p className="truncate text-sm text-text-secondary">{user.email}</p>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                  className="rounded p-1 text-text-tertiary hover:bg-danger-50 hover:text-danger-600 transition-colors"
                  title="사용자 삭제"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="사용자 삭제"
        message={`${deleteTarget?.name ?? ''} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        loading={deleteUser.isPending}
      />
    </div>
  );
}
