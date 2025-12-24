import { useState, useEffect, useCallback } from 'react'
import StarRating from './StarRating'
import { getProductRatingStats, getProductRatingDistribution } from '../lib/reviewsApi'
import { logger } from '../utils/logger'

/**
 * RatingDistributionItem interface
 */
interface RatingDistributionItem {
  rating: number
  count: number
  percentage: number
}

/**
 * ProductRatingSummaryProps interface
 */
export interface ProductRatingSummaryProps {
  productId: string
  itemType?: 'product' | 'menu_item' | 'all'
  showWriteButton?: boolean
  onWriteReview?: () => void
  refreshTrigger?: number | string
}

/**
 * ProductRatingSummary Component
 *
 * Displays product rating summary including:
 * - Average rating
 * - Total review count
 * - Rating distribution (5-star breakdown)
 * - Write review button (conditional)
 *
 * @param {ProductRatingSummaryProps} props - Component props
 */
function ProductRatingSummary({
  productId,
  itemType = 'product',
  showWriteButton = false,
  onWriteReview,
  refreshTrigger = 0,
}: ProductRatingSummaryProps) {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const [stats, setStats] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0,
  })
  const [distribution, setDistribution] = useState<RatingDistributionItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadRatingData = useCallback(async () => {
    setLoading(true)

    logger.log('=== RATING SUMMARY: Loading rating data ===')
    logger.log('Product ID:', productId)
    logger.log('Item Type:', itemType)
    logger.log('Refresh trigger:', refreshTrigger)

    // Fetch stats and distribution in parallel
    const [statsResult, distributionResult] = await Promise.all([
      getProductRatingStats(productId),
      getProductRatingDistribution(productId),
    ])

    logger.log('=== RATING SUMMARY: Results ===')
    logger.log('Stats result:', statsResult)
    logger.log('Distribution result:', distributionResult)

    if (statsResult.success) {
      logger.log('Setting stats:', {
        averageRating: statsResult.averageRating,
        totalReviews: statsResult.totalReviews,
      })
      setStats({
        averageRating: statsResult.averageRating ?? 0,
        totalReviews: statsResult.totalReviews ?? 0,
      })
    } else {
      logger.error('Failed to load stats:', statsResult.error)
    }

    if (distributionResult.success) {
      logger.log('Setting distribution:', distributionResult.distribution)
      const dist = (distributionResult.distribution ?? distributionResult.data ?? {}) as Record<number, number>
      // Convert Record<number, number> to RatingDistributionItem[]
      const total = Object.values(dist).reduce((sum, count) => sum + (count ?? 0), 0)
      const distributionArray: RatingDistributionItem[] = [5, 4, 3, 2, 1].map(rating => {
        const count = (dist[rating] as number | undefined) ?? 0
        return {
          rating,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      })
      setDistribution(distributionArray)
    } else {
      logger.error('Failed to load distribution:', distributionResult.error)
    }

    setLoading(false)
  }, [productId, refreshTrigger, itemType])

  useEffect(() => {
    loadRatingData()
  }, [loadRatingData])

  if (loading) {
    return (
      <div className="animate-pulse" role="status" aria-label="Loading rating summary">
        <div className="h-6 bg-[var(--bg-elevated)] rounded w-48 mb-4" aria-hidden="true"></div>
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-32" aria-hidden="true"></div>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border border-[var(--border-default)] p-6 shadow-sm"
      style={{
        backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
      }}
      role="region"
      aria-label="Product rating summary"
    >
      {/* Header */}
      <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">Customer Reviews</h3>

      {/* Rating Summary */}
      <div className="text-center mb-6 pb-6 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className="text-5xl font-bold text-[var(--text-main)]"
            aria-label={`Average rating: ${stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'} out of 5`}
          >
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </span>
          <svg
            className="w-8 h-8 text-[var(--color-amber)] fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <div
          className="flex items-center justify-center mb-3"
          aria-label={`${stats.averageRating} star rating`}
        >
          <StarRating rating={stats.averageRating} size="md" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Write Review Button */}
      {showWriteButton && (
        <button
          onClick={onWriteReview}
          className="w-full mb-6 px-6 py-3 min-h-[44px] bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-blue)]/90 text-black rounded-lg hover:from-[var(--color-blue)]/90 hover:to-[var(--color-blue)]/80 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer flex items-center justify-center gap-2 transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label="Write a review"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Write a Review
        </button>
      )}

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <div className="space-y-2" role="list" aria-label="Rating distribution">
          {distribution.map(item => (
            <div key={item.rating} className="flex items-center gap-3" role="listitem">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium text-[var(--text-main)]">{item.rating}</span>
                <svg
                  className="w-4 h-4 text-[var(--color-amber)] fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>

              <div
                className="flex-1 h-4 bg-[var(--bg-elevated)] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={item.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.percentage}% of reviews are ${item.rating} stars`}
              >
                <div
                  className="h-full bg-[var(--color-amber)] transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>

              <span className="text-sm text-[var(--text-muted)] w-12 text-right">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}

      {stats.totalReviews === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4" role="status">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </div>
  )
}

export default ProductRatingSummary
