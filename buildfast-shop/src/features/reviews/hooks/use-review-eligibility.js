/**
 * useReviewEligibility Hook
 *
 * Custom hook for checking if a user can review a product.
 *
 * @returns {Object} Review eligibility and loading state
 *
 * @example
 * const { canReview, eligibility, loading } = useReviewEligibility(user, productId, reviewsEnabled);
 */

import { useState, useEffect } from 'react'
import { canUserReviewProduct } from '../../../lib/reviewsApi'
import { logger } from '../../../utils/logger'

/**
 * useReviewEligibility Hook
 *
 * Checks if a user can review a product.
 *
 * @param {Object} user - Current user
 * @param {string} productId - Product ID
 * @param {boolean} reviewsEnabled - Whether reviews are enabled
 * @returns {Object} Review eligibility and loading state
 */
export function useReviewEligibility(user, productId, reviewsEnabled = false) {
  const [canReview, setCanReview] = useState(false)
  const [eligibility, setEligibility] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !productId || !reviewsEnabled) {
      setCanReview(false)
      setEligibility(null)
      return
    }

    const checkEligibility = async () => {
      try {
        setLoading(true)
        const result = await canUserReviewProduct(user.id, productId)

        if (result.canReview) {
          setCanReview(true)
          setEligibility({
            orderId: result.orderId,
            orderItemId: result.orderItemId,
          })
        } else {
          setCanReview(false)
          setEligibility(null)
        }
      } catch (error) {
        logger.error('Error checking review eligibility:', error)
        setCanReview(false)
        setEligibility(null)
      } finally {
        setLoading(false)
      }
    }

    checkEligibility()
  }, [user, productId, reviewsEnabled])

  return {
    canReview,
    eligibility,
    loading,
  }
}
