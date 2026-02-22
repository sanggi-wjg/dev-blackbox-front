import { useState } from 'react';
import dayjs from 'dayjs';
import { useGetUsersUsersGet } from '@/api/generated/user/user';
import {
  useGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGet,
  useSyncWorkLogsWorkLogsUserIdManualSyncPost,
} from '@/api/generated/work-log/work-log';
import UserSelect from '@/components/user/UserSelect';
import SummaryDatePicker from '@/components/summary/SummaryDatePicker';
import SummaryCard from '@/components/summary/SummaryCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { SummaryCardSkeleton } from '@/components/common/Skeleton';
import { useToast } from '@/components/common/Toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ArrowPathIcon } from '@/components/icons';

export default function WorkLogPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [syncingDate, setSyncingDate] = useState<string | null>(null);
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

  const manualSync = useSyncWorkLogsWorkLogsUserIdManualSyncPost();

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
          <SummaryDatePicker date={targetDate} onChange={setTargetDate} />
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

      {/* Content */}
      {selectedUserId == null && (
        <EmptyState message="사용자를 선택해주세요" description="좌측 드롭다운에서 사용자를 선택하면 업무일지가 표시됩니다" />
      )}

      {selectedUserId != null && workLogsLoading && (
        <div className="flex flex-col gap-4">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      )}

      {workLogsError != null && <ErrorMessage error={workLogsError} />}

      {workLogs && workLogs.length === 0 && (
        <EmptyState message="해당 날짜에 요약 데이터가 없습니다" description="수동 수집 버튼을 눌러 데이터를 가져올 수 있습니다" />
      )}

      {workLogs && workLogs.length > 0 && (
        <div className="flex flex-col gap-4">
          {workLogs.map((s) => (
            <SummaryCard key={s.id} platform={s.platform} summary={s.summary} />
          ))}
        </div>
      )}
    </div>
  );
}
