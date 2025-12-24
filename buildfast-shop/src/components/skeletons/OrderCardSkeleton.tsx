/**
 * Order Card Skeleton Component
 *
 * Loading placeholder for order cards.
 * Provides a consistent skeleton UI while order data is loading.
 *
 * Features:
 * - Animated pulse effect
 * - Responsive design
 * - Design system compliant (CSS variables)
 * - Accessibility compliant (ARIA)
 */
export function OrderCardSkeleton() {
  return (
    <div
      className="card-soft space-y-4 animate-pulse p-6"
      role="status"
      aria-label="Loading order card"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3" aria-hidden="true" />
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/4" aria-hidden="true" />
        </div>
        <div
          className="h-6 bg-[var(--bg-elevated)] rounded w-20 min-h-[44px] min-w-[44px]"
          aria-hidden="true"
        />
      </div>

      {/* Items */}
      <div className="space-y-3" aria-hidden="true">
        {[1, 2].map(i => (
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
      <div
        className="flex justify-between pt-4 border-t border-[var(--border-default)]"
        aria-hidden="true"
      >
        <div className="h-5 bg-[var(--bg-elevated)] rounded w-24" />
        <div className="h-5 bg-[var(--bg-elevated)] rounded w-32" />
      </div>
    </div>
  )
}
