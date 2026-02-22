import type { UserResponseDto } from '@/api/generated/model';

interface UserSelectProps {
  users: UserResponseDto[];
  selectedUserId: number | null;
  onChange: (userId: number) => void;
}

export default function UserSelect({ users, selectedUserId, onChange }: UserSelectProps) {
  return (
    <select
      value={selectedUserId ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    >
      <option value="" disabled>
        사용자 선택
      </option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
