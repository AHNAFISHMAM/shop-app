import { useMemo } from 'react';

/**
 * PageSkeleton component props
 */
interface PageSkeletonProps {
  /** Whether to show title skeleton (default: true) */
  title?: boolean;
  /** Whether to show description skeleton (default: true) */
  description?: boolean;
  /** Whether to show content skeleton (default: true) */
  content?: boolean;
}

/**
 * Page Skeleton Component
 *
 * Generic loading skeleton for full pages.
 * Provides a consistent skeleton UI while page data is loading.
 *
 * Features:
 * - Configurable sections (title, description, content)
 * - Responsive grid layout
 * - Design system compliant (CSS variables)
 * - Accessibility compliant (ARIA)
 * - Performance optimized (memoized arrays)
 *
 * @example
 * ```tsx
 * <PageSkeleton title={true} description={true} content={true} />
 * ```
 */
export function PageSkeleton({ title = true, description = true, content = true }: PageSkeletonProps) {
  const contentItems = useMemo(() => [1, 2, 3, 4, 5, 6], []);

  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Loading page content">
      {/* Header skeleton */}
      {(title || description) && (
        <header className="space-y-4 text-center" aria-hidden="true">
          {title && (
            <div className="h-8 bg-[var(--bg-elevated)] rounded w-64 mx-auto" />
          )}
          {description && (
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-96 mx-auto" />
          )}
        </header>
      )}

      {/* Content skeleton */}
      {content && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
          {contentItems.map((i) => (
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

