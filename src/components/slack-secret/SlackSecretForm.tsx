import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateSlackSecretAdminApiV1SlackSecretsPost,
  getGetSlackSecretsAdminApiV1SlackSecretsGetQueryKey,
} from '@/api/generated/admin-slack-secret-management/admin-slack-secret-management';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
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

  const rules = useMemo(
    () => ({
      name: validators.required('이름'),
      botToken: validators.required('Bot Token'),
    }),
    [],
  );
  const { errors, serverError, validate, validateField, setServerError } = useFormValidation(rules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ name, botToken })) return;
    createSecret.mutate(
      { data: { name, bot_token: botToken } },
      {
        onSuccess: () => {
          toast('success', 'Slack Secret이 생성되었습니다');
          queryClient.invalidateQueries({ queryKey: getGetSlackSecretsAdminApiV1SlackSecretsGetQueryKey() });
          onClose();
        },
        onError: (err) => {
          setServerError(err instanceof Error ? err.message : 'Slack Secret 생성에 실패했습니다');
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
          <Button type="submit" form="slack-secret-form" loading={createSecret.isPending} loadingText="생성 중...">
            생성
          </Button>
        </>
      }
    >
      <form id="slack-secret-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {serverError}
          </div>
        )}

        <FormField label="이름" htmlFor="secret-name" error={errors.name}>
          <Input
            id="secret-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validateField('name', name)}
            error={!!errors.name}
            placeholder="My Slack Workspace"
          />
        </FormField>

        <FormField label="Bot Token" htmlFor="secret-bot-token" error={errors.botToken}>
          <Input
            id="secret-bot-token"
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            onBlur={() => validateField('botToken', botToken)}
            error={!!errors.botToken}
            placeholder="xoxb-..."
          />
        </FormField>
      </form>
    </Modal>
  );
}
