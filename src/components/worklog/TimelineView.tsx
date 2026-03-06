import TimelineItem from './TimelineItem';
import type { TimelineEvent } from './TimelineItem';
import type { PlatformWorkLogDetailResponseDto } from '@/api/generated/model/platformWorkLogDetailResponseDto';
import type { GithubPullRequestEventPayload } from '@/api/generated/model/githubPullRequestEventPayload';

interface TimelineViewProps {
  workLogs: PlatformWorkLogDetailResponseDto[];
}

function buildTimeline(workLogs: PlatformWorkLogDetailResponseDto[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const log of workLogs) {
    // GitHub 이벤트
    if (log.github_events) {
      for (const ge of log.github_events) {
        const eventType = ge.event?.type ?? ge.event_type;
        const repo = ge.event?.repo?.name ?? '';
        let title = `${eventType}`;
        if (repo) title += ` — ${repo}`;

        // 이벤트 타입별 브랜치 정보 추출
        let branch: string | undefined;
        const payload = ge.event?.payload;
        if (payload) {
          if (eventType === 'PushEvent') {
            const ref = (payload as { ref?: string }).ref;
            branch = ref?.replace('refs/heads/', '');
          } else if (eventType === 'PullRequestEvent') {
            const pr = (payload as GithubPullRequestEventPayload).pull_request;
            if (pr) branch = `${pr.head.ref} → ${pr.base.ref}`;
          } else if (eventType === 'CreateEvent' || eventType === 'DeleteEvent') {
            const ref = (payload as { ref?: string; ref_type?: string }).ref;
            if (ref) branch = ref;
          }
        }

        events.push({
          id: `gh-${ge.id}`,
          platform: 'GITHUB',
          timestamp: ge.event?.created_at ?? log.target_date,
          title,
          description: ge.commit?.commit?.message ?? undefined,
          branch,
        });
      }
    }

    // Jira 이벤트
    if (log.jira_events) {
      for (const je of log.jira_events) {
        const timestamp = je.changelog?.[0]?.created ?? log.target_date;
        events.push({
          id: `jira-${je.id}`,
          platform: 'JIRA',
          timestamp,
          title: `${je.issue_key}: ${je.issue?.summary ?? ''}`,
          description: je.changelog
            ?.map((c) => c.items?.map((i) => `${i.field}: ${i.from_string ?? ''} → ${i.to_string ?? ''}`).join(', '))
            .join('; '),
        });
      }
    }

    // Slack 메시지
    if (log.slack_messages) {
      for (const sm of log.slack_messages) {
        // message_ts는 Unix timestamp 문자열 (e.g. "1234567890.123456")
        const tsMs = parseFloat(sm.message_ts) * 1000;
        const timestamp = isNaN(tsMs) ? log.target_date : new Date(tsMs).toISOString();
        events.push({
          id: `slack-${sm.id}`,
          platform: 'SLACK',
          timestamp,
          title: `#${sm.channel_name}`,
          description: sm.message_text?.slice(0, 120),
        });
      }
    }
  }

  // 시간순 정렬
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return events;
}

export default function TimelineView({ workLogs }: TimelineViewProps) {
  const events = buildTimeline(workLogs);

  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-text-tertiary">타임라인에 표시할 이벤트가 없습니다</p>;
  }

  return (
    <div className="animate-stagger-up">
      {events.map((event, index) => (
        <TimelineItem key={event.id} event={event} isLast={index === events.length - 1} />
      ))}
    </div>
  );
}
