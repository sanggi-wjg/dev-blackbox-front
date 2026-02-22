import { useState } from 'react';
import { Link } from 'react-router';
import { useGetUsersUsersGet } from '@/api/generated/user/user';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { TableRowSkeleton } from '@/components/common/Skeleton';
import UserForm from '@/components/user/UserForm';

export default function UserListPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: users, isLoading, error } = useGetUsersUsersGet();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">사용자 관리</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 사용자 생성
        </button>
      </div>

      {error != null && <ErrorMessage error={error} />}

      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">타임존</th>
                <th className="px-4 py-3">생성일</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      )}

      {users && users.length === 0 && (
        <EmptyState
          message="등록된 사용자가 없습니다"
          actionLabel="사용자 생성"
          onAction={() => setShowForm(true)}
        />
      )}

      {users && users.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">타임존</th>
                  <th className="px-4 py-3">생성일</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.timezone}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/users/${user.id}`} className="text-blue-600 hover:underline">
                        상세
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/users/${user.id}`}
                className="rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{user.name}</span>
                  <span className="text-xs text-gray-400">#{user.id}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{user.email}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
