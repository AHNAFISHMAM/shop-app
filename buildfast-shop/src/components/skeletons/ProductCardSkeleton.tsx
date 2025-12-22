/**
 * Product Card Skeleton Component
 *
 * Loading placeholder for product cards.
 * Provides a consistent skeleton UI while product data is loading.
 *
 * Features:
 * - Animated pulse effect
 * - Responsive design
 * - Design system compliant (CSS variables)
 * - Accessibility compliant (ARIA)
 */
export function ProductCardSkeleton() {
  return (
    <div className="card-soft space-y-4 animate-pulse" role="status" aria-label="Loading product card">
      {/* Image skeleton */}
      <div className="h-48 bg-[var(--bg-elevated)] rounded-lg" aria-hidden="true" />

      {/* Title skeleton */}
      <div className="space-y-2" aria-hidden="true">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
      </div>

      {/* Price skeleton */}
      <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3" aria-hidden="true" />
    </div>
  );
}

