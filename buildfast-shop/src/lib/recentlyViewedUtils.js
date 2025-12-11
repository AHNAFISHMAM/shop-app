/**
 * Utility functions for managing recently viewed products
 * Uses localStorage to persist viewed products across sessions
 */

import { logger } from '../utils/logger';

const STORAGE_KEY = 'recently_viewed_products'
const MAX_PRODUCTS = 15

/**
 * Get recently viewed products from localStorage
 * @returns {Array} Array of product objects with {productId, timestamp}
 */
export function getRecentlyViewed() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    // Validate data structure
    if (!Array.isArray(parsed)) {
      logger.warn('Invalid recently viewed data, resetting...')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return parsed
      .map((entry) => {
        if (typeof entry === 'string') {
          return {
            productId: entry,
            itemType: 'product',
            timestamp: Date.now()
          }
        }

        if (entry && typeof entry === 'object') {
          return {
            productId: entry.productId ?? entry.id,
            itemType: entry.itemType ?? 'product',
            timestamp: entry.timestamp ?? Date.now()
          }
        }

        return null
      })
      .filter((entry) => entry && entry.productId)
  } catch (err) {
    logger.error('Error reading recently viewed products:', err)
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

/**
 * Add a product to recently viewed list
 * @param {string} productId - The product ID to add
 */
export function addToRecentlyViewed(productId, itemType = 'product') {
  if (!productId) {
    logger.warn('Cannot add invalid product ID to recently viewed')
    return
  }

  try {
    // Get current list
    let recentlyViewed = getRecentlyViewed()

    // Remove product if it already exists (to avoid duplicates)
    recentlyViewed = recentlyViewed.filter(
      (item) => !(item.productId === productId && item.itemType === itemType)
    )

    // Add product to the front of the list
    recentlyViewed.unshift({
      productId: productId,
      itemType,
      timestamp: Date.now()
    })

    // Keep only the first MAX_PRODUCTS items
    if (recentlyViewed.length > MAX_PRODUCTS) {
      recentlyViewed = recentlyViewed.slice(0, MAX_PRODUCTS)
    }

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed))
  } catch (err) {
    logger.error('Error adding to recently viewed:', err)
  }
}

/**
 * Get array of product IDs only (for easy querying)
 * @returns {Array<string>} Array of product IDs
 */
export function getRecentlyViewedIds() {
  const recentlyViewed = getRecentlyViewed()
  return recentlyViewed.map(item => item.productId)
}

/**
 * Clear all recently viewed products
 * Useful for logout or reset
 */
export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    logger.error('Error clearing recently viewed:', err)
  }
}

/**
 * Remove a specific product from recently viewed
 * @param {string} productId - The product ID to remove
 */
export function removeFromRecentlyViewed(productId, itemType) {
  if (!productId) {
    return
  }

  try {
    let recentlyViewed = getRecentlyViewed()
    recentlyViewed = recentlyViewed.filter(item => {
      if (itemType) {
        return !(item.productId === productId && item.itemType === itemType)
      }
      return item.productId !== productId
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed))
  } catch (err) {
    logger.error('Error removing from recently viewed:', err)
  }
}
