import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons';
import type { EventContributionByDateResponseDto } from '@/api/generated/model';

/** 플랫폼 필터 타입 */
export type HeatmapPlatform = 'GITHUB' | 'JIRA' | 'SLACK';

interface BaseHeatmapProps {
  /** 현재 선택된 날짜 */
  selectedDate: string;
  /** 날짜 클릭 핸들러 */
  onDateClick: (date: string) => void;
  /** true면 토글 버튼 없이 항상 펼침, 외부 컨테이너 없이 그리드만 렌더링 (대시보드 위젯 임베딩용) */
  alwaysExpanded?: boolean;
  /** 히트맵에 표시할 마지막 날짜 (이 날짜 이후는 투명 처리). 미지정 시 오늘 */
  lastDate?: string;
  /** 특정 플랫폼만 표시 (미지정 시 전체 합산) */
  platform?: HeatmapPlatform;
  /** 히트맵 토글 버튼에 표시할 라벨 */
  label?: string;
}

interface ApiHeatmapProps extends BaseHeatmapProps {
  /** API 응답 기여 데이터 (level 0~4 포함) */
  contributions: EventContributionByDateResponseDto[];
  activityData?: never;
}

interface LegacyHeatmapProps extends BaseHeatmapProps {
  /** 날짜별 활동 수 (YYYY-MM-DD → count) */
  activityData: Record<string, number>;
  contributions?: never;
}

type ActivityHeatmapProps = ApiHeatmapProps | LegacyHeatmapProps;

/** 히트맵에 표시할 주 수 (위젯에서도 API 날짜 범위 계산에 사용) */
export const WEEKS = 14;
const DAY_LABELS = ['', '월', '', '수', '', '금', ''];

/** 플랫폼별 색상 매핑 (level 1~4에 대응하는 opacity 단계) */
const PLATFORM_LEVEL_CLASSES: Record<HeatmapPlatform, [string, string, string, string]> = {
  GITHUB: [
    'bg-platform-github-grass/25',
    'bg-platform-github-grass/50',
    'bg-platform-github-grass/75',
    'bg-platform-github-grass',
  ],
  JIRA: ['bg-platform-jira/25', 'bg-platform-jira/50', 'bg-platform-jira/75', 'bg-platform-jira'],
  SLACK: ['bg-platform-slack/25', 'bg-platform-slack/50', 'bg-platform-slack/75', 'bg-platform-slack'],
};

/** 기본 brand 색상 (전체 합산 모드) */
const DEFAULT_LEVEL_CLASSES: [string, string, string, string] = [
  'bg-brand-200',
  'bg-brand-400',
  'bg-brand-600',
  'bg-brand-800',
];

function getLevelClass(level: number, platform?: HeatmapPlatform): string {
  if (level < 1 || level > 4) return 'bg-surface-tertiary';
  const classes = platform ? PLATFORM_LEVEL_CLASSES[platform] : DEFAULT_LEVEL_CLASSES;
  return classes[level - 1];
}

/** count → level 변환 (플랫폼 모드에서 클라이언트 사이드 계산) */
function countToLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-surface-tertiary';
  if (count <= 2) return 'bg-brand-200';
  if (count <= 5) return 'bg-brand-400';
  if (count <= 10) return 'bg-brand-600';
  return 'bg-brand-800';
}

interface CellData {
  date: string;
  level: number;
  count: number;
  isFuture: boolean;
  isLegacyMode: boolean;
  tooltip: string;
}

export default function ActivityHeatmap(props: ActivityHeatmapProps) {
  const { selectedDate, onDateClick, alwaysExpanded = false, lastDate, platform, label } = props;
  const [expanded, setExpanded] = useState(false);
  const isExpanded = alwaysExpanded || expanded;

  // API 모드: contributions를 날짜 기반 Map으로 변환
  const contributionMap = useMemo(() => {
    if (!props.contributions) return null;
    const map = new Map<string, EventContributionByDateResponseDto>();
    for (const c of props.contributions) {
      map.set(c.event_date, c);
    }
    return map;
  }, [props.contributions]);

  // 그리드 마지막 유효 날짜 (lastDate prop 또는 오늘)
  const boundary = lastDate ? dayjs(lastDate) : dayjs();

  const grid = useMemo(() => {
    const today = dayjs();
    const endOfWeek = today.endOf('week'); // 일요일
    const startDate = endOfWeek.subtract(WEEKS, 'week').add(1, 'day'); // 시작 월요일

    const weeks: CellData[][] = [];
    let current = startDate;

    for (let w = 0; w < WEEKS; w++) {
      const week: CellData[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.format('YYYY-MM-DD');
        const isFuture = current.isAfter(boundary, 'day');

        let level = 0;
        let count = 0;
        let isLegacyMode = false;
        let tooltip = '';

        if (!isFuture) {
          if (contributionMap) {
            const entry = contributionMap.get(dateStr);
            if (platform) {
              // 플랫폼 모드: 해당 플랫폼 카운트만 사용, 레벨은 클라이언트 사이드 계산
              count = entry?.platforms?.[platform] ?? 0;
              level = countToLevel(count);
              tooltip = `${dateStr}: ${count}건`;
            } else {
              // 전체 합산 모드
              level = entry?.level ?? 0;
              count = entry?.total_count ?? 0;
              const platformParts = entry?.platforms
                ? Object.entries(entry.platforms)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(', ')
                : '';
              tooltip = platformParts ? `${dateStr}: ${count}건 (${platformParts})` : `${dateStr}: ${count}건`;
            }
          } else {
            // 레거시 모드
            count = props.activityData?.[dateStr] ?? 0;
            isLegacyMode = true;
            tooltip = `${dateStr}: ${count}건`;
          }
        }

        week.push({ date: dateStr, level, count, isFuture, isLegacyMode, tooltip });
        current = current.add(1, 'day');
      }
      weeks.push(week);
    }

    return weeks;
  }, [contributionMap, props.activityData, boundary, platform]);

  const getCellClass = (cell: CellData): string => {
    if (cell.isFuture) return 'bg-transparent';
    if (cell.isLegacyMode) return getIntensityClass(cell.count);
    return getLevelClass(cell.level, platform);
  };

  // 히트맵 그리드 + 범례 (alwaysExpanded일 때 외부 컨테이너 없이 직접 렌더링)
  const heatmapContent = (
    <div className={alwaysExpanded ? '' : 'border-t border-border-primary px-4 py-3'}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] py-[3px] pr-1">
          {DAY_LABELS.map((dayLabel, i) => (
            <div key={i} className="flex h-3 w-4 items-center justify-end text-[9px] text-text-tertiary">
              {dayLabel}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex flex-1 gap-[3px] overflow-x-auto py-[3px]">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const isSelected = day.date === selectedDate;

                return (
                  <button
                    key={day.date}
                    onClick={() => !day.isFuture && onDateClick(day.date)}
                    disabled={day.isFuture}
                    title={day.isFuture ? '' : day.tooltip}
                    className={`h-3 w-3 rounded-[2px] transition-all ${
                      day.isFuture
                        ? 'bg-transparent'
                        : isSelected
                          ? `${getCellClass(day)} ring-2 ring-brand-500 ring-offset-1 ring-offset-surface`
                          : getCellClass(day)
                    } ${!day.isFuture ? 'cursor-pointer hover:ring-1 hover:ring-border-strong' : ''}`}
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
        <div className={`h-3 w-3 rounded-[2px] ${getLevelClass(1, platform)}`} />
        <div className={`h-3 w-3 rounded-[2px] ${getLevelClass(2, platform)}`} />
        <div className={`h-3 w-3 rounded-[2px] ${getLevelClass(3, platform)}`} />
        <div className={`h-3 w-3 rounded-[2px] ${getLevelClass(4, platform)}`} />
        <span>많음</span>
      </div>
    </div>
  );

  // alwaysExpanded: 컨테이너 없이 그리드만 반환 (부모 위젯이 컨테이너 제공)
  if (alwaysExpanded) {
    return heatmapContent;
  }

  // 레거시 모드: 접기/펼치기 토글이 있는 독립 카드
  return (
    <div className="rounded-xl border border-border-primary bg-surface shadow-xs">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover rounded-xl"
      >
        <span className="text-xs font-medium text-text-secondary">{label ?? '활동 히트맵'}</span>
        <span className="ml-auto text-text-tertiary">
          {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </span>
      </button>
      {isExpanded && heatmapContent}
    </div>
  );
}
