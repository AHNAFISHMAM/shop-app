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
    
    // Query favorites without join (Supabase relationship not configured correctly)
    // Fetch menu_items separately for better reliability
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        product_id
      `)
      .eq('user_id', sessionUserId)
      .order('created_at', { ascending: false })

    if (favoritesError) throw favoritesError

    // Fetch menu_items separately
    const productIds = (favoritesData || []).map(f => f.product_id).filter(Boolean)
    if (productIds.length > 0) {
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('id, name, description, price, category, images, is_available')
        .in('id', productIds)

      if (menuItemsError) {
        logger.error('Error fetching menu_items:', menuItemsError)
      }

      const menuItemsMap = new Map((menuItemsData || []).map(d => [d.id, d]))
      
      const normalized = (favoritesData || []).map((item) => ({
        ...item,
        menu_items: menuItemsMap.get(item.product_id) ? { ...menuItemsMap.get(item.product_id), isMenuItem: true } : null,
        dishes: null
      }))

      return { success: true, data: normalized }
    }

    return { success: true, data: [] }
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

/**
 * Remove favorite by favorite record ID
 * This function accepts the favorite record ID and extracts the item ID automatically
 * @param {string} favoriteId - The favorite record ID (from favorites table)
 * @param {string} userId - The user's ID
 * @returns {Object} Result object with success/error
 */
export async function removeFavorite(favoriteId, userId) {
  try {
    const sessionUserId = await ensureAuthenticated(userId)
    
    // First, fetch the favorite record to get the item ID
    const { data: favorite, error: fetchError } = await supabase
      .from('favorites')
      .select('menu_item_id, product_id')
      .eq('id', favoriteId)
      .eq('user_id', sessionUserId)
      .single()

    if (fetchError) throw fetchError
    if (!favorite) {
      throw buildError('Favorite not found', 'NOT_FOUND')
    }

    // Determine if it's a menu item or product
    const isMenuItem = !!favorite.menu_item_id
    const targetId = favorite.menu_item_id || favorite.product_id

    if (!targetId) {
      throw buildError('Invalid favorite record: missing item ID', 'INVALID_DATA')
    }

    // Use the existing removeFromFavorites function
    return await removeFromFavorites(targetId, sessionUserId, { isMenuItem })
  } catch (error) {
    logger.error('Error removing favorite by ID:', error)
    return { success: false, error }
  }
}