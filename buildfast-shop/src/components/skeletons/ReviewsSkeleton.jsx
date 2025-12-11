/**
 * Reviews Skeleton
 * Loading placeholder for reviews list
 */
export function ReviewsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-soft space-y-4 animate-pulse p-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[var(--bg-elevated)] rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/3" />
              <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/4" />
            </div>
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-16" />
          </div>
          
          {/* Rating */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-5 w-5 bg-[var(--bg-elevated)] rounded" />
            ))}
          </div>
          
          {/* Review text */}
          <div className="space-y-2">
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-5/6" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

