import type { UserResponseDto } from '@/api/generated/model';
import SearchableSelect from '@/components/common/SearchableSelect';

interface UserSelectProps {
  users: UserResponseDto[];
  selectedUserId: number | null;
  onChange: (userId: number) => void;
}

export default function UserSelect({ users, selectedUserId, onChange }: UserSelectProps) {
  const options = users.map((user) => ({
    value: String(user.id),
    label: user.name,
    description: user.email,
  }));

  return (
    <SearchableSelect
      options={options}
      value={selectedUserId != null ? String(selectedUserId) : ''}
      onChange={(val) => onChange(Number(val))}
      placeholder="사용자 선택"
      searchPlaceholder="이름 또는 이메일로 검색..."
    />
  );
}
