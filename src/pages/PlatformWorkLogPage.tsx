import { useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  useGetPlatformWorkLogsApiV1WorkLogsPlatformsGet,
  useSyncWorkLogsApiV1WorkLogsManualSyncPost,
} from '@/api/generated/work-log/work-log';
import WorkLogDatePicker from '@/components/worklog/WorkLogDatePicker';
import WorkLogCard from '@/components/worklog/WorkLogCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { WorkLogCardSkeleton } from '@/components/common/Skeleton';
import { useToast } from '@/components/common/Toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ArrowPathIcon, ClipboardDocumentIcon } from '@/components/icons';

const POLL_INTERVAL = 30_000;

const PLATFORM_ORDER = ['GITHUB', 'JIRA', 'CONFLUENCE', 'SLACK'];

const platformLabelMap: Record<string, string> = {
  GITHUB: 'GitHub',
  JIRA: 'Jira',
  CONFLUENCE: 'Confluence',
  SLACK: 'Slack',
};

export default function PlatformWorkLogPage() {
  const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [syncingDate, setSyncingDate] = useState<string | null>(null);
  const { toast } = useToast();
  const prevCountRef = useRef<number | null>(null);

  // refetchInterval 콜백: 데이터가 늘었으면 폴링 중단, 아니면 계속
  const getRefetchInterval = useCallback(
    (query: { state: { data?: unknown[] } }) => {
      if (syncingDate !== targetDate) {
        prevCountRef.current = null;
        return false;
      }
      const currentCount = query.state.data?.length ?? 0;
      if (prevCountRef.current !== null && currentCount > prevCountRef.current) {
        toast('info', '새로운 요약 데이터가 도착했습니다');
        prevCountRef.current = currentCount;
        setSyncingDate(null);
        return false;
      }
      prevCountRef.current = currentCount;
      return POLL_INTERVAL;
    },
    [syncingDate, targetDate, toast],
  );

  const {
    data: workLogs,
    isLoading: workLogsLoading,
    error: workLogsError,
  } = useGetPlatformWorkLogsApiV1WorkLogsPlatformsGet(
    { target_date: targetDate },
    { query: { refetchInterval: syncingDate === targetDate ? getRefetchInterval : false } },
  );

  const manualSync = useSyncWorkLogsApiV1WorkLogsManualSyncPost();

  const handleCollect = () => {
    setSyncingDate(targetDate);
    manualSync.mutate(
      { data: { target_date: targetDate } },
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

  const handleCopySingle = (platform: string, content: string) => {
    const label = platformLabelMap[platform] ?? platform;
    navigator.clipboard.writeText(content).then(
      () => toast('success', `${label} 요약이 복사되었습니다`),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  const handleCopyAll = () => {
    if (!workLogs) return;
    const sections = workLogs.map((log) => {
      const label = platformLabelMap[log.platform] ?? log.platform;
      return `## ${label}\n\n${log.content}`;
    });
    const combined = `# 플랫폼 업무일지 (${targetDate})\n\n${sections.join('\n\n')}`;
    navigator.clipboard.writeText(combined).then(
      () => toast('success', '전체 요약이 복사되었습니다'),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  const sortedWorkLogs = workLogs
    ?.slice()
    .sort((a, b) => (PLATFORM_ORDER.indexOf(a.platform) ?? 99) - (PLATFORM_ORDER.indexOf(b.platform) ?? 99));
  const hasWorkLogs = sortedWorkLogs != null && sortedWorkLogs.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">플랫폼 업무일지</h2>
        <p className="mt-1 text-sm text-text-secondary">플랫폼별 일일 업무 요약을 확인합니다</p>
      </div>

      {/* Control bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={syncingDate === targetDate}
              onClick={handleCollect}
              icon={<ArrowPathIcon className={`h-4 w-4 ${syncingDate === targetDate ? 'animate-spin' : ''}`} />}
            >
              {syncingDate === targetDate ? '수집 중...' : '수동 수집'}
            </Button>
            {hasWorkLogs && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyAll}
                icon={<ClipboardDocumentIcon className="h-4 w-4" />}
              >
                전체 복사
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Work log cards */}
      {workLogsLoading && (
        <div className="flex flex-col gap-4">
          <WorkLogCardSkeleton />
          <WorkLogCardSkeleton />
        </div>
      )}

      {workLogsError != null && <ErrorMessage error={workLogsError} />}

      {sortedWorkLogs && sortedWorkLogs.length === 0 && (
        <EmptyState
          message="해당 날짜에 요약 데이터가 없습니다"
          description="수동 수집을 시작하여 플랫폼 데이터를 가져올 수 있습니다"
          actionLabel={syncingDate === targetDate ? '수집 중...' : '수동 수집'}
          onAction={syncingDate === targetDate ? undefined : handleCollect}
        />
      )}

      {sortedWorkLogs && sortedWorkLogs.length > 0 && (
        <div className="flex flex-col gap-4">
          {sortedWorkLogs.map((s) => (
            <WorkLogCard
              key={s.id}
              platform={s.platform}
              content={s.content}
              modelName={s.model_name}
              prompt={s.prompt}
              onCopy={() => handleCopySingle(s.platform, s.content)}
              githubEvents={s.github_events}
              jiraEvents={s.jira_events}
              slackMessages={s.slack_messages}
            />
          ))}
        </div>
      )}
    </div>
  );
}
