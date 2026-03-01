import { useState } from 'react';
import {
  useGetSlackSecretsAdminApiV1SlackSecretsGet,
  useDeleteSlackSecretAdminApiV1SlackSecretsSlackSecretIdDelete,
  getGetSlackSecretsAdminApiV1SlackSecretsGetQueryKey,
} from '@/api/generated/admin-slack-secret-management/admin-slack-secret-management';
import { useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { TableRowSkeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/Modal';
import { PlusIcon, XMarkIcon, ArrowPathIcon } from '@/components/icons';
import { SlackIcon } from '@/components/icons';
import { useToast } from '@/components/common/Toast';
import SlackSecretForm from '@/components/slack-secret/SlackSecretForm';
import SyncSlackUsersModal from '@/components/slack-secret/SyncSlackUsersModal';

export default function SlackSecretListPage() {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [syncTarget, setSyncTarget] = useState<{ id: number; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: secrets, isLoading, error } = useGetSlackSecretsAdminApiV1SlackSecretsGet();
  const deleteSecret = useDeleteSlackSecretAdminApiV1SlackSecretsSlackSecretIdDelete();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSecret.mutate(
      { slackSecretId: deleteTarget.id },
      {
        onSuccess: () => {
          toast('success', `${deleteTarget.name} Slack Secret이 삭제되었습니다`);
          queryClient.invalidateQueries({ queryKey: getGetSlackSecretsAdminApiV1SlackSecretsGetQueryKey() });
          setDeleteTarget(null);
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Slack Secret 삭제에 실패했습니다');
        },
      },
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Slack Secret 관리</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Slack 연동 자격증명을 관리하고 워크스페이스 사용자를 동기화합니다
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<PlusIcon className="h-4 w-4" />}>
          Secret 생성
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
                <th className="px-4 py-3">생성일</th>
                <th className="w-24 px-4 py-3" />
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
      {secrets && secrets.length === 0 && (
        <EmptyState
          message="등록된 Slack Secret이 없습니다"
          description="새 Secret을 생성하여 Slack 연동을 시작하세요"
          actionLabel="Secret 생성"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Data */}
      {secrets && secrets.length > 0 && (
        <>
          {/* Desktop table */}
          <Card padding="none" className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-primary bg-surface-tertiary text-xs font-medium tracking-wide text-text-tertiary uppercase">
                <tr>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">생성일</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {secrets.map((secret) => (
                  <tr key={secret.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-platform-slack/10 text-platform-slack">
                          <SlackIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-text-primary">{secret.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-tertiary">
                      {new Date(secret.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSyncTarget({ id: secret.id, name: secret.name })}
                          className="rounded p-1 text-text-tertiary hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          title="Slack 사용자 동기화"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: secret.id, name: secret.name })}
                          className="rounded p-1 text-text-tertiary hover:bg-danger-50 hover:text-danger-600 transition-colors"
                          title="삭제"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {secrets.map((secret) => (
              <div key={secret.id} className="rounded-xl border border-border-primary bg-surface p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-platform-slack/10 text-platform-slack">
                      <SlackIcon className="h-4 w-4" />
                    </div>
                    <div className="font-medium text-text-primary">{secret.name}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSyncTarget({ id: secret.id, name: secret.name })}
                      className="rounded p-1 text-text-tertiary hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      title="Slack 사용자 동기화"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: secret.id, name: secret.name })}
                      className="rounded p-1 text-text-tertiary hover:bg-danger-50 hover:text-danger-600 transition-colors"
                      title="삭제"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-text-tertiary">
                  {new Date(secret.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && <SlackSecretForm onClose={() => setShowForm(false)} />}

      {syncTarget && (
        <SyncSlackUsersModal
          secretId={syncTarget.id}
          secretName={syncTarget.name}
          onClose={() => setSyncTarget(null)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Slack Secret 삭제"
        message={`${deleteTarget?.name ?? ''} Slack Secret을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        loading={deleteSecret.isPending}
      />
    </div>
  );
}
