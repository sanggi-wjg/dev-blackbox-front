import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateUserUsersPost } from '@/api/generated/user/user';
import { getGetUsersUsersGetQueryKey } from '@/api/generated/user/user';
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
  const [timezone, setTimezone] = useState('Asia/Seoul');

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createUser = useCreateUserUsersPost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { data: { name, email, timezone } },
      {
        onSuccess: () => {
          toast('success', '사용자가 생성되었습니다');
          queryClient.invalidateQueries({ queryKey: getGetUsersUsersGetQueryKey() });
          onClose();
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '사용자 생성에 실패했습니다');
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
          <Button
            type="submit"
            form="user-form"
            loading={createUser.isPending}
            loadingText="생성 중..."
          >
            생성
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="이름" htmlFor="user-name">
          <Input
            id="user-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
          />
        </FormField>

        <FormField label="이메일" htmlFor="user-email">
          <Input
            id="user-email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
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
