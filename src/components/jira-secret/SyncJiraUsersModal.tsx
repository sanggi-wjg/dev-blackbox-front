import { useState } from 'react';
import {
  useSyncJiraUsersAdminApiV1JiraSecretsJiraSecretIdSyncPost,
} from '@/api/generated/admin-jira-secret-management/admin-jira-secret-management';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import Button from '@/components/common/Button';

interface SyncJiraUsersModalProps {
  secretId: number;
  secretName: string;
  onClose: () => void;
}

export default function SyncJiraUsersModal({ secretId, secretName, onClose }: SyncJiraUsersModalProps) {
  const [project, setProject] = useState('');
  const { toast } = useToast();
  const syncUsers = useSyncJiraUsersAdminApiV1JiraSecretsJiraSecretIdSyncPost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    syncUsers.mutate(
      { jiraSecretId: secretId, data: { project } },
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
    <Modal
      open
      onClose={onClose}
      title={`Jira 사용자 동기화 — ${secretName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            form="sync-form"
            loading={syncUsers.isPending}
            loadingText="동기화 중..."
          >
            동기화
          </Button>
        </>
      }
    >
      <form id="sync-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="프로젝트 키" htmlFor="sync-project">
          <Input
            id="sync-project"
            required
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="예: PROJ, DEV"
          />
        </FormField>
      </form>
    </Modal>
  );
}
