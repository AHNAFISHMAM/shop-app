import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Get all variant combinations for a product
 * @param {string} productId - The product ID
 * @returns {Object} Result with combinations array
 */
export async function getProductCombinations(productId) {
  try {
    const { data, error } = await supabase
      .from('variant_combinations')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    logger.error('Error fetching variant combinations:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Find a specific combination by variant values
 * @param {string} productId - The product ID
 * @param {Object} variantValues - Object like {"Size": "Medium", "Color": "Red"}
 * @returns {Object} Result with combination or null
 */
export async function findCombinationByValues(productId, variantValues) {
  try {
    // PostgreSQL JSONB matching
    const { data, error } = await supabase
      .from('variant_combinations')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .contains('variant_values', variantValues)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return { success: true, data: data || null }
  } catch (error) {
    logger.error('Error finding combination:', error)
    return { success: false, error, data: null }
  }
}

/**
 * Get combination by ID
 * @param {string} combinationId - The combination ID
 * @returns {Object} Result with combination data
 */
export async function getCombinationById(combinationId) {
  try {
    const { data, error } = await supabase
      .from('variant_combinations')
      .select('*')
      .eq('id', combinationId)
      .eq('is_active', true)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error fetching combination:', error)
    return { success: false, error, data: null }
  }
}

/**
 * Calculate final price for a combination
 * @param {number} basePrice - Product base price
 * @param {number} combinationAdjustment - Combination price adjustment
 * @returns {number} Final price
 */
export function calculateCombinationPrice(basePrice, combinationAdjustment = 0) {
  return basePrice + combinationAdjustment
}

/**
 * Format combination display text
 * @param {Object} variantValues - Object like {"Size": "Medium", "Color": "Red"}
 * @returns {string} Formatted text like "Size: Medium, Color: Red"
 */
export function formatCombinationDisplay(variantValues) {
  if (!variantValues || typeof variantValues !== 'object') return ''

  return Object.entries(variantValues)
    .map(([type, value]) => `${type}: ${value}`)
    .join(', ')
}

/**
 * Create combination snapshot for order history
 * @param {Object} combination - Combination object
 * @returns {Object} Snapshot object
 */
export function createCombinationSnapshot(combination) {
  if (!combination) return null

  return {
    combination_id: combination.id,
    variant_values: combination.variant_values,
    price_adjustment: combination.price_adjustment,
    sku: combination.sku
  }
}

/**
 * Check if a product uses combinations (multiple variant types)
 * @param {string} productId - The product ID
 * @returns {boolean} True if product has combinations
 */
export async function productHasCombinations(productId) {
  try {
    const { count, error } = await supabase
      .from('variant_combinations')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('is_active', true)

    if (error) throw error

    return (count || 0) > 0
  } catch (error) {
    logger.error('Error checking for combinations:', error)
    return false
  }
}

/**
 * Get total stock across all combinations for a product
 * @param {string} productId - The product ID
 * @returns {number} Total stock
 */
export async function getTotalCombinationStock(productId) {
  try {
    const { data, error } = await supabase
      .from('variant_combinations')
      .select('stock_quantity')
      .eq('product_id', productId)
      .eq('is_active', true)

    if (error) throw error

    return (data || []).reduce((sum, combo) => sum + (combo.stock_quantity || 0), 0)
  } catch (error) {
    logger.error('Error calculating total stock:', error)
    return 0
  }
}

/**
 * Admin: Create a variant combination
 * @param {Object} combinationData - Combination data
 * @returns {Object} Created combination
 */
export async function createCombination(combinationData) {
  try {
    const { data, error } = await supabase
      .from('variant_combinations')
      .insert({
        product_id: combinationData.product_id,
        sku: combinationData.sku || null,
        variant_values: combinationData.variant_values,
        price_adjustment: combinationData.price_adjustment || 0,
        stock_quantity: combinationData.stock_quantity || 0,
        is_active: combinationData.is_active !== false
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error creating combination:', error)
    return { success: false, error }
  }
}

/**
 * Admin: Update a variant combination
 * @param {string} id - Combination ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated combination
 */
export async function updateCombination(id, updates) {
  try {
    const { data, error } = await supabase
      .from('variant_combinations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    logger.error('Error updating combination:', error)
    return { success: false, error }
  }
}

/**
 * Admin: Delete a variant combination
 * @param {string} id - Combination ID
 * @returns {Object} Success status
 */
export async function deleteCombination(id) {
  try {
    const { error } = await supabase
      .from('variant_combinations')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    logger.error('Error deleting combination:', error)
    return { success: false, error }
  }
}

/**
 * Generate all possible combinations from variant types
 * Helper function for admin UI to auto-generate combinations
 * @param {Object} variantsByType - Object like {Size: [{...}, {...}], Color: [{...}, {...}]}
 * @returns {Array} Array of combination objects
 */
export function generateCombinations(variantsByType) {
  const types = Object.keys(variantsByType)

  if (types.length === 0) return []
  if (types.length === 1) {
    // Single variant type - no combinations needed
    return []
  }

  // Generate cartesian product of all variant values
  const combinations = []

  function buildCombos(index, current) {
    if (index === types.length) {
      combinations.push({ ...current })
      return
    }

    const type = types[index]
    const variants = variantsByType[type]

    for (const variant of variants) {
      buildCombos(index + 1, {
        ...current,
        variant_values: {
          ...current.variant_values,
          [type]: variant.variant_value
        },
        price_adjustment: (current.price_adjustment || 0) + (variant.price_adjustment || 0)
      })
    }
  }

  buildCombos(0, { variant_values: {}, price_adjustment: 0 })

  return combinations
}
