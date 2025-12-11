import { supabase } from './supabase'
import { emitFavoritesChanged } from './favoritesEvents'
import { logger } from '../utils/logger'

const NOT_AUTHENTICATED = 'NOT_AUTHENTICATED'
const USER_MISMATCH = 'USER_MISMATCH'

const getFavoriteColumn = (isMenuItem) => (isMenuItem ? 'menu_item_id' : 'product_id')

const buildFavoriteColumns = (targetId, isMenuItem) => (
  isMenuItem
    ? { menu_item_id: targetId, product_id: null }
    : { menu_item_id: null, product_id: targetId }
)

const buildError = (message, code) => {
  const error = new Error(message)
  error.code = code
  return error
}

const resolveSessionUserId = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw buildError('Unable to verify current session', NOT_AUTHENTICATED)
  }

  const sessionUserId = data?.session?.user?.id
  if (!sessionUserId) {
    throw buildError('Not authenticated: favorites actions require login', NOT_AUTHENTICATED)
  }

  return sessionUserId
}

const ensureAuthenticated = async (userId) => {
  const sessionUserId = await resolveSessionUserId()

  if (userId && userId !== sessionUserId) {
    throw buildError('Forbidden: user mismatch detected', USER_MISMATCH)
  }

  return sessionUserId
}

/**
 * Add a dish to the user's favorites
 * @param {string} targetId - The item ID to add
 * @param {string} userId - The user's ID
 * @param {Object} options - Additional options
 * @param {boolean} options.isMenuItem - Whether the ID refers to menu_items (default: true)
 * @returns {Object} Result object with success/error
 */
export async function addToFavorites(targetId, userId, { isMenuItem = true } = {}) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    const columns = buildFavoriteColumns(targetId, isMenuItem)
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: sessionUserId,
        ...columns
      })
      .select()
      .single()

    if (error) {
      // If it's a duplicate error, it means the item is already in favorites
      if (error.code === '23505') {
        return {
          success: false,
          alreadyExists: true,
          message: 'This dish is already in your favorites'
        }
      }
      throw error
    }

    emitFavoritesChanged() // Trigger immediate UI update
    return { success: true, data }
  } catch (error) {
    logger.error('Error adding to favorites:', error)
    return { success: false, error }
  }
}

/**
 * Remove a dish from the user's favorites
 * @param {string} targetId - The item ID to remove
 * @param {string} userId - The user's ID
 * @param {Object} options - Additional options
 * @param {boolean} options.isMenuItem - Whether the ID refers to menu_items (default: true)
 * @returns {Object} Result object with success/error
 */
export async function removeFromFavorites(targetId, userId, { isMenuItem = true } = {}) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    const column = getFavoriteColumn(isMenuItem)
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', sessionUserId)
      .eq(column, targetId)

    if (error) throw error

    emitFavoritesChanged() // Trigger immediate UI update
    return { success: true }
  } catch (error) {
    logger.error('Error removing from favorites:', error)
    return { success: false, error }
  }
}

/**
 * Check if a dish is in the user's favorites
 * @param {string} targetId - The item ID to check
 * @param {string} userId - The user's ID
 * @param {Object} options - Additional options
 * @param {boolean} options.isMenuItem - Whether the ID refers to menu_items (default: true)
 * @returns {boolean} True if item is in favorites
 */
export async function isInFavorites(targetId, userId, { isMenuItem = true } = {}) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    const column = getFavoriteColumn(isMenuItem)
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', sessionUserId)
      .eq(column, targetId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine
      throw error
    }

    return !!data
  } catch (error) {
    logger.error('Error checking favorites:', error)
    return false
  }
}

/**
 * Get all favorite dishes for a user with dish details
 * @param {string} userId - The user's ID
 * @returns {Array} Array of favorite items with dish details
 */
export async function getFavoriteItems(userId) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        menu_item_id,
        product_id,
        menu_items (
          id,
          name,
          description,
          price,
          currency,
          category,
          image_url,
          is_available
        ),
        dishes (
          id,
          name,
          description,
          price,
          category,
          images,
          stock_quantity
        )
      `)
      .eq('user_id', sessionUserId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const normalized = (data || []).map((item) => ({
      ...item,
      menu_items: item.menu_items ? { ...item.menu_items, isMenuItem: true } : null,
      dishes: item.dishes ? { ...item.dishes, isMenuItem: false } : null
    }))

    return { success: true, data: normalized }
  } catch (error) {
    logger.error('Error fetching favorites:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get favorites count for a user
 * @param {string} userId - The user's ID
 * @returns {number} Count of favorite dishes
 */
export async function getFavoritesCount(userId) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sessionUserId)

    if (error) throw error

    return count || 0
  } catch (error) {
    logger.error('Error fetching favorites count:', error)
    return 0
  }
}

/**
 * Toggle dish in favorites (add if not present, remove if present)
 * Uses optimistic insert to prevent race conditions
 * @param {string} targetId - The item ID to toggle
 * @param {string} userId - The user's ID
 * @param {Object} options - Additional options
 * @param {boolean} options.isMenuItem - Whether the ID refers to menu_items (default: true)
 * @returns {Object} Result object with success/error and action taken
 */
export async function toggleFavorites(targetId, userId, { isMenuItem = true } = {}) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    // Optimistic approach: Try to insert first (atomic operation)
    const columns = buildFavoriteColumns(targetId, isMenuItem)
    const { data, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: sessionUserId,
        ...columns
      })
      .select()

    // If insert succeeded, item was added
    if (!insertError) {
      emitFavoritesChanged() // Trigger immediate UI update
      return { success: true, action: 'added', data }
    }

    // If duplicate key error (23505), item already existed - remove it
    if (insertError.code === '23505') {
      const result = await removeFromFavorites(targetId, sessionUserId, { isMenuItem })
      if (result.success) {
        emitFavoritesChanged() // Trigger immediate UI update
      }
      return { ...result, action: 'removed' }
    }

    // Any other error - return it
    throw insertError
  } catch (error) {
    logger.error('Error toggling favorites:', error)
    return { success: false, error }
  }
}