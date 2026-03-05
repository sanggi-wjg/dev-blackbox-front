import Markdown from 'react-markdown';
import { useGetDailyWorkLogApiV1DailyWorkLogsGet } from '@/api/generated/work-log/work-log';

interface DailyLogWidgetProps {
  targetDate: string;
}

export default function DailyLogWidget({ targetDate }: DailyLogWidgetProps) {
  const { data: dailyLog, isLoading, error } = useGetDailyWorkLogApiV1DailyWorkLogsGet({ target_date: targetDate });

  return (
    <div className="rounded-xl border border-border-primary bg-surface shadow-xs">
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">일일 업무일지</h3>
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        )}
        {error && <p className="text-sm text-danger-500">데이터를 불러올 수 없습니다</p>}
        {!isLoading && !error && !dailyLog && (
          <p className="py-6 text-center text-sm text-text-tertiary">작성된 일지가 없습니다</p>
        )}
        {dailyLog && (
          <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-code:rounded prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:text-text-primary prose-code:before:content-none prose-code:after:content-none">
            <Markdown>{dailyLog.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
