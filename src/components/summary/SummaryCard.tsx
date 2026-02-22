import Markdown from 'react-markdown';

interface SummaryCardProps {
  platform: string;
  summary: string;
}

const platformConfig: Record<string, { label: string; borderColor: string; badge: string }> = {
  GITHUB: {
    label: 'GitHub',
    borderColor: 'border-l-gray-800',
    badge: 'bg-gray-800 text-white',
  },
  JIRA: {
    label: 'Jira',
    borderColor: 'border-l-blue-600',
    badge: 'bg-blue-600 text-white',
  },
  CONFLUENCE: {
    label: 'Confluence',
    borderColor: 'border-l-blue-400',
    badge: 'bg-blue-400 text-white',
  },
  SLACK: {
    label: 'Slack',
    borderColor: 'border-l-purple-600',
    badge: 'bg-purple-600 text-white',
  },
};

export default function SummaryCard({ platform, summary }: SummaryCardProps) {
  const config = platformConfig[platform] ?? {
    label: platform,
    borderColor: 'border-l-gray-300',
    badge: 'bg-gray-300 text-gray-800',
  };

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${config.borderColor} bg-white shadow-sm`}>
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${config.badge}`}>
          {config.label}
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="prose prose-sm prose-gray max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-strong:text-gray-700 prose-ul:text-gray-600 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-gray-700 prose-code:before:content-none prose-code:after:content-none">
          <Markdown>{summary}</Markdown>
        </div>
      </div>
    </div>
  );
}
