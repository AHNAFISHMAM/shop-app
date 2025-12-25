import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Skeleton Component
 *
 * Loading placeholder that improves perceived performance.
 * Based on UX best practices:
 * - Shows content structure while loading
 * - Reduces layout shift
 * - Improves perceived performance
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`bg-[var(--bg-skeleton)] ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

/**
 * CardSkeleton Component
 *
 * Pre-configured skeleton for product cards
 */
export const CardSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-48 w-full" variant="rectangular" />
    <Skeleton className="h-6 w-3/4" variant="text" />
    <Skeleton className="h-4 w-full" variant="text" />
    <Skeleton className="h-10 w-1/2" variant="rectangular" />
  </div>
)

/**
 * FormSkeleton Component
 *
 * Pre-configured skeleton for forms
 */
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" variant="text" />
      <Skeleton className="h-12 w-full" variant="rectangular" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" variant="text" />
      <Skeleton className="h-12 w-full" variant="rectangular" />
    </div>
    <Skeleton className="h-12 w-full" variant="rectangular" />
  </div>
)

/**
 * ListSkeleton Component
 *
 * Pre-configured skeleton for lists
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-12 w-12" variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-3 w-1/2" variant="text" />
        </div>
      </div>
    ))}
  </div>
)

export default Skeleton
