/**
 * Product Grid Skeleton Component
 * Loading skeleton for product grids
 * @param {number} count - Number of skeleton items to display
 * @param {number} cols - Number of columns (responsive)
 */
import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductGridSkeleton({ count = 6, cols = 3 }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${gridCols[cols] || gridCols[3]} gap-4 sm:gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

