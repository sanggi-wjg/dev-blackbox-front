import { useGetPlatformWorkLogsApiV1PlatformWorkLogsGet } from '@/api/generated/work-log/work-log';
import { GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';
import type { ReactNode } from 'react';

interface PlatformSummaryWidgetProps {
  targetDate: string;
}

const platformMeta: Record<string, { label: string; icon: ReactNode; color: string }> = {
  GITHUB: {
    label: 'GitHub',
    icon: <GitHubIcon className="h-4 w-4" />,
    color: 'text-platform-github bg-platform-github/10',
  },
  JIRA: {
    label: 'Jira',
    icon: <JiraIcon className="h-4 w-4" />,
    color: 'text-platform-jira bg-platform-jira/10',
  },
  SLACK: {
    label: 'Slack',
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
    <div className="rounded-xl border border-border-primary bg-surface shadow-xs">
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">플랫폼 요약</h3>
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        )}
        {error && <p className="text-sm text-danger-500">데이터를 불러올 수 없습니다</p>}
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
                    <p className="text-xs font-medium text-text-primary">{meta?.label ?? log.platform}</p>
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
    </div>
  );
}
