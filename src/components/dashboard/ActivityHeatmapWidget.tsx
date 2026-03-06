import dayjs from 'dayjs';
import { useGetEventActivityHeatmapApiV1EventActivityHeatmapGet } from '@/api/generated/event-activity/event-activity';
import ActivityHeatmap, { WEEKS } from '@/components/worklog/ActivityHeatmap';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { CalendarIcon, FireIcon } from '@/components/icons';

interface ActivityHeatmapWidgetProps {
  targetDate: string;
  onDateClick: (date: string) => void;
}

// 어제 기준 고정 날짜 범위 (백엔드가 전일 활동 데이터를 수집하므로 어제가 마지막 유효 날짜)
const yesterday = dayjs().subtract(1, 'day');
const endOfWeek = yesterday.endOf('week');
const startDate = endOfWeek.subtract(WEEKS, 'week').add(1, 'day');
const FROM_DATE = startDate.format('YYYY-MM-DD');
const TO_DATE = yesterday.format('YYYY-MM-DD');

export default function ActivityHeatmapWidget({ targetDate, onDateClick }: ActivityHeatmapWidgetProps) {
  const { data, isLoading, error } = useGetEventActivityHeatmapApiV1EventActivityHeatmapGet({
    from_date: FROM_DATE,
    to_date: TO_DATE,
  });

  const summary = data?.summary;
  const contributions = data?.contributions;

  return (
    <Card padding="none">
      {/* Header */}
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">활동 히트맵</h3>
      </div>

      <div className="p-4">
        {/* 로딩 또는 초기 상태 */}
        {(isLoading || (!error && !contributions)) && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="히트맵 로딩 중..." />
          </div>
        )}

        {/* 에러 */}
        {error && <ErrorMessage error={error} />}

        {/* 빈 상태 */}
        {contributions && contributions.length === 0 && (
          <p className="py-6 text-center text-sm text-text-tertiary">이 기간에 활동 데이터가 없습니다</p>
        )}

        {/* 데이터 */}
        {contributions && contributions.length > 0 && (
          <>
            {/* 요약 통계 */}
            {summary && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-text-primary">{summary.total_contributions.toLocaleString()}</p>
                  <p className="text-[11px] text-text-tertiary">전체 기여</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CalendarIcon className="h-4 w-4 text-brand-500" />
                    <p className="text-lg font-bold text-text-primary">{summary.active_days}</p>
                  </div>
                  <p className="text-[11px] text-text-tertiary">활동 일수</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FireIcon className="h-4 w-4 text-warning-500" />
                    <p className="text-lg font-bold text-text-primary">{summary.longest_streak}</p>
                  </div>
                  <p className="text-[11px] text-text-tertiary">최장 연속일</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FireIcon className="h-4 w-4 text-danger-500" />
                    <p className="text-lg font-bold text-text-primary">{summary.current_streak}</p>
                  </div>
                  <p className="text-[11px] text-text-tertiary">현재 연속일</p>
                </div>
              </div>
            )}

            {/* 히트맵 */}
            <ActivityHeatmap
              contributions={contributions}
              selectedDate={targetDate}
              onDateClick={onDateClick}
              lastDate={TO_DATE}
              alwaysExpanded
            />
          </>
        )}
      </div>
    </Card>
  );
}
