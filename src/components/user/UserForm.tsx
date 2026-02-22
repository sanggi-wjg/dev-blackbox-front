import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateUserUsersPost } from '@/api/generated/user/user';
import { getGetUsersUsersGetQueryKey } from '@/api/generated/user/user';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useToast } from '@/components/common/Toast';

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-bold text-gray-800">사용자 생성</h3>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="홍길동"
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            이메일
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="user@example.com"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            타임존
          </label>
          <SearchableSelect
            options={TIMEZONE_OPTIONS}
            value={timezone}
            onChange={setTimezone}
            placeholder="타임존을 선택하세요"
            searchPlaceholder="타임존 검색 (예: Seoul, Tokyo)"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createUser.isPending ? '생성 중...' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
}
