/**
 * Page Skeleton Component
 * Generic loading skeleton for full pages
 */
export function PageSkeleton({ title = true, description = true, content = true }) {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      {(title || description) && (
        <div className="space-y-4 text-center">
          {title && (
            <div className="h-8 bg-[var(--bg-elevated)] rounded w-64 mx-auto" />
          )}
          {description && (
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-96 mx-auto" />
          )}
        </div>
      )}
      
      {/* Content skeleton */}
      {content && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-48 bg-[var(--bg-elevated)] rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
              </div>
              <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

