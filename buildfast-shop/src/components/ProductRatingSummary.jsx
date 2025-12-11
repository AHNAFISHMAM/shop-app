import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import StarRating from './StarRating'
import { getProductRatingStats, getProductRatingDistribution } from '../lib/reviewsApi'
import { logger } from '../utils/logger'

/**
 * ProductRatingSummary Component
 *
 * Displays product rating summary including:
 * - Average rating
 * - Total review count
 * - Rating distribution (5-star breakdown)
 * - Write review button (conditional)
 *
 * @param {string} productId - Product or menu item ID
 * @param {('product'|'menu_item'|'all')} itemType - Catalog type
 * @param {boolean} showWriteButton - Whether to show "Write a Review" button
 * @param {Function} onWriteReview - Callback when write review button is clicked
 * @param {number} refreshTrigger - Trigger to refresh stats when reviews change
 */
function ProductRatingSummary({
  productId,
  itemType = 'product',
  showWriteButton = false,
  onWriteReview,
  refreshTrigger = 0
}) {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 })
  const [distribution, setDistribution] = useState([])
  const [loading, setLoading] = useState(true)

  const loadRatingData = useCallback(async () => {
    setLoading(true)

    logger.log('=== RATING SUMMARY: Loading rating data ===')
    logger.log('Product ID:', productId)
    logger.log('Item Type:', itemType)
    logger.log('Refresh trigger:', refreshTrigger)

    // Fetch stats and distribution in parallel
    const [statsResult, distributionResult] = await Promise.all([
      getProductRatingStats(productId),
      getProductRatingDistribution(productId)
    ])

    logger.log('=== RATING SUMMARY: Results ===')
    logger.log('Stats result:', statsResult)
    logger.log('Distribution result:', distributionResult)

    if (statsResult.success) {
      logger.log('Setting stats:', {
        averageRating: statsResult.averageRating,
        totalReviews: statsResult.totalReviews
      })
      setStats({
        averageRating: statsResult.averageRating,
        totalReviews: statsResult.totalReviews
      })
    } else {
      logger.error('Failed to load stats:', statsResult.error)
    }

    if (distributionResult.success) {
      logger.log('Setting distribution:', distributionResult.data)
      setDistribution(distributionResult.data)
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
      <div className="animate-pulse">
        <div className="h-6 bg-theme-elevated rounded w-48 mb-4"></div>
        <div className="h-4 bg-theme-elevated rounded w-32"></div>
      </div>
    )
  }

  return (
    <div 
      className="rounded-lg border border-theme p-6 shadow-sm"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(5, 5, 9, 0.95)'
      }}
    >
      {/* Header */}
      <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">Customer Reviews</h3>

      {/* Rating Summary */}
      <div className="text-center mb-6 pb-6 border-b border-theme">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-5xl font-bold text-[var(--text-main)]">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </span>
          <svg className="w-8 h-8 text-yellow-400 fill-current" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <div className="flex items-center justify-center mb-3">
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
          className="w-full mb-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-black rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer flex items-center justify-center gap-2 transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Write a Review
        </button>
      )}


      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <div className="space-y-2">
          {distribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium text-[var(--text-main)]">{item.rating}</span>
                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>

              <div className="flex-1 h-4 bg-theme-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
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
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </div>
  )
}

export default ProductRatingSummary

ProductRatingSummary.propTypes = {
  productId: PropTypes.string.isRequired,
  itemType: PropTypes.oneOf(['product', 'menu_item', 'all']),
  showWriteButton: PropTypes.bool,
  onWriteReview: PropTypes.func,
  refreshTrigger: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}
