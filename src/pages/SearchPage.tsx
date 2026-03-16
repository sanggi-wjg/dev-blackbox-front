import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { PlatformEnum } from '@/api/generated/model';
import { useSearchPlatformWorkLogsApiV1SearchGet } from '@/api/generated/search/search';
import { useDebounce } from '@/hooks/useDebounce';
import SearchResultCard from '@/components/search/SearchResultCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { SearchResultSkeleton } from '@/components/common/Skeleton';
import Card from '@/components/common/Card';
import { useToast } from '@/components/common/Toast';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GitHubIcon,
  JiraIcon,
  SlackIcon,
} from '@/components/icons';
import { PLATFORM_LABELS } from '@/utils/platform';
import type { ReactNode } from 'react';

type PlatformFilter = PlatformEnum | null;

const VALID_PLATFORMS = new Set<string>(Object.values(PlatformEnum));

const RESULT_LIMIT = 20;

function parsePlatformParam(value: string | null): PlatformFilter {
  return value && VALID_PLATFORMS.has(value) ? (value as PlatformEnum) : null;
}

const PLATFORM_OPTIONS: { id: PlatformFilter; label: string; icon?: ReactNode; activeClass: string }[] = [
  {
    id: null,
    label: '전체',
    activeClass: 'bg-brand-600 text-text-inverse',
  },
  {
    id: PlatformEnum.GITHUB,
    label: 'GitHub',
    icon: <GitHubIcon className="h-3.5 w-3.5" />,
    activeClass: 'bg-platform-github text-text-inverse',
  },
  {
    id: PlatformEnum.JIRA,
    label: 'Jira',
    icon: <JiraIcon className="h-3.5 w-3.5" />,
    activeClass: 'bg-platform-jira text-text-inverse',
  },
  {
    id: PlatformEnum.CONFLUENCE,
    label: 'Confluence',
    activeClass: 'bg-brand-600 text-text-inverse',
  },
  {
    id: PlatformEnum.SLACK,
    label: 'Slack',
    icon: <SlackIcon className="h-3.5 w-3.5" />,
    activeClass: 'bg-platform-slack text-text-inverse',
  },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 로컬 입력 상태 (IME 조합 중에도 안전)
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '');
  const [platform, setPlatform] = useState<PlatformFilter>(
    () => parsePlatformParam(searchParams.get('platform')),
  );
  const [fromDate, setFromDate] = useState(() => searchParams.get('from') ?? '');
  const [toDate, setToDate] = useState(() => searchParams.get('to') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(
    () => !!(searchParams.get('platform') || searchParams.get('from') || searchParams.get('to')),
  );
  const [debugMode, setDebugMode] = useState(false);

  const debouncedQuery = useDebounce(inputValue, 300);
  const { toast } = useToast();

  const hasActiveFilters = platform !== null || fromDate !== '' || toDate !== '';

  // 마운트 시 URL 덮어쓰기 방지
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (platform) params.platform = platform;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, platform, fromDate, toDate, setSearchParams]);

  // API 파라미터 구성
  const apiParams = useMemo(() => {
    const params: Parameters<typeof useSearchPlatformWorkLogsApiV1SearchGet>[0] = {
      query: debouncedQuery,
      limit: RESULT_LIMIT,
    };
    if (platform) params.platform = platform;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return params;
  }, [debouncedQuery, platform, fromDate, toDate]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSearchPlatformWorkLogsApiV1SearchGet(apiParams, {
    query: { enabled: debouncedQuery.length >= 1 },
  });

  const results = data?.results;

  const handleQueryChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setPlatform(null);
    setFromDate('');
    setToDate('');
  }, []);

  const handleCopy = (platformKey: string, content: string) => {
    const label = PLATFORM_LABELS[platformKey] ?? platformKey;
    navigator.clipboard.writeText(content).then(
      () => toast('success', `${label} 요약이 복사되었습니다`),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  // 결과 리스트 key (stagger 애니메이션 재생용)
  const resultListKey = useMemo(
    () => results?.map((r) => r.id).join(',') ?? '',
    [results],
  );

  const hasQuery = debouncedQuery.length >= 1;
  const hasResults = results != null && results.length > 0;
  const showRefetching = isFetching && !isLoading && hasQuery;

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary tracking-tight">검색</h2>
        <p className="mt-0.5 text-sm text-text-secondary">업무 일지를 의미 기반으로 검색합니다</p>
      </div>

      {/* Control bar — sticky 검색 입력 + 필터 */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pb-4 md:-mx-4 md:px-4 lg:-mx-5 lg:px-5 bg-surface-secondary">
        <Card padding="sm">
          {/* 검색 입력 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="검색어를 입력하세요..."
              autoFocus
              className="h-9 w-full rounded-lg border border-border-primary bg-surface pl-9 pr-20 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:ring-2 focus:outline-none focus:border-border-focus focus:ring-brand-500/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {inputValue && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  title="검색어 지우기"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
                className={`rounded-md p-1 transition-colors ${
                  hasActiveFilters
                    ? 'text-brand-600 hover:bg-brand-50'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="필터"
              >
                {filtersOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 필터 영역 */}
          {filtersOpen && (
            <div className="mt-3 flex flex-col gap-3 border-t border-border-primary pt-3 animate-slide-up">
              {/* 플랫폼 필터 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-text-tertiary shrink-0">플랫폼</span>
                <div role="group" aria-label="플랫폼 필터" className="flex flex-wrap gap-1">
                  {PLATFORM_OPTIONS.map((opt) => {
                    const isActive = opt.id === platform;
                    return (
                      <button
                        key={opt.id ?? 'all'}
                        aria-pressed={isActive}
                        onClick={() => setPlatform(opt.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          isActive ? opt.activeClass : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 날짜 범위 필터 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-text-tertiary shrink-0">기간</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <DateInput value={fromDate} onChange={setFromDate} placeholder="시작일" max={toDate || undefined} />
                  <span className="text-xs text-text-tertiary">~</span>
                  <DateInput value={toDate} onChange={setToDate} placeholder="종료일" min={fromDate || undefined} />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="ml-auto text-xs text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 재요청 로딩 인디케이터 — 항상 공간 확보하여 레이아웃 시프트 방지 */}
      <div className={`mb-4 h-0.5 overflow-hidden rounded-full transition-opacity ${showRefetching ? 'bg-surface-tertiary opacity-100' : 'opacity-0'}`}>
        <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-500" />
      </div>

      {/* 쿼리 미입력 상태 */}
      {!hasQuery && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SparklesIcon className="h-10 w-10 text-text-tertiary" />
          <p className="text-sm text-text-secondary">검색어를 입력하면 업무 일지에서 의미 기반 검색을 수행합니다</p>
          <p className="text-xs text-text-tertiary">예: &quot;배포 관련 작업&quot;, &quot;코드 리뷰&quot;, &quot;버그 수정&quot;</p>
        </div>
      )}

      {/* 로딩 (첫 요청) */}
      {hasQuery && isLoading && (
        <div className="flex flex-col gap-4">
          <SearchResultSkeleton />
          <SearchResultSkeleton />
          <SearchResultSkeleton />
        </div>
      )}

      {/* 에러 */}
      {hasQuery && error != null && (
        <ErrorMessage error={error} onRetry={hasQuery ? () => refetch() : undefined} />
      )}

      {/* 결과 없음 */}
      {hasQuery && !isLoading && !error && results != null && results.length === 0 && (
        <EmptyState
          message="검색 결과가 없습니다"
          description={hasActiveFilters ? '필터 조건을 변경하거나 다른 키워드로 시도해보세요' : '다른 키워드로 시도해보세요'}
        />
      )}

      {/* 결과 목록 */}
      {hasQuery && !error && hasResults && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              {results.length >= RESULT_LIMIT
                ? `최대 ${RESULT_LIMIT}건 표시`
                : `${results.length}건의 결과`}
            </p>
            <label className="flex items-center gap-1.5 text-xs text-text-tertiary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border-primary accent-brand-600"
              />
              디버그
            </label>
          </div>
          <div key={resultListKey} className={`flex flex-col gap-4 ${showRefetching ? 'opacity-60 transition-opacity' : ''}`}>
            {results.map((r, index) => (
              <div key={r.id} className="animate-stagger-up" style={{ animationDelay: `${index * 80}ms` }}>
                <SearchResultCard
                  platform={r.platform}
                  content={r.content}
                  targetDate={r.target_date}
                  score={r.score}
                  chunkResult={r.chunk_result}
                  chunkCount={r.chunk_count}
                  debugMode={debugMode}
                  onCopy={() => handleCopy(r.platform, r.content)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* 네이티브 date input의 텍스트를 숨기고 YYYY-MM-DD 또는 placeholder를 오버레이 */
function DateInput({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[8.5rem] rounded-lg border border-border-primary bg-surface px-2.5 text-xs transition-colors focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 focus:outline-none [color:transparent] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
      <span
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${
          value ? 'text-text-primary' : 'text-text-tertiary'
        }`}
      >
        {value || placeholder}
      </span>
    </div>
  );
}
