import Markdown from 'react-markdown';
import { useGetDailyWorkLogApiV1DailyWorkLogsGet } from '@/api/generated/work-log/work-log';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

interface DailyLogWidgetProps {
  targetDate: string;
}

export default function DailyLogWidget({ targetDate }: DailyLogWidgetProps) {
  const { data: dailyLog, isLoading, error } = useGetDailyWorkLogApiV1DailyWorkLogsGet({ target_date: targetDate });

  return (
    <Card padding="none">
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">일일 업무일지</h3>
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="일지 로딩 중..." />
          </div>
        )}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && !dailyLog && (
          <p className="py-6 text-center text-sm text-text-tertiary">작성된 일지가 없습니다</p>
        )}
        {dailyLog && (
          <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-code:rounded prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:text-text-primary prose-code:before:content-none prose-code:after:content-none">
            <Markdown>{dailyLog.content}</Markdown>
          </div>
        )}
      </div>
    </Card>
  );
}
