import { useSyncSlackUsersAdminApiV1SlackSecretsSlackSecretIdSyncPost } from '@/api/generated/admin-slack-secret-management/admin-slack-secret-management';
import { useToast } from '@/components/common/Toast';
import { ConfirmDialog } from '@/components/common/Modal';

interface SyncSlackUsersModalProps {
  secretId: number;
  secretName: string;
  onClose: () => void;
}

export default function SyncSlackUsersModal({ secretId, secretName, onClose }: SyncSlackUsersModalProps) {
  const { toast } = useToast();
  const syncUsers = useSyncSlackUsersAdminApiV1SlackSecretsSlackSecretIdSyncPost();

  const handleConfirm = () => {
    syncUsers.mutate(
      { slackSecretId: secretId },
      {
        onSuccess: () => {
          toast('success', '동기화가 시작되었습니다');
          onClose();
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '동기화 요청에 실패했습니다');
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Slack 사용자 동기화 — ${secretName}`}
      message={`${secretName} 워크스페이스의 사용자를 동기화하시겠습니까?`}
      confirmLabel="동기화"
      loading={syncUsers.isPending}
    />
  );
}
