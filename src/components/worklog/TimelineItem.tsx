import { GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';
import type { ReactNode } from 'react';

export interface TimelineEvent {
  id: string;
  platform: 'GITHUB' | 'JIRA' | 'SLACK';
  timestamp: string;
  title: string;
  description?: string;
  /** 브랜치 정보 (예: "feature/foo" 또는 "feature/foo → main") */
  branch?: string;
}

const platformStyle: Record<string, { icon: ReactNode; dotBg: string }> = {
  GITHUB: {
    icon: <GitHubIcon className="h-3.5 w-3.5" />,
    dotBg: 'bg-platform-github text-text-inverse',
  },
  JIRA: {
    icon: <JiraIcon className="h-3.5 w-3.5" />,
    dotBg: 'bg-platform-jira text-text-inverse',
  },
  SLACK: {
    icon: <SlackIcon className="h-3.5 w-3.5" />,
    dotBg: 'bg-platform-slack text-text-inverse',
  },
};

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

export default function TimelineItem({ event, isLast }: TimelineItemProps) {
  const style = platformStyle[event.platform] ?? {
    icon: null,
    dotBg: 'bg-surface-tertiary text-text-secondary',
  };

  const isDateOnly = event.timestamp.length === 10;
  const time = new Date(event.timestamp);
  const timeStr = isDateOnly
    ? '--:--'
    : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.dotBg}`}>
          {style.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border-primary" />}
      </div>

      {/* Content */}
      <div className={`pb-6 ${isLast ? '' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-tertiary">{timeStr}</span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-text-primary">{event.title}</p>
        {event.branch && (
          <p className="mt-0.5">
            <span className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
              {event.branch}
            </span>
          </p>
        )}
        {event.description && <p className="mt-0.5 text-xs text-text-tertiary line-clamp-2">{event.description}</p>}
      </div>
    </div>
  );
}
