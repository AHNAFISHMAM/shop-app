import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Get all variants for a product
 * @param {string} productId - The product ID
 * @returns {Object} Result with variants data
 */
export async function getProductVariants(productId) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('variant_type, variant_value')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    logger.error('Error fetching product variants:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get variants grouped by type (e.g., {Size: [...], Color: [...]})
 * @param {string} productId - The product ID
 * @returns {Object} Grouped variants
 */
export async function getGroupedVariants(productId) {
  try {
    const result = await getProductVariants(productId)

    if (!result.success || !result.data) {
      return { success: false, data: {} }
    }

    // Group variants by type
    const grouped = result.data.reduce((acc, variant) => {
      if (!acc[variant.variant_type]) {
        acc[variant.variant_type] = []
      }
      acc[variant.variant_type].push(variant)
      return acc
    }, {})

    return { success: true, data: grouped }
  } catch (error) {
    logger.error('Error grouping variants:', error)
    return { success: false, error, data: {} }
  }
}

/**
 * Get a specific variant by ID
 * @param {string} variantId - The variant ID
 * @returns {Object} Variant data
 */
export async function getVariantById(variantId) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error fetching variant:', error)
    return { success: false, error }
  }
}

/**
 * Calculate the final price of a variant
 * @param {number} basePrice - Base product price
 * @param {number} priceAdjustment - Variant price adjustment
 * @returns {number} Final price
 */
export function calculateVariantPrice(basePrice, priceAdjustment) {
  const base = typeof basePrice === 'number' ? basePrice : parseFloat(basePrice || 0)
  const adjustment = typeof priceAdjustment === 'number' ? priceAdjustment : parseFloat(priceAdjustment || 0)
  return base + adjustment
}

/**
 * Create a new variant (Admin only)
 * @param {Object} variantData - Variant details
 * @returns {Object} Result with created variant
 */
export async function createVariant(variantData) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: variantData.product_id,
        variant_type: variantData.variant_type,
        variant_value: variantData.variant_value,
        price_adjustment: variantData.price_adjustment || 0,
        stock_quantity: variantData.stock_quantity || 0,
        sku: variantData.sku || null,
        is_active: variantData.is_active !== false
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error creating variant:', error)
    return { success: false, error }
  }
}

/**
 * Update a variant (Admin only)
 * @param {string} variantId - The variant ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Result with updated variant
 */
export async function updateVariant(variantId, updates) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error updating variant:', error)
    return { success: false, error }
  }
}

/**
 * Delete a variant (Admin only)
 * @param {string} variantId - The variant ID
 * @returns {Object} Result
 */
export async function deleteVariant(variantId) {
  try {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    logger.error('Error deleting variant:', error)
    return { success: false, error }
  }
}

/**
 * Check if a product has variants
 * @param {string} productId - The product ID
 * @returns {boolean} True if product has variants
 */
export async function productHasVariants(productId) {
  try {
    const { count, error } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('is_active', true)

    if (error) throw error

    return count > 0
  } catch (error) {
    logger.error('Error checking variants:', error)
    return false
  }
}

/**
 * Get total stock for a product (including all variants)
 * @param {string} productId - The product ID
 * @returns {number} Total stock
 */
export async function getTotalVariantStock(productId) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('product_id', productId)
      .eq('is_active', true)

    if (error) throw error

    const total = (data || []).reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0)
    return total
  } catch (error) {
    logger.error('Error calculating total variant stock:', error)
    return 0
  }
}

/**
 * Format variant display string (e.g., "Size: Large, Color: Blue")
 * @param {Object} variantDetails - Variant details object or array
 * @returns {string} Formatted string
 */
export function formatVariantDisplay(variantDetails) {
  if (!variantDetails) return ''

  // If it's an array of variants
  if (Array.isArray(variantDetails)) {
    return variantDetails
      .map(v => `${v.variant_type}: ${v.variant_value}`)
      .join(', ')
  }

  // If it's a single variant object
  if (variantDetails.variant_type && variantDetails.variant_value) {
    return `${variantDetails.variant_type}: ${variantDetails.variant_value}`
  }

  return ''
}

/**
 * Create variant snapshot for order (stores variant details at time of purchase)
 * @param {Object} variant - Variant object
 * @returns {Object} Snapshot object
 */
export function createVariantSnapshot(variant) {
  if (!variant) return null

  return {
    variant_type: variant.variant_type,
    variant_value: variant.variant_value,
    price_adjustment: variant.price_adjustment || 0,
    sku: variant.sku || null
  }
}

