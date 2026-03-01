import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import Card, { CardHeader, CardBody } from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { GitHubIcon, JiraIcon, SlackIcon, SparklesIcon, ClipboardDocumentIcon, CheckIcon } from '@/components/icons';
import SourceDataSection from '@/components/worklog/SourceDataSection';
import type { ReactNode } from 'react';
import type { GitHubEventResponseDto } from '@/api/generated/model/gitHubEventResponseDto';
import type { JiraEventResponseDto } from '@/api/generated/model/jiraEventResponseDto';
import type { SlackMessageResponseDto } from '@/api/generated/model/slackMessageResponseDto';

interface WorkLogCardProps {
  platform: string;
  content: string;
  modelName?: string;
  prompt?: string;
  onCopy?: () => void;
  githubEvents?: GitHubEventResponseDto[];
  jiraEvents?: JiraEventResponseDto[];
  slackMessages?: SlackMessageResponseDto[];
}

const platformConfig: Record<
  string,
  { label: string; borderColor: string; badge: 'github' | 'jira' | 'slack' | 'confluence'; icon: ReactNode }
> = {
  GITHUB: {
    label: 'GitHub',
    borderColor: 'border-l-platform-github',
    badge: 'github',
    icon: <GitHubIcon className="h-4 w-4" />,
  },
  JIRA: {
    label: 'Jira',
    borderColor: 'border-l-platform-jira',
    badge: 'jira',
    icon: <JiraIcon className="h-4 w-4" />,
  },
  CONFLUENCE: {
    label: 'Confluence',
    borderColor: 'border-l-platform-confluence',
    badge: 'confluence',
    icon: null,
  },
  SLACK: {
    label: 'Slack',
    borderColor: 'border-l-platform-slack',
    badge: 'slack',
    icon: <SlackIcon className="h-4 w-4" />,
  },
};

export default function WorkLogCard({
  platform,
  content,
  modelName,
  prompt,
  onCopy,
  githubEvents,
  jiraEvents,
  slackMessages,
}: WorkLogCardProps) {
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const config = platformConfig[platform] ?? {
    label: platform,
    borderColor: 'border-l-border-strong',
    badge: 'default' as const,
    icon: null,
  };

  const handleCopy = () => {
    setCopied(true);
    onCopy?.();
  };

  return (
    <Card padding="none" className={`border-l-4 ${config.borderColor}`}>
      <CardHeader className="flex items-center gap-2">
        <Badge variant={config.badge as 'github' | 'jira' | 'slack' | 'confluence'}>
          <span className="inline-flex items-center gap-1.5">
            {config.icon}
            {config.label}
          </span>
        </Badge>
        {modelName && (
          <Badge variant="default" className="cursor-pointer hover:bg-surface-hover transition-colors">
            <button
              type="button"
              className="inline-flex items-center gap-1 cursor-pointer"
              onClick={() => setShowAiInfo(true)}
            >
              <SparklesIcon className="h-3 w-3" />
              {modelName}
            </button>
          </Badge>
        )}
        {onCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto inline-flex items-center justify-center rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary cursor-pointer"
            title="마크다운 복사"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success-600" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </CardHeader>
      <CardBody>
        <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-code:rounded prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:text-text-primary prose-code:before:content-none prose-code:after:content-none">
          <Markdown>{content}</Markdown>
        </div>
      </CardBody>

      <SourceDataSection
        platform={platform}
        githubEvents={githubEvents}
        jiraEvents={jiraEvents}
        slackMessages={slackMessages}
      />

      {modelName && (
        <Modal open={showAiInfo} onClose={() => setShowAiInfo(false)} title="AI 생성 정보" size="lg">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-text-tertiary">모델</span>
              <p className="text-sm text-text-primary">{modelName}</p>
            </div>
            {prompt && (
              <div>
                <span className="text-xs font-medium text-text-tertiary">프롬프트</span>
                <pre className="mt-1 max-h-80 overflow-y-auto rounded-lg bg-surface-tertiary p-3 text-xs text-text-secondary whitespace-pre-wrap">
                  {prompt}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Card>
  );
}
