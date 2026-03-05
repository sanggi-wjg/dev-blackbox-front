import type { PlatformWorkLogDetailResponseDto } from '@/api/generated/model/platformWorkLogDetailResponseDto';
import { GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';
import type { ReactNode } from 'react';

interface DailySummaryBarProps {
  workLogs: PlatformWorkLogDetailResponseDto[];
}

interface Metric {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}

function computeMetrics(workLogs: PlatformWorkLogDetailResponseDto[]): Metric[] {
  let githubEvents = 0;
  let jiraIssues = 0;
  let slackMessages = 0;

  for (const log of workLogs) {
    githubEvents += log.github_events?.length ?? 0;
    jiraIssues += log.jira_events?.length ?? 0;
    slackMessages += log.slack_messages?.length ?? 0;
  }

  return [
    {
      label: 'GitHub 이벤트',
      value: githubEvents,
      icon: <GitHubIcon className="h-4 w-4" />,
      color: 'text-platform-github bg-platform-github/10',
    },
    {
      label: 'Jira 이슈',
      value: jiraIssues,
      icon: <JiraIcon className="h-4 w-4" />,
      color: 'text-platform-jira bg-platform-jira/10',
    },
    {
      label: 'Slack 메시지',
      value: slackMessages,
      icon: <SlackIcon className="h-4 w-4" />,
      color: 'text-platform-slack bg-platform-slack/10',
    },
  ].filter((m) => m.value > 0);
}

export default function DailySummaryBar({ workLogs }: DailySummaryBarProps) {
  const metrics = computeMetrics(workLogs);

  if (metrics.length === 0) return null;

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 animate-stagger-up">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex items-center gap-3 rounded-xl border border-border-primary bg-surface p-3 shadow-xs"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${metric.color}`}>{metric.icon}</div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-text-primary leading-tight">{metric.value}</p>
            <p className="text-xs text-text-tertiary truncate">{metric.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
