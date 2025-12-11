import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Validate a discount code
 *
 * NOTE: This validation is not atomic. Race conditions are prevented by database constraints:
 * - One-per-customer: UNIQUE(discount_code_id, user_id) in discount_code_usage
 * - Usage limit: CHECK(usage_count <= usage_limit) in discount_codes
 *
 * If a race condition occurs, applyDiscountCodeToOrder() will fail with a constraint error.
 * Always check the result of applyDiscountCodeToOrder() and handle constraint violations.
 *
 * @param {string} code - The discount code to validate
 * @param {string} userId - The user ID
 * @param {number} orderTotal - The order total before discount
 * @returns {Object} Validation result with discount details or error
 */
export async function validateDiscountCode(code, userId, orderTotal) {
  try {
    const upperCode = code.toUpperCase().trim()

    // Fetch the discount code
    const { data: discountCode, error: fetchError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .single()

    if (fetchError || !discountCode) {
      return {
        valid: false,
        error: 'Invalid discount code',
        message: 'This discount code does not exist or is not active.'
      }
    }

    // Check if code has expired
    if (discountCode.expires_at) {
      const expirationDate = new Date(discountCode.expires_at)
      const now = new Date()
      if (now > expirationDate) {
        return {
          valid: false,
          error: 'Expired code',
          message: 'This discount code has expired.'
        }
      }
    }

    // Check if code has started
    if (discountCode.starts_at) {
      const startDate = new Date(discountCode.starts_at)
      const now = new Date()
      if (now < startDate) {
        return {
          valid: false,
          error: 'Code not started',
          message: 'This discount code is not yet active.'
        }
      }
    }

    // Check minimum order amount
    if (discountCode.min_order_amount && orderTotal < discountCode.min_order_amount) {
      return {
        valid: false,
        error: 'Minimum order not met',
        message: `Minimum order amount of $${parseFloat(discountCode.min_order_amount).toFixed(2)} required.`
      }
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return {
        valid: false,
        error: 'Usage limit reached',
        message: 'This discount code has reached its usage limit.'
      }
    }

    // Check if user has already used this code (if one_per_customer is true)
    if (discountCode.one_per_customer) {
      const { data: previousUsage, error: usageError } = await supabase
        .from('discount_code_usage')
        .select('id')
        .eq('discount_code_id', discountCode.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (usageError && usageError.code !== 'PGRST116') {
        logger.error('Error checking code usage:', usageError)
      }

      if (previousUsage) {
        return {
          valid: false,
          error: 'Already used',
          message: 'You have already used this discount code.'
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (orderTotal * discountCode.discount_value) / 100

      // Apply max discount limit if set
      if (discountCode.max_discount_amount && discountAmount > discountCode.max_discount_amount) {
        discountAmount = discountCode.max_discount_amount
      }
    } else if (discountCode.discount_type === 'fixed') {
      discountAmount = discountCode.discount_value

      // Discount can't exceed order total
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal
      }
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    return {
      valid: true,
      discountCode: discountCode,
      discountAmount: discountAmount,
      finalTotal: orderTotal - discountAmount
    }
  } catch (error) {
    logger.error('Error validating discount code:', error)
    return {
      valid: false,
      error: 'Validation error',
      message: 'Failed to validate discount code. Please try again.'
    }
  }
}

/**
 * Apply a discount code to an order (called after order is created)
 * @param {string} discountCodeId - The discount code ID
 * @param {string} userId - The user ID
 * @param {string} orderId - The order ID
 * @param {number} discountAmount - The discount amount
 * @param {number} orderTotal - The order total
 * @returns {Object} Success status
 */
export async function applyDiscountCodeToOrder(discountCodeId, userId, orderId, discountAmount, orderTotal) {
  try {
    // Record the usage (atomic operation with database constraints)
    const { error: usageError } = await supabase
      .from('discount_code_usage')
      .insert({
        discount_code_id: discountCodeId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
        order_total: orderTotal
      })

    if (usageError) {
      logger.error('Error recording discount code usage:', usageError)

      // Handle specific constraint violations (race condition protection)
      if (usageError.code === '23505') {
        // Unique constraint violation - user already used this code
        return {
          success: false,
          error: usageError,
          message: 'You have already used this discount code.',
          errorType: 'duplicate_usage'
        }
      }

      if (usageError.code === '23514' || usageError.message?.includes('usage_count_within_limit')) {
        // Check constraint violation - usage limit reached between validation and application
        return {
          success: false,
          error: usageError,
          message: 'This discount code has reached its usage limit.',
          errorType: 'usage_limit_reached'
        }
      }

      return { success: false, error: usageError }
    }

    return { success: true }
  } catch (error) {
    logger.error('Error applying discount code:', error)
    return { success: false, error }
  }
}

/**
 * Get all discount codes (Admin only)
 * @returns {Array} List of discount codes
 */
export async function getAllDiscountCodes() {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    logger.error('Error fetching discount codes:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Create a discount code (Admin only)
 * @param {Object} codeData - Discount code data
 * @returns {Object} Created discount code
 */
export async function createDiscountCode(codeData) {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: codeData.code.toUpperCase().trim(),
        description: codeData.description || null,
        discount_type: codeData.discount_type,
        discount_value: codeData.discount_value,
        min_order_amount: codeData.min_order_amount || 0,
        max_discount_amount: codeData.max_discount_amount || null,
        starts_at: codeData.starts_at || new Date().toISOString(),
        expires_at: codeData.expires_at || null,
        usage_limit: codeData.usage_limit || null,
        one_per_customer: codeData.one_per_customer !== false,
        is_active: codeData.is_active !== false,
        created_by: codeData.created_by
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error creating discount code:', error)
    return { success: false, error }
  }
}

/**
 * Update a discount code (Admin only)
 * @param {string} id - Discount code ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated discount code
 */
export async function updateDiscountCode(id, updates) {
  try {
    // If code is being updated, make it uppercase
    if (updates.code) {
      updates.code = updates.code.toUpperCase().trim()
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error updating discount code:', error)
    return { success: false, error }
  }
}

/**
 * Delete a discount code (Admin only)
 * @param {string} id - Discount code ID
 * @returns {Object} Success status
 */
export async function deleteDiscountCode(id) {
  try {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    logger.error('Error deleting discount code:', error)
    return { success: false, error }
  }
}

/**
 * Get discount code usage statistics (Admin only)
 * @param {string} discountCodeId - Discount code ID
 * @returns {Object} Usage statistics
 */
export async function getDiscountCodeUsageStats(discountCodeId) {
  try {
    const { data, error } = await supabase
      .from('discount_code_usage')
      .select('*, orders(id, created_at, order_total)')
      .eq('discount_code_id', discountCodeId)
      .order('used_at', { ascending: false })

    if (error) throw error

    const totalRevenue = (data || []).reduce((sum, usage) => sum + parseFloat(usage.order_total || 0), 0)
    const totalDiscount = (data || []).reduce((sum, usage) => sum + parseFloat(usage.discount_amount || 0), 0)

    return {
      success: true,
      data: {
        usage_count: data?.length || 0,
        total_revenue: totalRevenue,
        total_discount: totalDiscount,
        usage_history: data || []
      }
    }
  } catch (error) {
    logger.error('Error fetching usage stats:', error)
    return { success: false, error }
  }
}

/**
 * Format discount display text
 * @param {Object} discountCode - Discount code object
 * @returns {string} Formatted discount text
 */
export function formatDiscountDisplay(discountCode) {
  if (!discountCode) return ''

  if (discountCode.discount_type === 'percentage') {
    let text = `${discountCode.discount_value}% off`
    if (discountCode.max_discount_amount) {
      text += ` (max $${parseFloat(discountCode.max_discount_amount).toFixed(2)})`
    }
    return text
  } else if (discountCode.discount_type === 'fixed') {
    return `$${parseFloat(discountCode.discount_value).toFixed(2)} off`
  }

  return ''
}

/**
 * Check if discount code is currently valid (time-wise)
 * @param {Object} discountCode - Discount code object
 * @returns {boolean} True if code is currently valid
 */
export function isDiscountCodeActive(discountCode) {
  if (!discountCode || !discountCode.is_active) return false

  const now = new Date()

  if (discountCode.starts_at) {
    const startDate = new Date(discountCode.starts_at)
    if (now < startDate) return false
  }

  if (discountCode.expires_at) {
    const expirationDate = new Date(discountCode.expires_at)
    if (now > expirationDate) return false
  }

  if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
    return false
  }

  return true
}
