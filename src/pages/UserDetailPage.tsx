import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetUserUsersUserIdGet,
  getGetUserUsersUserIdGetQueryKey,
} from '@/api/generated/user/user';
import {
  useCreateGithubSecretGithubSecretsPost,
  useDeleteGithubSecretByUserIdGithubSecretsUsersUserIdDelete,
} from '@/api/generated/github-secret/github-secret';
import {
  useGetJiraUsersJiraUsersGet,
  getGetJiraUsersJiraUsersGetQueryKey,
  useAssignJiraUserJiraUsersJiraUserIdUsersUserIdPatch,
  useUnassignJiraUserJiraUsersJiraUserIdUsersUserIdDelete,
} from '@/api/generated/jira-user/jira-user';
import {
  useGetSlackUsersSlackUsersGet,
  getGetSlackUsersSlackUsersGetQueryKey,
  useAssignSlackUserToUserSlackUsersSlackUserIdUsersUserIdPatch,
  useUnassignSlackUserFromUserSlackUsersSlackUserIdUsersUserIdDelete,
} from '@/api/generated/slack-user/slack-user';
import type { GitHubSecretResponseDto } from '@/api/generated/model';
import type { JiraUserResponseDto } from '@/api/generated/model';
import type { SlackUserResponseDto } from '@/api/generated/model';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useToast } from '@/components/common/Toast';

export default function UserDetailPage() {
  const { userId } = useParams();
  const numericUserId = Number(userId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useGetUserUsersUserIdGet(numericUserId);

  return (
    <div>
      <Link to="/users" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← 사용자 목록
      </Link>

      {isLoading && <LoadingSpinner message="사용자 정보 로딩 중..." />}
      {error != null && <ErrorMessage error={error} />}

      {user && (
        <>
          <h2 className="mb-6 text-2xl font-bold text-gray-800">{user.name}</h2>

          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">사용자 정보</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
              <dt className="text-gray-500">이메일</dt>
              <dd className="min-w-0 truncate text-gray-800">{user.email}</dd>
              <dt className="text-gray-500">타임존</dt>
              <dd className="min-w-0 truncate text-gray-800">{user.timezone}</dd>
              <dt className="text-gray-500">생성일</dt>
              <dd className="min-w-0 truncate text-gray-800">{new Date(user.created_at).toLocaleString('ko-KR')}</dd>
            </dl>
          </div>

          <GitHubSecretSection
            userId={numericUserId}
            secret={user.github_user_secret}
            queryClient={queryClient}
            toast={toast}
          />

          <JiraUserSection
            userId={numericUserId}
            jiraUser={user.jira_user}
            queryClient={queryClient}
            toast={toast}
          />

          <SlackUserSection
            userId={numericUserId}
            slackUser={user.slack_user}
            queryClient={queryClient}
            toast={toast}
          />
        </>
      )}
    </div>
  );
}

function GitHubSecretSection({
  userId,
  secret,
  queryClient,
  toast,
}: {
  userId: number;
  secret: GitHubSecretResponseDto | null;
  queryClient: ReturnType<typeof useQueryClient>;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [pat, setPat] = useState('');

  const createSecret = useCreateGithubSecretGithubSecretsPost();
  const deleteSecret = useDeleteGithubSecretByUserIdGithubSecretsUsersUserIdDelete();

  const invalidateUser = () => {
    queryClient.invalidateQueries({
      queryKey: getGetUserUsersUserIdGetQueryKey(userId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSecret.mutate(
      { data: { username, personal_access_token: pat, user_id: userId } },
      {
        onSuccess: () => {
          toast('success', 'GitHub PAT가 등록되었습니다');
          invalidateUser();
          setUsername('');
          setPat('');
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'PAT 등록에 실패했습니다');
        },
      },
    );
  };

  const handleDisconnect = () => {
    if (!confirm('GitHub 연동을 해제하시겠습니까?\nPAT 정보가 삭제됩니다.')) return;
    deleteSecret.mutate(
      { userId },
      {
        onSuccess: () => {
          toast('success', 'GitHub 연동이 해제되었습니다');
          invalidateUser();
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '연동 해제에 실패했습니다');
        },
      },
    );
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">GitHub 설정</h3>

      {secret && (
        <>
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm">
            <span className="font-medium text-green-700">등록 완료</span>
            <span className="ml-2 text-green-600">
              GitHub 사용자: <strong>{secret.username}</strong>
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={deleteSecret.isPending}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteSecret.isPending ? '해제 중...' : '연동 해제'}
          </button>
        </>
      )}

      {!secret && (
        <>
          <p className="mb-3 text-sm text-gray-500">GitHub PAT가 등록되지 않았습니다.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                GitHub 사용자명
              </label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="your-github-username"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Personal Access Token
              </label>
              <input
                required
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="ghp_..."
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={createSecret.isPending}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {createSecret.isPending ? '등록 중...' : 'PAT 등록'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function JiraUserSection({
  userId,
  jiraUser,
  queryClient,
  toast,
}: {
  userId: number;
  jiraUser: JiraUserResponseDto | null;
  queryClient: ReturnType<typeof useQueryClient>;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [selectedJiraUserId, setSelectedJiraUserId] = useState('');
  const [project, setProject] = useState('');

  const { data: jiraUsers } = useGetJiraUsersJiraUsersGet({
    query: { enabled: !jiraUser },
  });
  const assignJiraUser = useAssignJiraUserJiraUsersJiraUserIdUsersUserIdPatch();
  const unassignJiraUser = useUnassignJiraUserJiraUsersJiraUserIdUsersUserIdDelete();

  const refetchData = () =>
    Promise.all([
      queryClient.refetchQueries({
        queryKey: getGetUserUsersUserIdGetQueryKey(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetJiraUsersJiraUsersGetQueryKey(),
      }),
    ]);

  // 미연동(user_id가 null)인 Jira 사용자만 필터
  const availableJiraUsers = jiraUsers?.filter((j) => j.user_id == null) ?? [];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJiraUserId) return;
    assignJiraUser.mutate(
      {
        jiraUserId: Number(selectedJiraUserId),
        userId,
        data: { project },
      },
      {
        onSuccess: async () => {
          toast('success', 'Jira 계정이 연동되었습니다');
          await refetchData();
          setSelectedJiraUserId('');
          setProject('');
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Jira 연동에 실패했습니다');
        },
      },
    );
  };

  const handleUnassign = () => {
    if (!jiraUser) return;
    if (!confirm('Jira 연동을 해제하시겠습니까?')) return;
    unassignJiraUser.mutate(
      { jiraUserId: jiraUser.id, userId },
      {
        onSuccess: async () => {
          toast('success', 'Jira 연동이 해제되었습니다');
          await refetchData();
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Jira 연동 해제에 실패했습니다');
        },
      },
    );
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">Jira 연동</h3>

      {jiraUser ? (
        <>
          <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
            <dt className="text-gray-500">이름</dt>
            <dd className="min-w-0 truncate text-gray-800">{jiraUser.display_name}</dd>
            <dt className="text-gray-500">이메일</dt>
            <dd className="min-w-0 truncate text-gray-800">{jiraUser.email_address}</dd>
            <dt className="text-gray-500">프로젝트</dt>
            <dd className="min-w-0 truncate text-gray-800">{jiraUser.project ?? '-'}</dd>
            <dt className="text-gray-500">상태</dt>
            <dd className="min-w-0">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  jiraUser.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {jiraUser.active ? '활성' : '비활성'}
              </span>
            </dd>
            <dt className="text-gray-500">Account ID</dt>
            <dd className="min-w-0 truncate text-gray-800 font-mono text-xs">{jiraUser.account_id}</dd>
            <dt className="text-gray-500">연동일</dt>
            <dd className="min-w-0 truncate text-gray-800">{new Date(jiraUser.created_at).toLocaleString('ko-KR')}</dd>
          </dl>
          <button
            onClick={handleUnassign}
            disabled={unassignJiraUser.isPending}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {unassignJiraUser.isPending ? '해제 중...' : '연동 해제'}
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">Jira 계정이 연동되지 않았습니다.</p>
          {availableJiraUsers.length > 0 ? (
            <form onSubmit={handleAssign} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jira 사용자 선택
                </label>
                <SearchableSelect
                  options={availableJiraUsers.map((j) => ({
                    value: String(j.id),
                    label: j.display_name,
                    description: j.email_address,
                  }))}
                  value={selectedJiraUserId}
                  onChange={setSelectedJiraUserId}
                  placeholder="Jira 사용자를 선택하세요"
                  searchPlaceholder="이름 또는 이메일로 검색..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  프로젝트 키
                </label>
                <input
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="예: DEV, PROJ"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={assignJiraUser.isPending}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  {assignJiraUser.isPending ? '연동 중...' : 'Jira 연동'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">연동 가능한 Jira 사용자가 없습니다.</p>
          )}
        </>
      )}
    </div>
  );
}

function SlackUserSection({
  userId,
  slackUser,
  queryClient,
  toast,
}: {
  userId: number;
  slackUser: SlackUserResponseDto | null;
  queryClient: ReturnType<typeof useQueryClient>;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [selectedSlackUserId, setSelectedSlackUserId] = useState('');

  const { data: slackUsers } = useGetSlackUsersSlackUsersGet({
    query: { enabled: !slackUser },
  });
  const assignSlackUser = useAssignSlackUserToUserSlackUsersSlackUserIdUsersUserIdPatch();
  const unassignSlackUser = useUnassignSlackUserFromUserSlackUsersSlackUserIdUsersUserIdDelete();

  const refetchData = () =>
    Promise.all([
      queryClient.refetchQueries({
        queryKey: getGetUserUsersUserIdGetQueryKey(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetSlackUsersSlackUsersGetQueryKey(),
      }),
    ]);

  // 미연동(user_id가 null)인 Slack 사용자만 필터
  const availableSlackUsers = slackUsers?.filter((s) => s.user_id == null) ?? [];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlackUserId) return;
    assignSlackUser.mutate(
      {
        slackUserId: Number(selectedSlackUserId),
        userId,
      },
      {
        onSuccess: async () => {
          toast('success', 'Slack 계정이 연동되었습니다');
          await refetchData();
          setSelectedSlackUserId('');
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Slack 연동에 실패했습니다');
        },
      },
    );
  };

  const handleUnassign = () => {
    if (!slackUser) return;
    if (!confirm('Slack 연동을 해제하시겠습니까?')) return;
    unassignSlackUser.mutate(
      { slackUserId: slackUser.id, userId },
      {
        onSuccess: async () => {
          toast('success', 'Slack 연동이 해제되었습니다');
          await refetchData();
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : 'Slack 연동 해제에 실패했습니다');
        },
      },
    );
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">Slack 연동</h3>

      {slackUser ? (
        <>
          <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
            <dt className="text-gray-500">표시 이름</dt>
            <dd className="min-w-0 truncate text-gray-800">{slackUser.display_name}</dd>
            <dt className="text-gray-500">실명</dt>
            <dd className="min-w-0 truncate text-gray-800">{slackUser.real_name}</dd>
            <dt className="text-gray-500">이메일</dt>
            <dd className="min-w-0 truncate text-gray-800">{slackUser.email ?? '-'}</dd>
            <dt className="text-gray-500">Member ID</dt>
            <dd className="min-w-0 truncate text-gray-800 font-mono text-xs">{slackUser.member_id}</dd>
            <dt className="text-gray-500">연동일</dt>
            <dd className="min-w-0 truncate text-gray-800">{new Date(slackUser.created_at).toLocaleString('ko-KR')}</dd>
          </dl>
          <button
            onClick={handleUnassign}
            disabled={unassignSlackUser.isPending}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {unassignSlackUser.isPending ? '해제 중...' : '연동 해제'}
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">Slack 계정이 연동되지 않았습니다.</p>
          {availableSlackUsers.length > 0 ? (
            <form onSubmit={handleAssign} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slack 사용자 선택
                </label>
                <SearchableSelect
                  options={availableSlackUsers.map((s) => ({
                    value: String(s.id),
                    label: s.display_name || s.real_name,
                    description: s.email ?? s.member_id,
                  }))}
                  value={selectedSlackUserId}
                  onChange={setSelectedSlackUserId}
                  placeholder="Slack 사용자를 선택하세요"
                  searchPlaceholder="이름 또는 이메일로 검색..."
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={assignSlackUser.isPending}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  {assignSlackUser.isPending ? '연동 중...' : 'Slack 연동'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">연동 가능한 Slack 사용자가 없습니다.</p>
          )}
        </>
      )}
    </div>
  );
}

