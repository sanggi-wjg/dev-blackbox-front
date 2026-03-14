import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateUserAdminApiV1UsersPost,
  getGetUsersAdminApiV1UsersGetQueryKey,
} from '@/api/generated/user-admin/user-admin';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import Button from '@/components/common/Button';

const TIMEZONE_OPTIONS = Intl.supportedValuesOf('timeZone').map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
  description: tz.split('/')[0],
}));

interface UserFormProps {
  onClose: () => void;
}

export default function UserForm({ onClose }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('Asia/Seoul');

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createUser = useCreateUserAdminApiV1UsersPost();

  const rules = useMemo(
    () => ({
      name: validators.required('이름'),
      email: validators.email('이메일'),
      password: validators.minLength('비밀번호', 4),
    }),
    [],
  );
  const { errors, serverError, validate, validateField, setServerError } = useFormValidation(rules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ name, email, password })) return;
    createUser.mutate(
      { data: { name, email, password, timezone } },
      {
        onSuccess: () => {
          toast('success', '사용자가 생성되었습니다');
          queryClient.invalidateQueries({ queryKey: getGetUsersAdminApiV1UsersGetQueryKey() });
          onClose();
        },
        onError: (err) => {
          setServerError(err instanceof Error ? err.message : '사용자 생성에 실패했습니다');
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="사용자 생성"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="user-form" loading={createUser.isPending} loadingText="생성 중...">
            생성
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {serverError}
          </div>
        )}

        <FormField label="이름" htmlFor="user-name" error={errors.name}>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validateField('name', name)}
            error={!!errors.name}
            placeholder="홍길동"
          />
        </FormField>

        <FormField label="이메일" htmlFor="user-email" error={errors.email}>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateField('email', email)}
            error={!!errors.email}
            placeholder="user@example.com"
          />
        </FormField>

        <FormField label="비밀번호" htmlFor="user-password" error={errors.password}>
          <Input
            id="user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => validateField('password', password)}
            error={!!errors.password}
            placeholder="비밀번호를 입력하세요"
          />
        </FormField>

        <FormField label="타임존">
          <SearchableSelect
            options={TIMEZONE_OPTIONS}
            value={timezone}
            onChange={setTimezone}
            placeholder="타임존을 선택하세요"
            searchPlaceholder="타임존 검색 (예: Seoul, Tokyo)"
          />
        </FormField>
      </form>
    </Modal>
  );
}
