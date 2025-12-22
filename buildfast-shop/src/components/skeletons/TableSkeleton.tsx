import { useMemo } from 'react';

/**
 * TableSkeleton component props
 */
interface TableSkeletonProps {
  /** Number of rows to display (default: 5) */
  rows?: number;
  /** Number of columns to display (default: 4) */
  cols?: number;
}

/**
 * Table Skeleton Component
 *
 * Loading placeholder for data tables.
 * Displays animated skeleton rows and columns.
 *
 * Features:
 * - Configurable rows and columns
 * - Staggered animation delays
 * - Design system compliant (CSS variables)
 * - Accessibility compliant (ARIA)
 * - Performance optimized (memoized arrays)
 *
 * @example
 * ```tsx
 * <TableSkeleton rows={10} cols={5} />
 * ```
 */
export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  const rowArray = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);
  const colArray = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols]);

  return (
    <div className="space-y-3" role="status" aria-label={`Loading table with ${rows} rows and ${cols} columns`}>
      {rowArray.map((i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          {colArray.map((j) => (
            <div
              key={j}
              className="h-12 bg-[var(--bg-elevated)] rounded flex-1 min-h-[44px]"
              style={{
                animationDelay: `${(i * cols + j) * 50}ms`
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

