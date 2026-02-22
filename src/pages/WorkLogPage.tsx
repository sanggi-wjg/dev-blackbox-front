import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { useGetUsersUsersGet } from '@/api/generated/user/user';
import {
  useGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGet,
  useGetUserContentWorkLogsUsersUserIdUserContentGet,
  useCreateOrUpdateUserContentWorkLogsUsersUserIdUserContentPut,
  useSyncWorkLogsWorkLogsUserIdManualSyncPost,
} from '@/api/generated/work-log/work-log';
import UserSelect from '@/components/user/UserSelect';
import WorkLogDatePicker from '@/components/worklog/WorkLogDatePicker';
import WorkLogCard from '@/components/worklog/WorkLogCard';
import ManualWorkLogEditor from '@/components/worklog/ManualWorkLogEditor';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { WorkLogCardSkeleton } from '@/components/common/Skeleton';
import { useToast } from '@/components/common/Toast';
import Card from '@/components/common/Card';
import Tabs, { TabPanel } from '@/components/common/Tabs';
import Button from '@/components/common/Button';
import { ArrowPathIcon, PencilSquareIcon, ChartBarIcon } from '@/components/icons';

export default function WorkLogPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [syncingDate, setSyncingDate] = useState<string | null>(null);
  const [manualContent, setManualContent] = useState('');
  const [mobileTab, setMobileTab] = useState('platform');
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading, error: usersError } = useGetUsersUsersGet();

  const {
    data: workLogs,
    isLoading: workLogsLoading,
    error: workLogsError,
  } = useGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGet(
    selectedUserId!,
    { target_date: targetDate },
    { query: { enabled: selectedUserId != null } },
  );

  const {
    data: userContent,
  } = useGetUserContentWorkLogsUsersUserIdUserContentGet(
    selectedUserId!,
    { target_date: targetDate },
    { query: { enabled: selectedUserId != null } },
  );

  const saveUserContent = useCreateOrUpdateUserContentWorkLogsUsersUserIdUserContentPut();
  const manualSync = useSyncWorkLogsWorkLogsUserIdManualSyncPost();

  // 서버에서 직접 작성 내용 로드
  useEffect(() => {
    if (selectedUserId == null) {
      setManualContent('');
      return;
    }
    setManualContent(userContent?.content ?? '');
  }, [selectedUserId, userContent]);

  const handleSaveManual = useCallback(() => {
    if (selectedUserId == null) return;
    saveUserContent.mutate(
      {
        userId: selectedUserId,
        data: { target_date: targetDate, content: manualContent },
      },
      {
        onSuccess: () => {
          toast('success', '저장되었습니다');
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '저장에 실패했습니다');
        },
      },
    );
  }, [selectedUserId, targetDate, manualContent, toast, saveUserContent]);

  const handleCollect = () => {
    if (selectedUserId == null) return;
    setSyncingDate(targetDate);
    manualSync.mutate(
      {
        userId: selectedUserId,
        data: { target_date: targetDate },
      },
      {
        onSuccess: (data) => {
          toast('success', data.message);
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '수집에 실패했습니다');
          setSyncingDate(null);
        },
      },
    );
  };

  const showCollectButton =
    selectedUserId != null &&
    !workLogsLoading &&
    ((workLogs != null && workLogs.length === 0) || syncingDate === targetDate);

  // 플랫폼 요약 컨텐츠
  const platformContent = (
    <>
      {selectedUserId == null && (
        <EmptyState message="사용자를 선택해주세요" description="좌측 드롭다운에서 사용자를 선택하면 업무일지가 표시됩니다" />
      )}

      {selectedUserId != null && workLogsLoading && (
        <div className="flex flex-col gap-4">
          <WorkLogCardSkeleton />
          <WorkLogCardSkeleton />
        </div>
      )}

      {workLogsError != null && <ErrorMessage error={workLogsError} />}

      {workLogs && workLogs.length === 0 && (
        <EmptyState message="해당 날짜에 요약 데이터가 없습니다" description="수동 수집 버튼을 눌러 데이터를 가져올 수 있습니다" />
      )}

      {workLogs && workLogs.length > 0 && (
        <div className="flex flex-col gap-4">
          {workLogs.map((s) => (
            <WorkLogCard key={s.id} platform={s.platform} content={s.content} />
          ))}
        </div>
      )}
    </>
  );

  const mobileTabs = [
    { id: 'platform', label: '플랫폼 요약', icon: <ChartBarIcon className="h-4 w-4" /> },
    { id: 'manual', label: '직접 작성', icon: <PencilSquareIcon className="h-4 w-4" /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">업무일지</h2>
        <p className="mt-1 text-sm text-text-secondary">플랫폼별 일일 업무 요약을 확인합니다</p>
      </div>

      {/* Control bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {usersLoading && (
            <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-tertiary" />
          )}
          {usersError != null && <ErrorMessage error={usersError} />}
          {users && (
            <UserSelect
              users={users}
              selectedUserId={selectedUserId}
              onChange={setSelectedUserId}
            />
          )}
          <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
          {showCollectButton && (
            <Button
              variant="primary"
              size="sm"
              disabled={syncingDate === targetDate}
              onClick={handleCollect}
              icon={
                <ArrowPathIcon
                  className={`h-4 w-4 ${syncingDate === targetDate ? 'animate-spin' : ''}`}
                />
              }
            >
              {syncingDate === targetDate ? '수집 중...' : '수동 수집'}
            </Button>
          )}
        </div>
      </Card>

      {/* Desktop: 2-column layout */}
      <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6">
        <div>{platformContent}</div>
        <div>
          {selectedUserId != null && (
            <ManualWorkLogEditor
              content={manualContent}
              onChange={setManualContent}
              onSave={handleSaveManual}
              saving={saveUserContent.isPending}
            />
          )}
        </div>
      </div>

      {/* Mobile: Tab layout */}
      <div className="lg:hidden">
        {selectedUserId != null && (
          <Tabs tabs={mobileTabs} activeTab={mobileTab} onChange={setMobileTab} />
        )}
        <TabPanel active={mobileTab === 'platform' || selectedUserId == null}>
          {platformContent}
        </TabPanel>
        <TabPanel active={mobileTab === 'manual' && selectedUserId != null}>
          <ManualWorkLogEditor
            content={manualContent}
            onChange={setManualContent}
            onSave={handleSaveManual}
            saving={saveUserContent.isPending}
          />
        </TabPanel>
      </div>
    </div>
  );
}
