import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateSlackSecretAdminApiV1SlackSecretsPost,
  getGetSlackSecretsAdminApiV1SlackSecretsGetQueryKey,
} from '@/api/generated/admin-slack-secret-management/admin-slack-secret-management';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import Button from '@/components/common/Button';

interface SlackSecretFormProps {
  onClose: () => void;
}

export default function SlackSecretForm({ onClose }: SlackSecretFormProps) {
  const [name, setName] = useState('');
  const [botToken, setBotToken] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSecret = useCreateSlackSecretAdminApiV1SlackSecretsPost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSecret.mutate(
      { data: { name, bot_token: botToken } },
      {
        onSuccess: () => {
          toast('success', 'Slack Secret이 생성되었습니다');
          queryClient.invalidateQueries({ queryKey: getGetSlackSecretsAdminApiV1SlackSecretsGetQueryKey() });
          onClose();
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Slack Secret 생성에 실패했습니다');
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Slack Secret 생성"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            form="slack-secret-form"
            loading={createSecret.isPending}
            loadingText="생성 중..."
          >
            생성
          </Button>
        </>
      }
    >
      <form id="slack-secret-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="이름" htmlFor="secret-name">
          <Input
            id="secret-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Slack Workspace"
          />
        </FormField>

        <FormField label="Bot Token" htmlFor="secret-bot-token">
          <Input
            id="secret-bot-token"
            required
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="xoxb-..."
          />
        </FormField>
      </form>
    </Modal>
  );
}
