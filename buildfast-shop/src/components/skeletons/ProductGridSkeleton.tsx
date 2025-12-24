import { useMemo } from 'react'
import { ProductCardSkeleton } from './ProductCardSkeleton'

/**
 * ProductGridSkeleton component props
 */
interface ProductGridSkeletonProps {
  /** Number of skeleton items to display (default: 6) */
  count?: number
  /** Number of columns (responsive) (default: 3) */
  cols?: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Product Grid Skeleton Component
 *
 * Loading skeleton for product grids.
 * Displays multiple ProductCardSkeleton components in a responsive grid.
 *
 * Features:
 * - Configurable count and columns
 * - Responsive grid layout
 * - Design system compliant (CSS variables)
 * - Accessibility compliant (ARIA)
 * - Performance optimized (memoized grid classes)
 *
 * @example
 * ```tsx
 * <ProductGridSkeleton count={8} cols={4} />
 * ```
 */
export function ProductGridSkeleton({ count = 6, cols = 3 }: ProductGridSkeletonProps) {
  const gridCols = useMemo(
    () => ({
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    }),
    []
  )

  const gridClass = useMemo(() => gridCols[cols] || gridCols[3], [cols, gridCols])

  const skeletonItems = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  return (
    <div
      className={`grid ${gridClass} gap-4 sm:gap-6`}
      role="status"
      aria-label={`Loading ${count} products`}
    >
      {skeletonItems.map(i => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
