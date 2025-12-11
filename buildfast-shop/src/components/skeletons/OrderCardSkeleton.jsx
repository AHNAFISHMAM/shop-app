/**
 * Order Card Skeleton
 * Loading placeholder for order cards
 */
export function OrderCardSkeleton() {
  return (
    <div className="card-soft space-y-4 animate-pulse p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3" />
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/4" />
        </div>
        <div className="h-6 bg-[var(--bg-elevated)] rounded w-20" />
      </div>
      
      {/* Items */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-16 w-16 bg-[var(--bg-elevated)] rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
              <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex justify-between pt-4 border-t border-[var(--border-default)]">
        <div className="h-5 bg-[var(--bg-elevated)] rounded w-24" />
        <div className="h-5 bg-[var(--bg-elevated)] rounded w-32" />
      </div>
    </div>
  );
}

