import { useState } from 'react';
import {
  useGetJiraSecretsAdminApiV1JiraSecretsGet,
  useDeleteJiraSecretAdminApiV1JiraSecretsJiraSecretIdDelete,
  getGetJiraSecretsAdminApiV1JiraSecretsGetQueryKey,
} from '@/api/generated/admin-jira-secret-management/admin-jira-secret-management';
import { useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { TableRowSkeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/Modal';
import { PlusIcon, XMarkIcon, ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@/components/icons';
import { useToast } from '@/components/common/Toast';
import JiraSecretForm from '@/components/jira-secret/JiraSecretForm';
import SyncJiraUsersModal from '@/components/jira-secret/SyncJiraUsersModal';

export default function JiraSecretListPage() {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [syncTarget, setSyncTarget] = useState<{ id: number; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: secrets, isLoading, error } = useGetJiraSecretsAdminApiV1JiraSecretsGet();
  const deleteSecret = useDeleteJiraSecretAdminApiV1JiraSecretsJiraSecretIdDelete();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSecret.mutate(
      { jiraSecretId: deleteTarget.id },
      {
        onSuccess: () => {
          toast('success', `${deleteTarget.name} Jira Secret이 삭제되었습니다`);
          queryClient.invalidateQueries({ queryKey: getGetJiraSecretsAdminApiV1JiraSecretsGetQueryKey() });
          setDeleteTarget(null);
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Jira Secret 삭제에 실패했습니다');
        },
      },
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Jira Secret 관리</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Jira 연동 자격증명을 관리하고 프로젝트 사용자를 동기화합니다
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
                <th className="px-4 py-3">URL</th>
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
          message="등록된 Jira Secret이 없습니다"
          description="새 Secret을 생성하여 Jira 연동을 시작하세요"
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
                  <th className="px-4 py-3">URL</th>
                  <th className="px-4 py-3">생성일</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {secrets.map((secret) => (
                  <tr key={secret.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-platform-jira/10 text-platform-jira">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 005.215 5.214h2.129v2.058a5.218 5.218 0 005.215 5.214V6.758a1.001 1.001 0 00-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 005.215 5.215h2.129v2.057A5.215 5.215 0 0024.013 12.5V1.005A1.005 1.005 0 0023.013 0z" />
                          </svg>
                        </div>
                        <span className="font-medium text-text-primary">{secret.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={secret.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-text-link hover:underline"
                      >
                        {secret.url}
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-text-tertiary">
                      {new Date(secret.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSyncTarget({ id: secret.id, name: secret.name })}
                          className="rounded p-1 text-text-tertiary hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          title="Jira 사용자 동기화"
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-platform-jira/10 text-platform-jira">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 005.215 5.214h2.129v2.058a5.218 5.218 0 005.215 5.214V6.758a1.001 1.001 0 00-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 005.215 5.215h2.129v2.057A5.215 5.215 0 0024.013 12.5V1.005A1.005 1.005 0 0023.013 0z" />
                      </svg>
                    </div>
                    <div className="font-medium text-text-primary">{secret.name}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSyncTarget({ id: secret.id, name: secret.name })}
                      className="rounded p-1 text-text-tertiary hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      title="Jira 사용자 동기화"
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
                <a
                  href={secret.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-text-link hover:underline"
                >
                  {secret.url}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
                <p className="mt-1 text-xs text-text-tertiary">
                  {new Date(secret.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && <JiraSecretForm onClose={() => setShowForm(false)} />}

      {syncTarget && (
        <SyncJiraUsersModal secretId={syncTarget.id} secretName={syncTarget.name} onClose={() => setSyncTarget(null)} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Jira Secret 삭제"
        message={`${deleteTarget?.name ?? ''} Jira Secret을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        loading={deleteSecret.isPending}
      />
    </div>
  );
}
