import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useSearchPlatformWorkLogsApiV1SearchGet } from '@/api/generated/search/search';
import { useDebounce } from '@/hooks/useDebounce';
import SearchResultCard from '@/components/search/SearchResultCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { SearchResultSkeleton } from '@/components/common/Skeleton';
import Card from '@/components/common/Card';
import { useToast } from '@/components/common/Toast';
import { MagnifyingGlassIcon, XMarkIcon, SparklesIcon } from '@/components/icons';
import { PLATFORM_LABELS } from '@/utils/platform';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // 로컬 입력 상태 (IME 조합 중에도 안전)
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(inputValue, 300);
  const { toast } = useToast();

  // 디바운스된 값이 바뀔 때만 URL 동기화
  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    if (debouncedQuery !== currentQ) {
      setSearchParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true });
    }
  }, [debouncedQuery, searchParams, setSearchParams]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSearchPlatformWorkLogsApiV1SearchGet(
    { query: debouncedQuery, limit: 20 },
    { query: { enabled: debouncedQuery.length >= 1 } },
  );

  const results = data?.results;

  const handleQueryChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleCopy = (platform: string, content: string) => {
    const label = PLATFORM_LABELS[platform] ?? platform;
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

      {/* Control bar — sticky 검색 입력 */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pb-4 md:-mx-4 md:px-4 lg:-mx-5 lg:px-5 bg-surface-secondary">
        <Card padding="sm">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="검색어를 입력하세요..."
              autoFocus
              className="h-9 w-full rounded-lg border border-border-primary bg-surface pl-9 pr-9 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:ring-2 focus:outline-none focus:border-border-focus focus:ring-brand-500/20"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                title="검색어 지우기"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* 재요청 로딩 인디케이터 */}
      {showRefetching && (
        <div className="mb-4 h-0.5 overflow-hidden rounded-full bg-surface-tertiary">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-500" />
        </div>
      )}

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
      {hasQuery && error != null && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {/* 결과 없음 */}
      {hasQuery && !isLoading && !error && results != null && results.length === 0 && (
        <EmptyState
          message="검색 결과가 없습니다"
          description="다른 키워드로 시도해보세요"
        />
      )}

      {/* 결과 목록 */}
      {hasQuery && hasResults && (
        <div>
          <p className="mb-3 text-xs text-text-tertiary">
            {results.length}건의 결과
          </p>
          <div key={resultListKey} className={`flex flex-col gap-4 ${showRefetching ? 'opacity-60 transition-opacity' : ''}`}>
            {results.map((r, index) => (
              <div key={r.id} className="animate-stagger-up" style={{ animationDelay: `${index * 80}ms` }}>
                <SearchResultCard
                  platform={r.platform}
                  content={r.content}
                  targetDate={r.target_date}
                  score={r.score}
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
