export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-surface-tertiary ${className}`} />
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-primary border-l-4 border-l-surface-tertiary bg-surface shadow-xs">
      <div className="border-b border-border-primary px-5 py-3">
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex flex-col gap-3 px-5 py-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
