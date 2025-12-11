import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Fetch reviews for a product
 * @param {string} productId - The product ID
 * @param {Object} options - Query options
 * @param {string} options.sortBy - Sort order: 'recent', 'highest', 'lowest'
 * @param {number} options.limit - Number of reviews to fetch
 * @param {number} options.offset - Offset for pagination
 * @returns {Object} Result object with reviews data
 */
export async function fetchProductReviews(itemId, {
  itemType = 'product',
  sortBy = 'recent',
  limit = 10,
  offset = 0,
  source
} = {}) {
  try {
    logger.log('=== FETCHING PRODUCT REVIEWS ===')
    logger.log('Item ID:', itemId)
    logger.log('Item Type:', itemType)
    logger.log('Sort:', sortBy, 'Limit:', limit, 'Offset:', offset)

    let query = supabase
      .from('product_reviews')
      .select('*')
      .eq('is_hidden', false)

    if (itemType === 'menu_item') {
      query = query.eq('menu_item_id', itemId)
    } else if (itemType === 'all') {
      query = query.or(`product_id.eq.${itemId},menu_item_id.eq.${itemId}`)
    } else {
      query = query.eq('product_id', itemId)
    }

    if (source) {
      query = query.eq('source', source)
    }

    // Apply sorting
    switch (sortBy) {
      case 'highest':
        query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'lowest':
        query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    logger.log('Query result:', { data, error })

    if (error) {
      logger.error('Supabase error fetching reviews:', error)
      throw error
    }

    logger.log(`Found ${data?.length || 0} reviews for item ${itemId}`)

    return { success: true, data, count: data?.length || 0 }
  } catch (error) {
    logger.error('Error fetching reviews:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get average rating and count for a product
 * @param {string} productId - The product ID
 * @returns {Object} Result with average rating and count
 */
export async function getProductRatingStats(itemId) {
  try {
    logger.log('=== GET PRODUCT RATING STATS ===')
    logger.log('Item ID:', itemId)

    // Use RPC function for average rating
    const { data: avgData, error: avgError } = await supabase
      .rpc('get_product_average_rating', { p_product_id: itemId })

    logger.log('Average rating RPC result:', { avgData, avgError })

    if (avgError) throw avgError

    // Use RPC function for review count
    const { data: countData, error: countError } = await supabase
      .rpc('get_product_review_count', { p_product_id: itemId })

    logger.log('Review count RPC result:', { countData, countError })

    if (countError) throw countError

    const result = {
      success: true,
      averageRating: avgData || 0,
      totalReviews: countData || 0
    }

    logger.log('Rating stats result:', result)

    return result
  } catch (error) {
    logger.error('Error fetching rating stats:', error)
    return { success: false, averageRating: 0, totalReviews: 0, error }
  }
}

/**
 * Get rating distribution for a product
 * @param {string} productId - The product ID
 * @returns {Object} Result with rating distribution
 */
export async function getProductRatingDistribution(itemId) {
  try {
    const { data, error } = await supabase
      .rpc('get_product_rating_distribution', { p_product_id: itemId })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    logger.error('Error fetching rating distribution:', error)
    return { success: false, data: [], error }
  }
}

/**
 * Check if user can review a product (has purchased it and hasn't reviewed it yet)
 * @param {string} productId - The product ID
 * @param {string} userId - The user ID
 * @returns {Object} Result with eligibility info
 */
export async function canUserReviewProduct(productId, userId) {
  try {
    const { data, error } = await supabase
      .rpc('verify_user_purchased_product', {
        p_user_id: userId,
        p_product_id: productId
      })

    if (error) throw error

    const canReview = data && data.length > 0
    return {
      success: true,
      canReview,
      orderItemId: canReview ? data[0].order_item_id : null,
      orderId: canReview ? data[0].order_id : null
    }
  } catch (error) {
    logger.error('Error checking review eligibility:', error)
    return { success: false, canReview: false, error }
  }
}

/**
 * Create a new review
 * @param {Object} reviewData - The review data
 * @param {string} reviewData.productId - Legacy product ID
 * @param {string} reviewData.menuItemId - Menu item ID (for menu catalog)
 * @param {('product'|'menu_item'|'all')} reviewData.itemType - Catalog type
 * @param {string} reviewData.userId - User ID
 * @param {string} reviewData.orderId - Order ID
 * @param {string} reviewData.orderItemId - Order item ID
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.reviewText - Review text (optional)
 * @param {Array<string>} reviewData.reviewImages - Array of image URLs (optional)
 * @returns {Object} Result object with created review
 */
export async function createReview({
  productId,
  menuItemId,
  itemType = 'product',
  userId,
  orderId,
  orderItemId,
  rating,
  reviewText = '',
  reviewImages = [],
  source = 'purchase',
  favoriteIsGeneral = false,
  favoriteTargetLabel = null
}) {
  try {
    logger.log('=== CREATE REVIEW API CALL ===')
    logger.log('Inserting review data:', {
      product_id: productId,
      menu_item_id: menuItemId,
      item_type: itemType,
      user_id: userId,
      order_id: orderId,
      order_item_id: orderItemId,
      rating,
      review_text: reviewText,
      review_images: reviewImages,
      is_verified_purchase: true
    })

    if (source === 'purchase' && (!rating || !orderId || !orderItemId)) {
      throw new Error('Purchase reviews require rating, orderId, and orderItemId.')
    }

    const isMenuItem = itemType === 'menu_item'
    const resolvedProductId = source === 'favorite' ? null : (isMenuItem ? null : productId)
    const resolvedMenuItemId = isMenuItem
      ? (menuItemId || productId)
      : (menuItemId || null)

    const payload = {
      product_id: resolvedProductId,
      menu_item_id: resolvedMenuItemId,
      user_id: userId,
      order_id: source === 'purchase' ? orderId : null,
      order_item_id: source === 'purchase' ? orderItemId : null,
      rating: rating ?? null,
      review_text: reviewText,
      review_images: reviewImages,
      is_verified_purchase: source === 'purchase',
      source,
      favorite_is_general: source === 'favorite' ? favoriteIsGeneral : false,
      favorite_target_label: source === 'favorite' ? favoriteTargetLabel : null
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .insert(payload)
      .select()
      .single()

    if (error) {
      logger.error('=== SUPABASE INSERT ERROR ===')
      logger.error('Error code:', error.code)
      logger.error('Error message:', error.message)
      logger.error('Error details:', error.details)
      logger.error('Error hint:', error.hint)
      logger.error('Full error:', error)

      // Check for duplicate review error
      if (error.code === '23505') {
        return {
          success: false,
          alreadyExists: true,
          message: 'You have already reviewed this product from this purchase',
          error
        }
      }

      // Check for table not found
      if (error.code === '42P01') {
        return {
          success: false,
          tableMissing: true,
          message: 'Reviews table not found. Please contact support to set up the database.',
          error
        }
      }

      // Check for RLS policy violation
      if (error.code === '42501') {
        return {
          success: false,
          permissionDenied: true,
          message: 'You do not have permission to review this product. Only verified purchasers can leave reviews.',
          error
        }
      }

      throw error
    }

    logger.log('=== REVIEW CREATED SUCCESSFULLY ===')
    logger.log('Created review:', data)
    return { success: true, data }
  } catch (error) {
    logger.error('=== UNEXPECTED ERROR IN createReview ===')
    logger.error('Error:', error)
    logger.error('Error name:', error.name)
    logger.error('Error message:', error.message)
    logger.error('Error stack:', error.stack)
    return { success: false, error, message: error.message || 'Unknown error occurred' }
  }
}

/**
 * Update an existing review
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Fields to update
 * @param {number} updates.rating - New rating (optional)
 * @param {string} updates.reviewText - New review text (optional)
 * @param {Array<string>} updates.reviewImages - New images (optional)
 * @returns {Object} Result object with updated review
 */
export async function updateReview(reviewId, { rating, reviewText, reviewImages }) {
  try {
    const updates = {}
    if (rating !== undefined) updates.rating = rating
    if (reviewText !== undefined) updates.review_text = reviewText
    if (reviewImages !== undefined) updates.review_images = reviewImages

    const { data, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error updating review:', error)
    return { success: false, error }
  }
}

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Object} Result object
 */
export async function deleteReview(reviewId) {
  try {
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    logger.error('Error deleting review:', error)
    return { success: false, error }
  }
}

/**
 * Upload review image to Supabase storage
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID
 * @returns {Object} Result with image URL
 */
export async function uploadReviewImage(file, userId) {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: new Error('No file provided') }
    }

    // Check file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { success: false, error: new Error('File too large. Maximum size is 5MB.') }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('review-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      // Check if bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return {
          success: false,
          error: new Error('Image storage not configured. Please contact support.'),
          bucketMissing: true
        }
      }
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('review-images')
      .getPublicUrl(data.path)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    logger.error('Error uploading review image:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload image',
      bucketMissing: error.message?.includes('Bucket') || error.message?.includes('not found')
    }
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Fetch all reviews (admin only)
 * @param {Object} options - Query options
 * @param {string} options.filter - Filter: 'all', 'visible', 'hidden'
 * @param {string} options.sortBy - Sort order
 * @param {number} options.limit - Number of reviews to fetch
 * @param {number} options.offset - Offset for pagination
 * @returns {Object} Result object with reviews data
 */
export async function fetchAllReviews({ filter = 'all', sortBy = 'recent', limit = 20, offset = 0, source } = {}) {
  try {
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        products (
          name,
          images
        ),
        menu_items (
          name,
          image_url,
          price
        )
      `)

    // Apply filter
    if (filter === 'visible') {
      query = query.eq('is_hidden', false)
    } else if (filter === 'hidden') {
      query = query.eq('is_hidden', true)
    }

    if (source) {
      query = query.eq('source', source)
    }

    // Apply sorting
    switch (sortBy) {
      case 'highest':
        query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'lowest':
        query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching reviews:', error)
      throw error
    }

    // Get user emails separately using RPC or by fetching from a view
    // For now, we'll just return the data without user emails
    // User IDs are still available in the data
    return { success: true, data, count: data?.length || 0 }
  } catch (error) {
    logger.error('Error fetching all reviews:', error)
    return { success: false, error, data: [], message: error.message }
  }
}

function getTimeframeStart(timeframe) {
  const now = new Date()
  if (timeframe === 'current') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (timeframe === 'last-90') {
    const start = new Date(now)
    start.setDate(now.getDate() - 90)
    return start
  }
  return null
}

export async function fetchUserFavoriteReviews({ userId, timeframe = 'current' } = {}) {
  try {
    const start = getTimeframeStart(timeframe)

    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        menu_items (
          id,
          name,
          image_url,
          price,
          currency
        )
      `)
      .eq('user_id', userId)
      .eq('source', 'favorite')
      .order('created_at', { ascending: false })

    if (start) {
      query = query.gte('created_at', start.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: data?.length || 0
    }
  } catch (error) {
    logger.error('Error fetching user favorite reviews:', error)
    return { success: false, error, data: [] }
  }
}

export async function fetchAdminFavoriteReviews({ timeframe = 'current', limit = 500 } = {}) {
  try {
    const start = getTimeframeStart(timeframe)

    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        menu_items (
          id,
          name,
          image_url
        )
      `)
      .eq('source', 'favorite')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (start) {
      query = query.gte('created_at', start.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    const rows = data || []
    const stats = {
      total: rows.length,
      timeframeCount: rows.length,
      uniqueUsers: new Set(rows.map(row => row.user_id)).size
    }

    return { success: true, data: rows, stats }
  } catch (error) {
    logger.error('Error fetching favorite reviews (admin):', error)
    return { success: false, error, data: [], stats: { total: 0, timeframeCount: 0, uniqueUsers: 0 } }
  }
}

/**
 * Hide a review (admin only)
 * @param {string} reviewId - Review ID
 * @returns {Object} Result object
 */
export async function hideReview(reviewId) {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .update({ is_hidden: true })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error hiding review:', error)
    return { success: false, error }
  }
}

/**
 * Unhide a review (admin only)
 * @param {string} reviewId - Review ID
 * @returns {Object} Result object
 */
export async function unhideReview(reviewId) {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .update({ is_hidden: false })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error unhiding review:', error)
    return { success: false, error }
  }
}
