import { useState, useRef, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  useGetPlatformWorkLogsApiV1PlatformWorkLogsGet,
  useSyncWorkLogsApiV1PlatformWorkLogsSyncPost,
} from '@/api/generated/work-log/work-log';
import { useGetEventActivityHeatmapApiV1EventActivityHeatmapGet } from '@/api/generated/event-activity/event-activity';
import WorkLogDatePicker from '@/components/worklog/WorkLogDatePicker';
import WorkLogCard from '@/components/worklog/WorkLogCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { WorkLogCardSkeleton } from '@/components/common/Skeleton';
import { useToast } from '@/components/common/Toast';
import DailySummaryBar from '@/components/worklog/DailySummaryBar';
import TimelineView from '@/components/worklog/TimelineView';
import ActivityHeatmap, { WEEKS } from '@/components/worklog/ActivityHeatmap';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  Squares2X2Icon,
} from '@/components/icons';

type PlatformViewMode = 'card' | 'timeline';

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
  const [viewMode, setViewMode] = useState<PlatformViewMode>('card');
  const [heatmapExpanded, setHeatmapExpanded] = useState(true);
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
  } = useGetPlatformWorkLogsApiV1PlatformWorkLogsGet(
    { target_date: targetDate },
    { query: { refetchInterval: syncingDate === targetDate ? getRefetchInterval : false } },
  );

  const manualSync = useSyncWorkLogsApiV1PlatformWorkLogsSyncPost();

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

  // 목록 내용이 바뀔 때만 stagger 애니메이션을 재생하기 위한 key
  const workLogListKey = useMemo(
    () => sortedWorkLogs?.map((w) => w.id).join(',') ?? '',
    [sortedWorkLogs],
  );

  // 히트맵 API 호출 (어제 기준 14주)
  const heatmapParams = useMemo(() => {
    const yesterday = dayjs().subtract(1, 'day');
    const endOfWeek = yesterday.endOf('week');
    const start = endOfWeek.subtract(WEEKS, 'week').add(1, 'day');
    return { from_date: start.format('YYYY-MM-DD'), to_date: yesterday.format('YYYY-MM-DD') };
  }, []);
  const { data: heatmapData } = useGetEventActivityHeatmapApiV1EventActivityHeatmapGet(heatmapParams);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary tracking-tight">플랫폼 업무일지</h2>
        <p className="mt-0.5 text-sm text-text-secondary">플랫폼별 일일 업무 요약을 확인합니다</p>
      </div>

      {/* Control bar */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pb-4 md:-mx-4 md:px-4 lg:-mx-5 lg:px-5 bg-surface-secondary">
        <Card padding="sm">
          <div className="flex flex-wrap items-center gap-4">
            <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
            <div className="ml-auto flex items-center gap-2">
              {/* 뷰 모드 토글 */}
              {hasWorkLogs && (
                <div className="flex items-center rounded-lg border border-border-primary" role="group" aria-label="뷰 모드">
                  <button
                    onClick={() => setViewMode('card')}
                    aria-pressed={viewMode === 'card'}
                    className={`rounded-l-lg p-1.5 transition-colors ${viewMode === 'card' ? 'bg-brand-600 text-text-inverse' : 'text-text-secondary hover:bg-surface-hover'}`}
                    title="카드 뷰"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    aria-pressed={viewMode === 'timeline'}
                    className={`rounded-r-lg p-1.5 transition-colors ${viewMode === 'timeline' ? 'bg-brand-600 text-text-inverse' : 'text-text-secondary hover:bg-surface-hover'}`}
                    title="타임라인 뷰"
                  >
                    <ClockIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
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
      </div>

      {/* Activity heatmap card — 전체 + 플랫폼별 */}
      <div className="mb-4 rounded-xl border border-border-primary bg-surface shadow-xs">
        <button
          onClick={() => setHeatmapExpanded((prev) => !prev)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover rounded-xl"
        >
          <span className="text-xs font-medium text-text-secondary">활동 히트맵</span>
          <span className="ml-auto text-text-tertiary">
            {heatmapExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </span>
        </button>
        {heatmapExpanded && (
          <div className="border-t border-border-primary px-4 py-3 grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-medium text-text-tertiary">전체</p>
              <ActivityHeatmap
                contributions={heatmapData?.contributions ?? []}
                selectedDate={targetDate}
                onDateClick={setTargetDate}
                lastDate={heatmapParams.to_date}
                alwaysExpanded
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-medium text-text-tertiary">GitHub</p>
              <ActivityHeatmap
                contributions={heatmapData?.contributions ?? []}
                selectedDate={targetDate}
                onDateClick={setTargetDate}
                lastDate={heatmapParams.to_date}
                platform="GITHUB"
                alwaysExpanded
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-medium text-text-tertiary">Jira</p>
              <ActivityHeatmap
                contributions={heatmapData?.contributions ?? []}
                selectedDate={targetDate}
                onDateClick={setTargetDate}
                lastDate={heatmapParams.to_date}
                platform="JIRA"
                alwaysExpanded
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-medium text-text-tertiary">Slack</p>
              <ActivityHeatmap
                contributions={heatmapData?.contributions ?? []}
                selectedDate={targetDate}
                onDateClick={setTargetDate}
                lastDate={heatmapParams.to_date}
                platform="SLACK"
                alwaysExpanded
              />
            </div>
          </div>
        )}
      </div>

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
        <div key={workLogListKey}>
          <DailySummaryBar workLogs={sortedWorkLogs} />
          {viewMode === 'timeline' ? (
            <TimelineView workLogs={sortedWorkLogs} />
          ) : (
            <div className="flex flex-col gap-4">
              {sortedWorkLogs.map((s, index) => (
                <div key={s.id} className="animate-stagger-up" style={{ animationDelay: `${index * 80}ms` }}>
                  <WorkLogCard
                    platform={s.platform}
                    content={s.content}
                    modelName={s.model_name}
                    prompt={s.prompt}
                    onCopy={() => handleCopySingle(s.platform, s.content)}
                    githubEvents={s.github_events}
                    jiraEvents={s.jira_events}
                    slackMessages={s.slack_messages}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
