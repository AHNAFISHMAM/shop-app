import { memo, useMemo } from 'react'
import { m } from 'framer-motion'
import { fadeSlideUp } from '../animations/menuAnimations'

interface ProductDetailSkeletonProps {
  isLightTheme: boolean
  prefersReducedMotion: boolean
}

const ProductDetailSkeleton = memo(
  ({ isLightTheme, prefersReducedMotion }: ProductDetailSkeletonProps) => {
    const skeletonBgColor = useMemo(() => {
      return isLightTheme ? 'var(--bg-hover)' : 'rgba(255, 255, 255, 0.05)'
    }, [isLightTheme])

    return (
      <m.main
        className="container mx-auto px-4 py-8 space-y-8"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate={prefersReducedMotion ? false : 'visible'}
        style={{ pointerEvents: 'auto' }}
        role="main"
        aria-label="Product detail page"
        aria-busy="true"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Skeleton */}
          <div className="space-y-4">
            <div
              className="aspect-square rounded-2xl animate-pulse"
              style={{ backgroundColor: skeletonBgColor }}
              aria-hidden="true"
            />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-lg animate-pulse"
                  style={{ backgroundColor: skeletonBgColor }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div
                className="h-8 w-3/4 rounded animate-pulse"
                style={{ backgroundColor: skeletonBgColor }}
                aria-hidden="true"
              />
              <div
                className="h-6 w-1/2 rounded animate-pulse"
                style={{ backgroundColor: skeletonBgColor }}
                aria-hidden="true"
              />
            </div>
            <div
              className="h-24 w-full rounded animate-pulse"
              style={{ backgroundColor: skeletonBgColor }}
              aria-hidden="true"
            />
            <div className="space-y-2">
              <div
                className="h-10 w-32 rounded animate-pulse"
                style={{ backgroundColor: skeletonBgColor }}
                aria-hidden="true"
              />
              <div
                className="h-12 w-full rounded animate-pulse"
                style={{ backgroundColor: skeletonBgColor }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </m.main>
    )
  }
)

ProductDetailSkeleton.displayName = 'ProductDetailSkeleton'

export default ProductDetailSkeleton
