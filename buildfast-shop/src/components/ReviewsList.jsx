import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import StarRating from './StarRating'
import { fetchProductReviews } from '../lib/reviewsApi'
import { logger } from '../utils/logger'
import CustomDropdown from './ui/CustomDropdown'

/**
 * ReviewsList Component
 *
 * Displays a list of product reviews with pagination and sorting.
 *
 * @param {string} productId - Product or menu item ID
 * @param {('product'|'menu_item'|'all')} itemType - Catalog type for filtering
 * @param {Function} refreshTrigger - Trigger to refresh reviews (e.g., after new review)
 */
function ReviewsList({ productId, itemType = 'product', refreshTrigger = 0 }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState(new Set())

  const REVIEWS_PER_PAGE = 10

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

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

  const loadReviews = useCallback(async () => {
    setLoading(true)

    logger.log('=== REVIEWS LIST: Loading reviews ===')
    logger.log('Product ID:', productId)
    logger.log('Current page:', currentPage)
    logger.log('Sort by:', sortBy)
    logger.log('Refresh trigger:', refreshTrigger)
    logger.log('Item type:', itemType)

    const result = await fetchProductReviews(productId, {
      itemType,
      sortBy,
      limit: REVIEWS_PER_PAGE,
      offset: (currentPage - 1) * REVIEWS_PER_PAGE
    })

    logger.log('=== REVIEWS LIST: Load result ===')
    logger.log('Success:', result.success)
    logger.log('Data count:', result.data?.length || 0)
    logger.log('Reviews:', result.data)

    if (result.data && result.data.length > 0) {
      result.data.forEach((review, index) => {
        logger.log(`Review ${index + 1}:`, {
          id: review.id,
          rating: review.rating,
          has_text: !!review.review_text,
          images: review.review_images,
          image_count: review.review_images?.length || 0
        })
      })
    }

    if (result.success) {
      setReviews(result.data || [])
      setHasMore(result.count === REVIEWS_PER_PAGE)
    } else {
      logger.error('Failed to load reviews:', result.error)
      setReviews([])
    }

    setLoading(false)
  }, [currentPage, productId, refreshTrigger, sortBy, itemType])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const toggleExpanded = (reviewId) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  if (loading && currentPage === 1) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => {
          const skeletonBg = isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
          return (
            <div 
              key={i} 
              className="animate-pulse rounded-lg border border-theme p-6"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(255, 255, 255, 0.95)' 
                  : 'rgba(5, 5, 9, 0.95)'
              }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full" style={{ backgroundColor: skeletonBg }}></div>
                <div className="flex-1">
                  <div className="h-4 rounded w-32 mb-2" style={{ backgroundColor: skeletonBg }}></div>
                  <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: skeletonBg }}></div>
                  <div className="h-4 rounded w-3/4" style={{ backgroundColor: skeletonBg }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )
  }

  if (!loading && reviews.length === 0) {
    return (
      <div 
        className="rounded-lg border border-theme p-12 text-center"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)'
        }}
      >
        <svg className="mx-auto h-12 w-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <p className="mt-4 text-[var(--text-muted)]">No reviews yet</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-main)]">
          {reviews.length > 0 && `Showing ${reviews.length} reviews`}
        </h3>
        <div className="flex items-center gap-2">
          <label htmlFor="sortBy" className="text-sm text-[var(--text-muted)]">Sort by:</label>
          <CustomDropdown
            id="sortBy"
            name="sortBy"
            options={[
              { value: 'recent', label: 'Most Recent' },
              { value: 'highest', label: 'Highest Rating' },
              { value: 'lowest', label: 'Lowest Rating' }
            ]}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Most Recent"
            maxVisibleItems={5}
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id)
          const needsTruncation = review.review_text && review.review_text.length > 200

          return (
            <div 
              key={review.id} 
              className="rounded-lg border border-theme p-6 hover:shadow-sm transition"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(255, 255, 255, 0.95)' 
                  : 'rgba(5, 5, 9, 0.95)'
              }}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-[var(--text-main)] font-semibold text-lg">
                      {review.user_id ? review.user_id.substring(0, 1).toUpperCase() : 'A'}
                    </span>
                  </div>

                  {/* Reviewer Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--text-main)]">
                        {review.user_id ? `Customer ${review.user_id.substring(0, 8)}` : 'Anonymous Customer'}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>

                {/* Date */}
                <span className="text-sm text-[var(--text-muted)]">
                  {formatDate(review.created_at)}
                </span>
              </div>

              {/* Review Text */}
              {review.review_text && (
                <div className="mb-4">
                  <p className="text-[var(--text-main)] whitespace-pre-wrap">
                    {needsTruncation && !isExpanded
                      ? truncateText(review.review_text)
                      : review.review_text}
                  </p>
                  {needsTruncation && (
                    <button
                      onClick={() => toggleExpanded(review.id)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Review Images */}
              {review.review_images && review.review_images.length > 0 && (
                <div className="mt-4 bg-theme-elevated rounded-lg p-4 border border-theme">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-bold text-[var(--text-main)]">
                      Customer Photos ({review.review_images.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {review.review_images.map((imageUrl, index) => {
                      logger.log(`Review image ${index}:`, imageUrl)
                      return (
                        <div
                          key={index}
                          className="relative rounded-lg overflow-hidden border-2 border-theme hover:border-blue-500 transition-all cursor-pointer group shadow-md hover:shadow-xl"
                          style={{
                            backgroundColor: isLightTheme 
                              ? 'rgba(255, 255, 255, 0.95)' 
                              : 'rgba(5, 5, 9, 0.95)',
                            paddingBottom: '100%'
                          }}
                          onClick={() => window.open(imageUrl, '_blank')}
                        >
                          <img
                            src={imageUrl}
                            alt={`Customer photo ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover bg-theme-elevated group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onLoad={(e) => {
                              logger.log(`Image ${index} loaded successfully:`, imageUrl)
                              e.target.style.backgroundColor = 'transparent'
                            }}
                            onError={(e) => {
                              logger.error(`Image ${index} failed to load:`, imageUrl)
                              e.target.style.backgroundColor = '#fee2e2'
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage Error%3C/text%3E%3C/svg%3E'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <div 
                              className="backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1"
                              style={{
                                backgroundColor: isLightTheme 
                                  ? 'rgba(255, 255, 255, 0.95)' 
                                  : 'rgba(255, 255, 255, 0.9)'
                              }}
                            >
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              <span className="text-xs font-semibold text-[var(--text-main)]">View</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {(currentPage > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 border border-theme bg-theme-elevated text-[var(--text-main)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.04)' 
                : '';
            }}
          >
            Previous
          </button>

          <span className="text-sm text-[var(--text-muted)]">
            Page {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!hasMore || loading}
            className="px-4 py-2 border border-theme bg-theme-elevated text-[var(--text-main)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.04)' 
                : '';
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewsList

ReviewsList.propTypes = {
  productId: PropTypes.string.isRequired,
  itemType: PropTypes.oneOf(['product', 'menu_item', 'all']),
  refreshTrigger: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}
