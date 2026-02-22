import Markdown from 'react-markdown';
import Card, { CardHeader, CardBody } from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { GitHubIcon, JiraIcon, SlackIcon } from '@/components/icons';
import type { ReactNode } from 'react';

interface WorkLogCardProps {
  platform: string;
  content: string;
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

export default function WorkLogCard({ platform, content }: WorkLogCardProps) {
  const config = platformConfig[platform] ?? {
    label: platform,
    borderColor: 'border-l-border-strong',
    badge: 'default' as const,
    icon: null,
  };

  return (
    <Card
      padding="none"
      className={`border-l-4 ${config.borderColor} transition-shadow duration-150 hover:shadow-md`}
    >
      <CardHeader className="flex items-center gap-2">
        <Badge variant={config.badge as 'github' | 'jira' | 'slack' | 'confluence'}>
          <span className="inline-flex items-center gap-1.5">
            {config.icon}
            {config.label}
          </span>
        </Badge>
      </CardHeader>
      <CardBody>
        <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-code:rounded prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:text-text-primary prose-code:before:content-none prose-code:after:content-none">
          <Markdown>{content}</Markdown>
        </div>
      </CardBody>
    </Card>
  );
}
