import { useState } from 'react';
import {
  GitHubIcon,
  JiraIcon,
  SlackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
} from '@/components/icons';
import type { GitHubEventResponseDto } from '@/api/generated/model/gitHubEventResponseDto';
import type { JiraEventResponseDto } from '@/api/generated/model/jiraEventResponseDto';
import type { SlackMessageResponseDto } from '@/api/generated/model/slackMessageResponseDto';
import type { GithubPullRequestEventPayload } from '@/api/generated/model/githubPullRequestEventPayload';

interface SourceDataSectionProps {
  platform: string;
  githubEvents?: GitHubEventResponseDto[];
  jiraEvents?: JiraEventResponseDto[];
  slackMessages?: SlackMessageResponseDto[];
}

export default function SourceDataSection({
  platform,
  githubEvents,
  jiraEvents,
  slackMessages,
}: SourceDataSectionProps) {
  const [open, setOpen] = useState(false);

  const totalCount = (githubEvents?.length ?? 0) + (jiraEvents?.length ?? 0) + (slackMessages?.length ?? 0);

  if (totalCount === 0) return null;

  return (
    <div className="border-t border-border-default">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-text-tertiary transition-colors hover:bg-surface-hover cursor-pointer"
      >
        {open ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
        이벤트 {totalCount}건
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1">
          {platform === 'GITHUB' && githubEvents?.map((e) => <GitHubEventRow key={e.id} data={e} />)}
          {platform === 'JIRA' && jiraEvents?.map((e) => <JiraEventRow key={e.id} data={e} />)}
          {platform === 'SLACK' && slackMessages?.map((e) => <SlackMessageRow key={e.id} data={e} />)}
        </div>
      )}
    </div>
  );
}

// ─── GitHub ─────────────────────────────────────

function GitHubEventRow({ data }: { data: GitHubEventResponseDto }) {
  const [expanded, setExpanded] = useState(false);
  const { event, commit } = data;
  const repoName = event.repo.name;
  const repoUrl = `https://github.com/${repoName}`;
  const eventLabel = event.type?.replace('Event', '') ?? 'Event';

  const isPrEvent = event.type === 'PullRequestEvent';
  const prPayload = isPrEvent ? (event.payload as GithubPullRequestEventPayload) : undefined;

  const isPushEvent = event.type === 'PushEvent';
  const pushRef = isPushEvent ? (event.payload as { ref?: string })?.ref : undefined;
  const branchName = pushRef?.replace('refs/heads/', '');

  return (
    <div className="rounded-md border border-border-default text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-hover cursor-pointer"
      >
        <GitHubIcon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        <span className="font-medium text-text-primary">{eventLabel}</span>
        {branchName && (
          <span className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-text-secondary">{branchName}</span>
        )}
        <span className="text-text-tertiary truncate">{repoName}</span>
        <ExternalLink href={repoUrl} className="ml-auto shrink-0" />
      </button>

      {expanded && (
        <div className="border-t border-border-default px-3 py-2 space-y-2 bg-surface-secondary">
          {/* Commit info */}
          {commit && (
            <>
              <div className="flex items-start gap-2">
                <span className="shrink-0 font-mono text-text-tertiary">{commit.sha.slice(0, 7)}</span>
                <span className="text-text-secondary break-all">{commit.commit.message.split('\n')[0]}</span>
                <ExternalLink href={commit.html_url} className="ml-auto shrink-0" />
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-text-tertiary">
                <span className="text-green-600">+{commit.stats.additions}</span>
                <span className="text-red-500">-{commit.stats.deletions}</span>
              </div>

              {/* Files */}
              {commit.files.length > 0 && (
                <div className="space-y-0.5">
                  {commit.files.slice(0, 5).map((f) => (
                    <div key={f.sha} className="flex items-center gap-1.5 text-text-tertiary">
                      <FileStatusBadge status={f.status} />
                      <a
                        href={f.blob_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-text-primary hover:underline"
                      >
                        {f.filename}
                      </a>
                    </div>
                  ))}
                  {commit.files.length > 5 && (
                    <span className="text-text-tertiary">외 {commit.files.length - 5}개 파일</span>
                  )}
                </div>
              )}
            </>
          )}

          {/* PR detail */}
          {prPayload && (
            <div className="space-y-1.5">
              {/* PR title + link */}
              <div className="flex items-center gap-1.5">
                <PrStateBadge state={prPayload.pull_request.state} merged={prPayload.pull_request.merged} draft={prPayload.pull_request.draft} />
                <a
                  href={`https://github.com/${repoName}/pull/${prPayload.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-text-primary hover:underline truncate"
                >
                  {prPayload.pull_request.title ?? `#${prPayload.number}`}
                </a>
                <span className="text-text-tertiary">#{prPayload.number}</span>
              </div>

              {/* Branch: head → base */}
              <div className="flex items-center gap-1.5 text-text-tertiary">
                <span className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-text-secondary">
                  {prPayload.pull_request.head.ref}
                </span>
                <span>→</span>
                <span className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-text-secondary">
                  {prPayload.pull_request.base.ref}
                </span>
              </div>

              {/* Action */}
              <div className="text-text-tertiary">
                액션: <span className="text-text-secondary">{prPayload.action}</span>
              </div>

              {/* Body preview */}
              {prPayload.pull_request.body && (
                <div className="max-h-24 overflow-y-auto rounded border border-border-default bg-surface p-2 whitespace-pre-wrap text-text-secondary break-words">
                  {prPayload.pull_request.body}
                </div>
              )}
            </div>
          )}

          {/* Fallback: no commit and no PR */}
          {!commit && !prPayload && <span className="text-text-tertiary">상세 정보 없음</span>}
        </div>
      )}
    </div>
  );
}

// ─── Jira ───────────────────────────────────────

function JiraEventRow({ data }: { data: JiraEventResponseDto }) {
  const [expanded, setExpanded] = useState(false);
  const { issue, changelog } = data;

  return (
    <div className="rounded-md border border-border-default text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-hover cursor-pointer"
      >
        <JiraIcon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        <span className="font-medium text-text-primary">{data.issue_key}</span>
        <span className="text-text-tertiary truncate">{issue.summary}</span>
      </button>

      {expanded && (
        <div className="border-t border-border-default px-3 py-2 space-y-2 bg-surface-secondary">
          {/* Issue meta */}
          <div className="flex flex-wrap gap-2 text-text-tertiary">
            <span>
              상태: <span className="text-text-secondary">{issue.status}</span>
            </span>
            <span>
              유형: <span className="text-text-secondary">{issue.issue_type}</span>
            </span>
            {issue.priority && (
              <span>
                우선순위: <span className="text-text-secondary">{issue.priority}</span>
              </span>
            )}
          </div>

          {/* Changelog */}
          {changelog && changelog.length > 0 && (
            <div className="space-y-1">
              <span className="font-medium text-text-tertiary">변경이력</span>
              {changelog.slice(0, 3).map((h) => (
                <div key={h.id} className="ml-2 space-y-0.5">
                  {h.items.map((item, i) => (
                    <div key={i} className="text-text-tertiary">
                      <span className="text-text-secondary">{item.field}</span>
                      {item.from_string && <span>: {item.from_string}</span>}
                      {item.to_string && <span> → {item.to_string}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          {issue.comments && issue.comments.length > 0 && (
            <div className="space-y-1">
              <span className="font-medium text-text-tertiary">댓글</span>
              {issue.comments.map((c, i) => (
                <div key={i} className="ml-2 text-text-secondary">
                  <span className="font-medium">{c.author_display_name}:</span> {c.body}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Slack ──────────────────────────────────────

function SlackMessageRow({ data }: { data: SlackMessageResponseDto }) {
  const [expanded, setExpanded] = useState(false);
  const preview = data.message_text.length > 60 ? data.message_text.slice(0, 60) + '…' : data.message_text;

  return (
    <div className="rounded-md border border-border-default text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-hover cursor-pointer"
      >
        <SlackIcon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        <span className="font-medium text-text-primary">#{data.channel_name}</span>
        <span className="text-text-tertiary truncate">{preview}</span>
      </button>

      {expanded && (
        <div className="border-t border-border-default px-3 py-2 space-y-1.5 bg-surface-secondary">
          <div className="max-h-32 overflow-y-auto whitespace-pre-wrap text-text-secondary break-words">
            {data.message_text}
          </div>
          {data.thread_ts && <span className="text-text-tertiary">스레드 답글</span>}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────

function ExternalLink({ href, className = '' }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded p-1 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
    </a>
  );
}

function PrStateBadge({ state, merged, draft }: { state?: string | null; merged?: boolean | null; draft?: boolean | null }) {
  if (merged) return <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Merged</span>;
  if (state === 'closed') return <span className="rounded-full bg-danger-50 px-1.5 py-0.5 text-danger-600">Closed</span>;
  if (draft) return <span className="rounded-full bg-surface-tertiary px-1.5 py-0.5 text-text-tertiary">Draft</span>;
  return <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-success-600">Open</span>;
}

function FileStatusBadge({ status }: { status: string }) {
  const label =
    status === 'added'
      ? 'A'
      : status === 'removed'
        ? 'D'
        : status === 'modified'
          ? 'M'
          : (status[0]?.toUpperCase() ?? '?');
  const color = status === 'added' ? 'text-green-600' : status === 'removed' ? 'text-red-500' : 'text-yellow-600';

  return <span className={`font-mono font-bold ${color}`}>{label}</span>;
}
