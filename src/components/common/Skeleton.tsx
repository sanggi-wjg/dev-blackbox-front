export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 border-l-4 border-l-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
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

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
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
