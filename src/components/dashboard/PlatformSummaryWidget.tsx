import { useGetPlatformWorkLogsApiV1PlatformWorkLogsGet } from '@/api/generated/work-log/work-log';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';
import { PLATFORM_LABELS } from '@/utils/platform';
import type { ReactNode } from 'react';

interface PlatformSummaryWidgetProps {
  targetDate: string;
}

const platformMeta: Record<string, { icon: ReactNode; color: string }> = {
  GITHUB: {
    icon: <GitHubIcon className="h-4 w-4" />,
    color: 'text-platform-github bg-platform-github/10',
  },
  JIRA: {
    icon: <JiraIcon className="h-4 w-4" />,
    color: 'text-platform-jira bg-platform-jira/10',
  },
  SLACK: {
    icon: <SlackIcon className="h-4 w-4" />,
    color: 'text-platform-slack bg-platform-slack/10',
  },
};

export default function PlatformSummaryWidget({ targetDate }: PlatformSummaryWidgetProps) {
  const {
    data: workLogs,
    isLoading,
    error,
  } = useGetPlatformWorkLogsApiV1PlatformWorkLogsGet({ target_date: targetDate });

  return (
    <Card padding="none">
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">플랫폼 요약</h3>
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="요약 로딩 중..." />
          </div>
        )}
        {error && <ErrorMessage error={error} />}
        {workLogs && workLogs.length === 0 && (
          <p className="py-6 text-center text-sm text-text-tertiary">요약 데이터가 없습니다</p>
        )}
        {workLogs && workLogs.length > 0 && (
          <div className="space-y-3">
            {workLogs.map((log) => {
              const meta = platformMeta[log.platform];
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta?.color ?? 'bg-surface-tertiary text-text-secondary'}`}
                  >
                    {meta?.icon ?? <span className="text-[10px] font-bold">{log.platform.charAt(0)}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text-primary">{PLATFORM_LABELS[log.platform] ?? log.platform}</p>
                    <p className="mt-0.5 text-xs text-text-tertiary line-clamp-2">
                      {log.content
                        .replace(/[#*`>-]/g, '')
                        .trim()
                        .slice(0, 100)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
