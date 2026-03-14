import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useGetUserMeApiV1UsersMeGet, getGetUserMeApiV1UsersMeGetQueryKey } from '@/api/generated/user/user';
import {
  useCreateGithubSecretApiV1GithubSecretsPost,
  useDeleteGithubSecretByUserIdApiV1GithubSecretsDelete,
} from '@/api/generated/github-secret/github-secret';
import {
  useGetJiraUsersApiV1JiraUsersGet,
  getGetJiraUsersApiV1JiraUsersGetQueryKey,
  useAssignJiraUserApiV1JiraUsersPatch,
  useUnassignJiraUserApiV1JiraUsersJiraUserIdDelete,
} from '@/api/generated/jira-user/jira-user';
import {
  useGetJiraSecretsApiV1JiraSecretsGet,
  getGetJiraSecretsApiV1JiraSecretsGetQueryKey,
} from '@/api/generated/jira-secret/jira-secret';
import {
  useGetSlackUsersApiV1SlackUsersGet,
  getGetSlackUsersApiV1SlackUsersGetQueryKey,
  useAssignSlackUserToUserApiV1SlackUsersPatch,
  useUnassignSlackUserFromUserApiV1SlackUsersSlackUserIdDelete,
} from '@/api/generated/slack-user/slack-user';
import {
  useGetSlackSecretsApiV1SlackSecretsGet,
  getGetSlackSecretsApiV1SlackSecretsGetQueryKey,
} from '@/api/generated/slack-secret/slack-secret';
import type { GitHubSecretResponseDto } from '@/api/generated/model';
import type { JiraUserResponseDto } from '@/api/generated/model';
import type { SlackUserResponseDto } from '@/api/generated/model';
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
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import { GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['github', 'jira', 'slack'];
  const rawTab = searchParams.get('tab');
  const activeTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'github';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const { data: user, isLoading, error } = useGetUserMeApiV1UsersMeGet();

  const invalidateUser = () => queryClient.invalidateQueries({ queryKey: getGetUserMeApiV1UsersMeGetQueryKey() });

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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">내 프로필</h2>
        <p className="mt-1 text-sm text-text-secondary">프로필 정보와 외부 서비스 연동을 관리합니다</p>
      </div>

      {isLoading && <LoadingSpinner message="프로필 정보 로딩 중..." />}
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
                  icon: undefined,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      {t.icon}
                      {t.label}
                      {t.id === 'github' && user.github_user_secret && (
                        <span className="h-2 w-2 rounded-full bg-success-500" />
                      )}
                      {t.id === 'jira' && user.jira_user && <span className="h-2 w-2 rounded-full bg-success-500" />}
                      {t.id === 'slack' && user.slack_user && <span className="h-2 w-2 rounded-full bg-success-500" />}
                    </span>
                  ),
                }))}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            <div className="p-5">
              <TabPanel active={activeTab === 'github'}>
                <GitHubTab secret={user.github_user_secret} invalidateUser={invalidateUser} toast={toast} />
              </TabPanel>
              <TabPanel active={activeTab === 'jira'}>
                <JiraTab
                  jiraUser={user.jira_user}
                  invalidateUser={invalidateUser}
                  queryClient={queryClient}
                  toast={toast}
                />
              </TabPanel>
              <TabPanel active={activeTab === 'slack'}>
                <SlackTab
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

function GitHubTab({
  secret,
  invalidateUser,
  toast,
}: {
  secret: GitHubSecretResponseDto | null;
  invalidateUser: () => void;
  toast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [pat, setPat] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const createSecret = useCreateGithubSecretApiV1GithubSecretsPost();
  const deleteSecret = useDeleteGithubSecretByUserIdApiV1GithubSecretsDelete();

  const rules = useMemo(
    () => ({
      username: validators.required('GitHub 사용자명'),
      pat: validators.required('Personal Access Token'),
    }),
    [],
  );
  const { errors, serverError, validate, validateField, setServerError } = useFormValidation(rules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ username, pat })) return;
    createSecret.mutate(
      { data: { username, personal_access_token: pat } },
      {
        onSuccess: () => {
          toast('success', 'GitHub PAT가 등록되었습니다');
          invalidateUser();
          setUsername('');
          setPat('');
        },
        onError: (err) => setServerError(err instanceof Error ? err.message : 'PAT 등록에 실패했습니다'),
      },
    );
  };

  const handleDisconnect = () => {
    deleteSecret.mutate(undefined, {
      onSuccess: () => {
        toast('success', 'GitHub 연동이 해제되었습니다');
        invalidateUser();
        setConfirmOpen(false);
      },
      onError: (err) => toast('error', err instanceof Error ? err.message : '연동 해제에 실패했습니다'),
    });
  };

  return (
    <>
      <IntegrationSection
        connected={!!secret}
        connectedContent={
          secret && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-tertiary">사용자명</dt>
              <dd className="text-text-primary">{secret.username}</dd>
              <dt className="text-text-tertiary">토큰</dt>
              <dd className="font-mono text-xs text-text-primary">
                {secret.personal_access_token.slice(0, 8)}
                {'••••••••'}
              </dd>
              <dt className="text-text-tertiary">상태</dt>
              <dd>
                <Badge variant="success">연결됨</Badge>
              </dd>
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
          <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
            {serverError && (
              <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-600">
                {serverError}
              </div>
            )}
            <FormField label="GitHub 사용자명" error={errors.username}>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => validateField('username', username)}
                error={!!errors.username}
                placeholder="your-github-username"
              />
            </FormField>
            <FormField label="Personal Access Token" error={errors.pat}>
              <Input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                onBlur={() => validateField('pat', pat)}
                error={!!errors.pat}
                placeholder="ghp_..."
              />
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

function JiraTab({
  jiraUser,
  invalidateUser,
  queryClient,
  toast,
}: {
  jiraUser: JiraUserResponseDto | null;
  invalidateUser: () => void;
  queryClient: QueryClient;
  toast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}) {
  const [selectedSecretId, setSelectedSecretId] = useState('');
  const [selectedJiraUserId, setSelectedJiraUserId] = useState('');
  const [project, setProject] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: jiraSecrets } = useGetJiraSecretsApiV1JiraSecretsGet({ query: { enabled: !jiraUser } });
  const { data: jiraUsers } = useGetJiraUsersApiV1JiraUsersGet(
    { jira_secret_id: Number(selectedSecretId) },
    { query: { enabled: !jiraUser && !!selectedSecretId } },
  );
  const assignJiraUser = useAssignJiraUserApiV1JiraUsersPatch();
  const unassignJiraUser = useUnassignJiraUserApiV1JiraUsersJiraUserIdDelete();

  const availableJiraUsers = jiraUsers?.filter((j) => j.user_id == null) ?? [];

  const handleSecretChange = (value: string) => {
    setSelectedSecretId(value);
    setSelectedJiraUserId('');
  };

  const refetchData = () =>
    Promise.all([
      invalidateUser(),
      queryClient.invalidateQueries({ queryKey: getGetJiraSecretsApiV1JiraSecretsGetQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetJiraUsersApiV1JiraUsersGetQueryKey() }),
    ]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJiraUserId) return;
    assignJiraUser.mutate(
      { data: { jira_secret_id: Number(selectedSecretId), jira_user_id: Number(selectedJiraUserId), project } },
      {
        onSuccess: async () => {
          toast('success', 'Jira 계정이 연동되었습니다');
          await refetchData();
          setSelectedSecretId('');
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
      { jiraUserId: jiraUser.id },
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

  const connectFormContent = () => {
    if (!jiraSecrets || jiraSecrets.length === 0) {
      return <p className="text-sm text-text-tertiary">등록된 Jira Secret이 없습니다.</p>;
    }

    return (
      <form onSubmit={handleAssign} className="flex max-w-sm flex-col gap-4">
        <FormField label="Jira 워크스페이스 선택">
          <SearchableSelect
            options={jiraSecrets.map((s) => ({
              value: String(s.id),
              label: s.name,
              description: s.url,
            }))}
            value={selectedSecretId}
            onChange={handleSecretChange}
            placeholder="워크스페이스를 선택하세요"
            searchPlaceholder="이름 또는 URL로 검색..."
          />
        </FormField>
        {selectedSecretId && (
          <>
            <FormField label="Jira 사용자 선택">
              {availableJiraUsers.length > 0 ? (
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
              ) : (
                <p className="text-sm text-text-tertiary">연동 가능한 Jira 사용자가 없습니다.</p>
              )}
            </FormField>
            {availableJiraUsers.length > 0 && (
              <>
                <FormField label="프로젝트 키">
                  <Input
                    required
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="예: DEV, PROJ"
                  />
                </FormField>
                <div>
                  <Button type="submit" loading={assignJiraUser.isPending} loadingText="연동 중...">
                    Jira 연동
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </form>
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
                <Badge variant={jiraUser.is_active ? 'success' : 'default'}>
                  {jiraUser.is_active ? '활성' : '비활성'}
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
        connectForm={connectFormContent()}
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

function SlackTab({
  slackUser,
  invalidateUser,
  queryClient,
  toast,
}: {
  slackUser: SlackUserResponseDto | null;
  invalidateUser: () => void;
  queryClient: QueryClient;
  toast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}) {
  const [selectedSecretId, setSelectedSecretId] = useState('');
  const [selectedSlackUserId, setSelectedSlackUserId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: slackSecrets } = useGetSlackSecretsApiV1SlackSecretsGet({ query: { enabled: !slackUser } });
  const { data: slackUsers } = useGetSlackUsersApiV1SlackUsersGet(
    { slack_secret_id: Number(selectedSecretId) },
    { query: { enabled: !slackUser && !!selectedSecretId } },
  );
  const assignSlackUser = useAssignSlackUserToUserApiV1SlackUsersPatch();
  const unassignSlackUser = useUnassignSlackUserFromUserApiV1SlackUsersSlackUserIdDelete();

  const availableSlackUsers = slackUsers?.filter((s) => s.user_id == null) ?? [];

  const handleSecretChange = (value: string) => {
    setSelectedSecretId(value);
    setSelectedSlackUserId('');
  };

  const refetchData = () =>
    Promise.all([
      invalidateUser(),
      queryClient.invalidateQueries({ queryKey: getGetSlackSecretsApiV1SlackSecretsGetQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetSlackUsersApiV1SlackUsersGetQueryKey() }),
    ]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlackUserId) return;
    assignSlackUser.mutate(
      { data: { slack_secret_id: Number(selectedSecretId), slack_user_id: Number(selectedSlackUserId) } },
      {
        onSuccess: async () => {
          toast('success', 'Slack 계정이 연동되었습니다');
          await refetchData();
          setSelectedSecretId('');
          setSelectedSlackUserId('');
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : 'Slack 연동에 실패했습니다'),
      },
    );
  };

  const handleUnassign = () => {
    if (!slackUser) return;
    unassignSlackUser.mutate(
      { slackUserId: slackUser.id },
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

  const connectFormContent = () => {
    if (!slackSecrets || slackSecrets.length === 0) {
      return <p className="text-sm text-text-tertiary">등록된 Slack Secret이 없습니다.</p>;
    }

    return (
      <form onSubmit={handleAssign} className="flex max-w-sm flex-col gap-4">
        <FormField label="Slack 워크스페이스 선택">
          <SearchableSelect
            options={slackSecrets.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
            value={selectedSecretId}
            onChange={handleSecretChange}
            placeholder="워크스페이스를 선택하세요"
            searchPlaceholder="이름으로 검색..."
          />
        </FormField>
        {selectedSecretId && (
          <>
            <FormField label="Slack 사용자 선택">
              {availableSlackUsers.length > 0 ? (
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
              ) : (
                <p className="text-sm text-text-tertiary">연동 가능한 Slack 사용자가 없습니다.</p>
              )}
            </FormField>
            {availableSlackUsers.length > 0 && (
              <div>
                <Button type="submit" loading={assignSlackUser.isPending} loadingText="연동 중...">
                  Slack 연동
                </Button>
              </div>
            )}
          </>
        )}
      </form>
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
              <dt className="text-text-tertiary">상태</dt>
              <dd>
                <Badge variant={slackUser.is_active ? 'success' : 'default'}>
                  {slackUser.is_active ? '활성' : '비활성'}
                </Badge>
              </dd>
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
        connectForm={connectFormContent()}
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
