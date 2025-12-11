/**
 * Product Card Skeleton
 * Loading placeholder for product cards
 */
export function ProductCardSkeleton() {
  return (
    <div className="card-soft space-y-4 animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-[var(--bg-elevated)] rounded-lg" />
      
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
      </div>
      
      {/* Price skeleton */}
      <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3" />
    </div>
  );
}

