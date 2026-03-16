import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Markdown from 'react-markdown';
import Card, { CardBody } from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { GitHubIcon, JiraIcon, SlackIcon, ClipboardDocumentIcon, CheckIcon, CalendarIcon } from '@/components/icons';
import { PLATFORM_LABELS } from '@/utils/platform';
import type { ReactNode } from 'react';

interface SearchResultCardProps {
  platform: string;
  content: string;
  targetDate: string;
  score: number;
  onCopy?: () => void;
}

const platformConfig: Record<
  string,
  {
    badge: 'github' | 'jira' | 'slack' | 'confluence';
    icon: ReactNode;
    gradient: string;
    iconBg: string;
  }
> = {
  GITHUB: {
    badge: 'github',
    icon: <GitHubIcon className="h-4 w-4" />,
    gradient: 'bg-gradient-to-r from-platform-github/10 to-transparent',
    iconBg: 'bg-platform-github/15 text-platform-github',
  },
  JIRA: {
    badge: 'jira',
    icon: <JiraIcon className="h-4 w-4" />,
    gradient: 'bg-gradient-to-r from-platform-jira/10 to-transparent',
    iconBg: 'bg-platform-jira/15 text-platform-jira',
  },
  CONFLUENCE: {
    badge: 'confluence',
    icon: null,
    gradient: 'bg-gradient-to-r from-platform-confluence/10 to-transparent',
    iconBg: 'bg-platform-confluence/15 text-platform-confluence',
  },
  SLACK: {
    badge: 'slack',
    icon: <SlackIcon className="h-4 w-4" />,
    gradient: 'bg-gradient-to-r from-platform-slack/10 to-transparent',
    iconBg: 'bg-platform-slack/15 text-platform-slack',
  },
};

export default function SearchResultCard({ platform, content, targetDate, score, onCopy }: SearchResultCardProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const config = platformConfig[platform] ?? {
    badge: 'default' as const,
    icon: null,
    gradient: '',
    iconBg: 'bg-surface-tertiary text-text-secondary',
  };
  const label = PLATFORM_LABELS[platform] ?? platform;
  const scorePercent = Math.round(score * 100);

  const handleCopy = () => {
    setCopied(true);
    onCopy?.();
  };

  const handleDateClick = () => {
    navigate('/platform', { state: { date: targetDate } });
  };

  return (
    <Card padding="none">
      <div className={`flex items-center gap-3 px-5 py-3 border-b border-border-primary ${config.gradient}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.iconBg}`}>
          {config.icon ?? <span className="text-xs font-bold">{label.charAt(0)}</span>}
        </div>
        <span className="text-sm font-semibold text-text-primary">{label}</span>

        {/* 날짜 */}
        <button
          type="button"
          onClick={handleDateClick}
          className="ml-auto inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-link transition-colors"
          title={`${targetDate} 업무일지 보기`}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {targetDate}
        </button>

        {/* 유사도 */}
        <Badge variant="default">{scorePercent}%</Badge>

        {/* 복사 */}
        {onCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary cursor-pointer"
            title="마크다운 복사"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success-600" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      <CardBody>
        <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-code:rounded prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:text-text-primary prose-code:before:content-none prose-code:after:content-none">
          <Markdown>{content}</Markdown>
        </div>
      </CardBody>
    </Card>
  );
}
