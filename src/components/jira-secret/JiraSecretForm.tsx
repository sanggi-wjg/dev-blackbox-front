import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateJiraSecretAdminApiV1JiraSecretsPost,
  getGetJiraSecretsAdminApiV1JiraSecretsGetQueryKey,
} from '@/api/generated/admin-jira-secret-management/admin-jira-secret-management';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import Button from '@/components/common/Button';

interface JiraSecretFormProps {
  onClose: () => void;
}

export default function JiraSecretForm({ onClose }: JiraSecretFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [apiToken, setApiToken] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSecret = useCreateJiraSecretAdminApiV1JiraSecretsPost();

  const rules = useMemo(
    () => ({
      name: validators.required('이름'),
      url: validators.url('Jira URL'),
      username: validators.email('사용자명'),
      apiToken: validators.required('API 토큰'),
    }),
    [],
  );
  const { errors, serverError, validate, validateField, setServerError } = useFormValidation(rules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ name, url, username, apiToken })) return;
    createSecret.mutate(
      { data: { name, url, username, api_token: apiToken } },
      {
        onSuccess: () => {
          toast('success', 'Jira Secret이 생성되었습니다');
          queryClient.invalidateQueries({ queryKey: getGetJiraSecretsAdminApiV1JiraSecretsGetQueryKey() });
          onClose();
        },
        onError: (err) => {
          setServerError(err instanceof Error ? err.message : 'Jira Secret 생성에 실패했습니다');
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Jira Secret 생성"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="jira-secret-form" loading={createSecret.isPending} loadingText="생성 중...">
            생성
          </Button>
        </>
      }
    >
      <form id="jira-secret-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="My Jira Cloud"
          />
        </FormField>

        <FormField label="Jira URL" htmlFor="secret-url" error={errors.url}>
          <Input
            id="secret-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => validateField('url', url)}
            error={!!errors.url}
            placeholder="https://your-domain.atlassian.net"
          />
        </FormField>

        <FormField label="사용자명 / 이메일" htmlFor="secret-username" error={errors.username}>
          <Input
            id="secret-username"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => validateField('username', username)}
            error={!!errors.username}
            placeholder="user@example.com"
          />
        </FormField>

        <FormField label="API 토큰" htmlFor="secret-token" error={errors.apiToken}>
          <Input
            id="secret-token"
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            onBlur={() => validateField('apiToken', apiToken)}
            error={!!errors.apiToken}
            placeholder="Jira API 토큰을 입력하세요"
          />
        </FormField>
      </form>
    </Modal>
  );
}
