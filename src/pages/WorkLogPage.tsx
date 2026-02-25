import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  useGetPlatformWorkLogsApiV1WorkLogsPlatformsGet,
  useGetUserContentApiV1WorkLogsUserContentGet,
  useCreateOrUpdateUserContentApiV1WorkLogsUserContentPut,
  useSyncWorkLogsApiV1WorkLogsManualSyncPost,
} from '@/api/generated/work-log/work-log';
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
import { ArrowPathIcon, PencilSquareIcon, ChartBarIcon, ClipboardDocumentIcon } from '@/components/icons';

const platformLabelMap: Record<string, string> = {
  GITHUB: 'GitHub',
  JIRA: 'Jira',
  CONFLUENCE: 'Confluence',
  SLACK: 'Slack',
};

export default function WorkLogPage() {
  const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [syncingDate, setSyncingDate] = useState<string | null>(null);
  const [manualContent, setManualContent] = useState('');
  const [mobileTab, setMobileTab] = useState('platform');
  const { toast } = useToast();

  const {
    data: workLogs,
    isLoading: workLogsLoading,
    error: workLogsError,
  } = useGetPlatformWorkLogsApiV1WorkLogsPlatformsGet({ target_date: targetDate });

  const {
    data: userContent,
  } = useGetUserContentApiV1WorkLogsUserContentGet({ target_date: targetDate });

  const saveUserContent = useCreateOrUpdateUserContentApiV1WorkLogsUserContentPut();
  const manualSync = useSyncWorkLogsApiV1WorkLogsManualSyncPost();

  // 날짜 변경 또는 서버 데이터 도착 시 manualContent를 동기화
  // targetDate도 함께 추적하여 같은 null → null 전환도 감지
  const [prevSync, setPrevSync] = useState({ userContent, targetDate });
  if (
    userContent !== undefined &&
    (prevSync.userContent !== userContent || prevSync.targetDate !== targetDate)
  ) {
    setPrevSync({ userContent, targetDate });
    setManualContent(userContent?.content ?? '');
  }

  const handleSaveManual = useCallback(() => {
    saveUserContent.mutate(
      {
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
  }, [targetDate, manualContent, toast, saveUserContent]);

  const handleCollect = () => {
    setSyncingDate(targetDate);
    manualSync.mutate(
      {
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

  const handleCopySingle = (platform: string, content: string) => {
    const label = platformLabelMap[platform] ?? platform;
    navigator.clipboard.writeText(content).then(
      () => toast('success', `${label} 요약이 복사되었습니다`),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  const handleCopyManual = () => {
    navigator.clipboard.writeText(manualContent).then(
      () => toast('success', '직접 작성 내용이 복사되었습니다'),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  const handleCopyAll = () => {
    const sections: string[] = [];

    if (workLogs) {
      for (const log of workLogs) {
        const label = platformLabelMap[log.platform] ?? log.platform;
        sections.push(`## ${label}\n\n${log.content}`);
      }
    }

    if (manualContent.trim()) {
      sections.push(`## 직접 작성\n\n${manualContent}`);
    }

    const combined = `# 업무일지 (${targetDate})\n\n${sections.join('\n\n')}`;
    navigator.clipboard.writeText(combined).then(
      () => toast('success', '전체 업무일지가 복사되었습니다'),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  const hasWorkLogs = workLogs != null && workLogs.length > 0;

  const platformContent = (
    <>
      {workLogsLoading && (
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
            <WorkLogCard
              key={s.id}
              platform={s.platform}
              content={s.content}
              modelName={s.model_name}
              prompt={s.prompt}
              onCopy={() => handleCopySingle(s.platform, s.content)}
            />
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
          <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
          <div className="ml-auto flex items-center gap-2">
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

      {/* Desktop: 2-column layout */}
      <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6">
        <div>{platformContent}</div>
        <div>
          <ManualWorkLogEditor
            content={manualContent}
            onChange={setManualContent}
            onSave={handleSaveManual}
            saving={saveUserContent.isPending}
            onCopy={manualContent.trim() ? handleCopyManual : undefined}
          />
        </div>
      </div>

      {/* Mobile: Tab layout */}
      <div className="lg:hidden">
        <Tabs tabs={mobileTabs} activeTab={mobileTab} onChange={setMobileTab} />
        <TabPanel active={mobileTab === 'platform'}>
          {platformContent}
        </TabPanel>
        <TabPanel active={mobileTab === 'manual'}>
          <ManualWorkLogEditor
            content={manualContent}
            onChange={setManualContent}
            onSave={handleSaveManual}
            saving={saveUserContent.isPending}
            onCopy={manualContent.trim() ? handleCopyManual : undefined}
          />
        </TabPanel>
      </div>
    </div>
  );
}
