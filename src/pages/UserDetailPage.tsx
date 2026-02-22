import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import Badge from '@/components/common/Badge';
import Tabs, { TabPanel } from '@/components/common/Tabs';
import { ConfirmDialog } from '@/components/common/Modal';
import SearchableSelect from '@/components/common/SearchableSelect';
import IntegrationSection from '@/components/integration/IntegrationSection';
import { useToast } from '@/components/common/Toast';
import { ArrowLeftIcon, GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';

export default function UserDetailPage() {
  const { userId } = useParams();
  const numericUserId = Number(userId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('github');

  const { data: user, isLoading, error } = useGetUserUsersUserIdGet(numericUserId);

  const invalidateUser = () =>
    queryClient.invalidateQueries({ queryKey: getGetUserUsersUserIdGetQueryKey(numericUserId) });

  const tabs = [
    {
      id: 'github',
      label: 'GitHub',
      icon: <GitHubIcon className="h-4 w-4" />,
    },
    {
      id: 'jira',
      label: 'Jira',
      icon: <JiraIcon className="h-4 w-4" />,
    },
    {
      id: 'slack',
      label: 'Slack',
      icon: <SlackIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/users')}
        icon={<ArrowLeftIcon className="h-4 w-4" />}
        className="mb-4"
      >
        사용자 목록
      </Button>

      {isLoading && <LoadingSpinner message="사용자 정보 로딩 중..." />}
      {error != null && <ErrorMessage error={error} />}

      {user && (
        <>
          {/* User info card */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{user.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                  <span>{user.email}</span>
                  <span>{user.timezone}</span>
                  <span className="text-text-tertiary">
                    생성일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Integration tabs */}
          <Card padding="none">
            <div className="px-5 pt-3">
              <Tabs
                tabs={tabs.map((t) => ({
                  ...t,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      {t.label}
                      {t.id === 'github' && user.github_user_secret && (
                        <span className="h-2 w-2 rounded-full bg-success-500" />
                      )}
                      {t.id === 'jira' && user.jira_user && (
                        <span className="h-2 w-2 rounded-full bg-success-500" />
                      )}
                      {t.id === 'slack' && user.slack_user && (
                        <span className="h-2 w-2 rounded-full bg-success-500" />
                      )}
                    </span>
                  ) as unknown as string,
                }))}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            <div className="p-5">
              <TabPanel active={activeTab === 'github'}>
                <GitHubTab
                  userId={numericUserId}
                  secret={user.github_user_secret}
                  invalidateUser={invalidateUser}
                  toast={toast}
                />
              </TabPanel>
              <TabPanel active={activeTab === 'jira'}>
                <JiraTab
                  userId={numericUserId}
                  jiraUser={user.jira_user}
                  invalidateUser={invalidateUser}
                  queryClient={queryClient}
                  toast={toast}
                />
              </TabPanel>
              <TabPanel active={activeTab === 'slack'}>
                <SlackTab
                  userId={numericUserId}
                  slackUser={user.slack_user}
                  invalidateUser={invalidateUser}
                  queryClient={queryClient}
                  toast={toast}
                />
              </TabPanel>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ── GitHub Tab ── */

import type { GitHubSecretResponseDto } from '@/api/generated/model';

function GitHubTab({
  userId,
  secret,
  invalidateUser,
  toast,
}: {
  userId: number;
  secret: GitHubSecretResponseDto | null;
  invalidateUser: () => void;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [pat, setPat] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const createSecret = useCreateGithubSecretGithubSecretsPost();
  const deleteSecret = useDeleteGithubSecretByUserIdGithubSecretsUsersUserIdDelete();

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
        onError: (err) => toast('error', err instanceof Error ? err.message : 'PAT 등록에 실패했습니다'),
      },
    );
  };

  const handleDisconnect = () => {
    deleteSecret.mutate(
      { userId },
      {
        onSuccess: () => {
          toast('success', 'GitHub 연동이 해제되었습니다');
          invalidateUser();
          setConfirmOpen(false);
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : '연동 해제에 실패했습니다'),
      },
    );
  };

  return (
    <>
      <IntegrationSection
        connected={!!secret}
        connectedContent={
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="success">연결됨</Badge>
            <span className="text-text-secondary">
              GitHub 사용자: <strong className="text-text-primary">{secret?.username}</strong>
            </span>
          </div>
        }
        disconnectButton={
          <div>
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              연동 해제
            </Button>
          </div>
        }
        connectForm={
          <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
            <FormField label="GitHub 사용자명">
              <Input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your-github-username" />
            </FormField>
            <FormField label="Personal Access Token">
              <Input required type="password" value={pat} onChange={(e) => setPat(e.target.value)} placeholder="ghp_..." />
            </FormField>
            <div>
              <Button type="submit" loading={createSecret.isPending} loadingText="등록 중...">
                PAT 등록
              </Button>
            </div>
          </form>
        }
        emptyMessage="GitHub PAT가 등록되지 않았습니다."
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDisconnect}
        title="GitHub 연동 해제"
        message="GitHub 연동을 해제하시겠습니까? PAT 정보가 삭제됩니다."
        confirmLabel="연동 해제"
        loading={deleteSecret.isPending}
      />
    </>
  );
}

/* ── Jira Tab ── */

import type { JiraUserResponseDto } from '@/api/generated/model';
import type { QueryClient } from '@tanstack/react-query';

function JiraTab({
  userId,
  jiraUser,
  invalidateUser,
  queryClient,
  toast,
}: {
  userId: number;
  jiraUser: JiraUserResponseDto | null;
  invalidateUser: () => void;
  queryClient: QueryClient;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [selectedJiraUserId, setSelectedJiraUserId] = useState('');
  const [project, setProject] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: jiraUsers } = useGetJiraUsersJiraUsersGet({ query: { enabled: !jiraUser } });
  const assignJiraUser = useAssignJiraUserJiraUsersJiraUserIdUsersUserIdPatch();
  const unassignJiraUser = useUnassignJiraUserJiraUsersJiraUserIdUsersUserIdDelete();

  const availableJiraUsers = jiraUsers?.filter((j) => j.user_id == null) ?? [];

  const refetchData = () =>
    Promise.all([
      invalidateUser(),
      queryClient.invalidateQueries({ queryKey: getGetJiraUsersJiraUsersGetQueryKey() }),
    ]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJiraUserId) return;
    assignJiraUser.mutate(
      { jiraUserId: Number(selectedJiraUserId), userId, data: { project } },
      {
        onSuccess: async () => {
          toast('success', 'Jira 계정이 연동되었습니다');
          await refetchData();
          setSelectedJiraUserId('');
          setProject('');
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : 'Jira 연동에 실패했습니다'),
      },
    );
  };

  const handleUnassign = () => {
    if (!jiraUser) return;
    unassignJiraUser.mutate(
      { jiraUserId: jiraUser.id, userId },
      {
        onSuccess: async () => {
          toast('success', 'Jira 연동이 해제되었습니다');
          await refetchData();
          setConfirmOpen(false);
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : 'Jira 연동 해제에 실패했습니다'),
      },
    );
  };

  return (
    <>
      <IntegrationSection
        connected={!!jiraUser}
        connectedContent={
          jiraUser && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-tertiary">이름</dt>
              <dd className="text-text-primary">{jiraUser.display_name}</dd>
              <dt className="text-text-tertiary">이메일</dt>
              <dd className="text-text-primary">{jiraUser.email_address}</dd>
              <dt className="text-text-tertiary">프로젝트</dt>
              <dd className="text-text-primary">{jiraUser.project ?? '-'}</dd>
              <dt className="text-text-tertiary">상태</dt>
              <dd>
                <Badge variant={jiraUser.active ? 'success' : 'default'}>
                  {jiraUser.active ? '활성' : '비활성'}
                </Badge>
              </dd>
              <dt className="text-text-tertiary">Account ID</dt>
              <dd className="font-mono text-xs text-text-primary">{jiraUser.account_id}</dd>
            </dl>
          )
        }
        disconnectButton={
          <div>
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              연동 해제
            </Button>
          </div>
        }
        connectForm={
          availableJiraUsers.length > 0 ? (
            <form onSubmit={handleAssign} className="flex max-w-sm flex-col gap-4">
              <FormField label="Jira 사용자 선택">
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
              </FormField>
              <FormField label="프로젝트 키">
                <Input required value={project} onChange={(e) => setProject(e.target.value)} placeholder="예: DEV, PROJ" />
              </FormField>
              <div>
                <Button type="submit" loading={assignJiraUser.isPending} loadingText="연동 중...">
                  Jira 연동
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-text-tertiary">연동 가능한 Jira 사용자가 없습니다.</p>
          )
        }
        emptyMessage="Jira 계정이 연동되지 않았습니다."
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleUnassign}
        title="Jira 연동 해제"
        message="Jira 연동을 해제하시겠습니까?"
        confirmLabel="연동 해제"
        loading={unassignJiraUser.isPending}
      />
    </>
  );
}

/* ── Slack Tab ── */

import type { SlackUserResponseDto } from '@/api/generated/model';

function SlackTab({
  userId,
  slackUser,
  invalidateUser,
  queryClient,
  toast,
}: {
  userId: number;
  slackUser: SlackUserResponseDto | null;
  invalidateUser: () => void;
  queryClient: QueryClient;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}) {
  const [selectedSlackUserId, setSelectedSlackUserId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: slackUsers } = useGetSlackUsersSlackUsersGet({ query: { enabled: !slackUser } });
  const assignSlackUser = useAssignSlackUserToUserSlackUsersSlackUserIdUsersUserIdPatch();
  const unassignSlackUser = useUnassignSlackUserFromUserSlackUsersSlackUserIdUsersUserIdDelete();

  const availableSlackUsers = slackUsers?.filter((s) => s.user_id == null) ?? [];

  const refetchData = () =>
    Promise.all([
      invalidateUser(),
      queryClient.invalidateQueries({ queryKey: getGetSlackUsersSlackUsersGetQueryKey() }),
    ]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlackUserId) return;
    assignSlackUser.mutate(
      { slackUserId: Number(selectedSlackUserId), userId },
      {
        onSuccess: async () => {
          toast('success', 'Slack 계정이 연동되었습니다');
          await refetchData();
          setSelectedSlackUserId('');
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : 'Slack 연동에 실패했습니다'),
      },
    );
  };

  const handleUnassign = () => {
    if (!slackUser) return;
    unassignSlackUser.mutate(
      { slackUserId: slackUser.id, userId },
      {
        onSuccess: async () => {
          toast('success', 'Slack 연동이 해제되었습니다');
          await refetchData();
          setConfirmOpen(false);
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : 'Slack 연동 해제에 실패했습니다'),
      },
    );
  };

  return (
    <>
      <IntegrationSection
        connected={!!slackUser}
        connectedContent={
          slackUser && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-tertiary">표시 이름</dt>
              <dd className="text-text-primary">{slackUser.display_name}</dd>
              <dt className="text-text-tertiary">실명</dt>
              <dd className="text-text-primary">{slackUser.real_name}</dd>
              <dt className="text-text-tertiary">이메일</dt>
              <dd className="text-text-primary">{slackUser.email ?? '-'}</dd>
              <dt className="text-text-tertiary">Member ID</dt>
              <dd className="font-mono text-xs text-text-primary">{slackUser.member_id}</dd>
            </dl>
          )
        }
        disconnectButton={
          <div>
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              연동 해제
            </Button>
          </div>
        }
        connectForm={
          availableSlackUsers.length > 0 ? (
            <form onSubmit={handleAssign} className="flex max-w-sm flex-col gap-4">
              <FormField label="Slack 사용자 선택">
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
              </FormField>
              <div>
                <Button type="submit" loading={assignSlackUser.isPending} loadingText="연동 중...">
                  Slack 연동
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-text-tertiary">연동 가능한 Slack 사용자가 없습니다.</p>
          )
        }
        emptyMessage="Slack 계정이 연동되지 않았습니다."
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleUnassign}
        title="Slack 연동 해제"
        message="Slack 연동을 해제하시겠습니까?"
        confirmLabel="연동 해제"
        loading={unassignSlackUser.isPending}
      />
    </>
  );
}
