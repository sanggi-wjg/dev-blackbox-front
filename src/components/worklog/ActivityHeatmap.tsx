import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons';

interface ActivityHeatmapProps {
  /** 날짜별 활동 수 (YYYY-MM-DD → count) */
  activityData: Record<string, number>;
  /** 현재 선택된 날짜 */
  selectedDate: string;
  /** 날짜 클릭 핸들러 */
  onDateClick: (date: string) => void;
}

const WEEKS = 14;
const DAY_LABELS = ['', '월', '', '수', '', '금', ''];

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-surface-tertiary';
  if (count <= 2) return 'bg-brand-200';
  if (count <= 5) return 'bg-brand-400';
  if (count <= 10) return 'bg-brand-600';
  return 'bg-brand-800';
}

export default function ActivityHeatmap({ activityData, selectedDate, onDateClick }: ActivityHeatmapProps) {
  const [expanded, setExpanded] = useState(false);

  // 오늘 기준으로 WEEKS 주 전까지의 날짜 그리드 생성
  const grid = useMemo(() => {
    const today = dayjs();
    const endOfWeek = today.endOf('week'); // 일요일
    const startDate = endOfWeek.subtract(WEEKS, 'week').add(1, 'day'); // 시작 월요일

    const weeks: { date: string; count: number }[][] = [];
    let current = startDate;

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.format('YYYY-MM-DD');
        const isFuture = current.isAfter(today, 'day');
        week.push({
          date: dateStr,
          count: isFuture ? -1 : (activityData[dateStr] ?? 0),
        });
        current = current.add(1, 'day');
      }
      weeks.push(week);
    }

    return weeks;
  }, [activityData]);

  return (
    <div className="rounded-xl border border-border-primary bg-surface shadow-xs animate-stagger-up">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover rounded-xl"
      >
        <span className="text-xs font-medium text-text-secondary">활동 히트맵</span>
        <span className="ml-auto text-text-tertiary">
          {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </span>
      </button>

      {/* Heatmap grid */}
      {expanded && (
        <div className="border-t border-border-primary px-4 py-3">
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-1">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-3 w-4 items-center justify-end text-[9px] text-text-tertiary">
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex flex-1 gap-[3px] overflow-x-auto">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const isSelected = day.date === selectedDate;
                    const isFuture = day.count === -1;

                    return (
                      <button
                        key={day.date}
                        onClick={() => !isFuture && onDateClick(day.date)}
                        disabled={isFuture}
                        title={isFuture ? '' : `${day.date}: ${day.count}건`}
                        className={`h-3 w-3 rounded-[2px] transition-all ${
                          isFuture
                            ? 'bg-transparent'
                            : isSelected
                              ? `${getIntensityClass(day.count)} ring-2 ring-brand-500 ring-offset-1 ring-offset-surface`
                              : getIntensityClass(day.count)
                        } ${!isFuture ? 'cursor-pointer hover:ring-1 hover:ring-border-strong' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-text-tertiary">
            <span>적음</span>
            <div className="h-3 w-3 rounded-[2px] bg-surface-tertiary" />
            <div className="h-3 w-3 rounded-[2px] bg-brand-200" />
            <div className="h-3 w-3 rounded-[2px] bg-brand-400" />
            <div className="h-3 w-3 rounded-[2px] bg-brand-600" />
            <div className="h-3 w-3 rounded-[2px] bg-brand-800" />
            <span>많음</span>
          </div>
        </div>
      )}
    </div>
  );
}
