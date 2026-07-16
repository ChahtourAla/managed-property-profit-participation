import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4 flex-1', j === 0 && 'max-w-[180px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-center justify-between pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-24 pb-2" />
      <div className="flex h-10 items-end gap-1.5 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + i * 8}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border p-6', className)}>
      <div className="flex items-center justify-between pb-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <Skeleton className="h-[260px] w-full rounded-lg" />
    </div>
  );
}
