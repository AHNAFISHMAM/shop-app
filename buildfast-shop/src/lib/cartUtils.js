import { supabase } from './supabase'
import { emitCartChanged } from './cartEvents'
import { logger } from '../utils/logger'

/**
 * Check if a product already exists in the user's cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {string|null} variantId - Optional variant ID (for single-variant products)
 * @param {string|null} combinationId - Optional combination ID (for multi-variant products)
 * @returns {Promise<{item: Object|null, error: Error|null}>}
 */
export const getExistingCartItem = async (userId, productId, variantId = null, combinationId = null) => {
  let query = supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)

  // Three cases:
  // 1. Combination (multi-variant): match by combination_id
  // 2. Single variant: match by variant_id
  // 3. No variants: match items without variant_id or combination_id

  if (combinationId) {
    query = query.eq('combination_id', combinationId)
  } else if (variantId) {
    query = query.eq('variant_id', variantId).is('combination_id', null)
  } else {
    query = query.is('variant_id', null).is('combination_id', null)
  }

  const { data, error } = await query.maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return { item: null, error }
  }

  return { item: data || null, error: null }
}

/**
 * Update cart item quantity
 * @param {string} cartItemId - Cart item ID
 * @param {number} newQuantity - New quantity
 * @param {string} userId - User ID (for security check)
 * @returns {Promise<{error: Error|null}>}
 */
export const updateCartItemQuantity = async (cartItemId, newQuantity, userId) => {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
    .eq('id', cartItemId)
    .eq('user_id', userId)

  if (!error) {
    emitCartChanged() // Trigger immediate UI update
  }

  return { error }
}

/**
 * Insert a new cart item
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {string|null} variantId - Optional variant ID (for single-variant products)
 * @param {string|null} combinationId - Optional combination ID (for multi-variant products)
 * @returns {Promise<{error: Error|null}>}
 */
export const insertCartItem = async (userId, productId, variantId = null, combinationId = null) => {
  const { error } = await supabase
    .from('cart_items')
    .insert([
      {
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        combination_id: combinationId,
        quantity: 1
      }
    ])

  if (!error) {
    emitCartChanged() // Trigger immediate UI update
  }

  return { error }
}

/**
 * Add product to cart (handles both insert and update)
 * @param {Object} product - Product object
 * @param {string} userId - User ID
 * @param {Object|null} variant - Optional variant object (for single-variant products)
 * @param {Object|null} combination - Optional combination object (for multi-variant products)
 * @returns {Promise<{success: boolean, error: Error|null, stockExceeded: boolean, stockLimit: number|null}>}
 */
export const addProductToCart = async (product, userId, variant = null, combination = null) => {
  const isMenuItem = product?.isMenuItem ?? (product?.category_id !== undefined && product?.is_available !== undefined)

  if (isMenuItem) {
    if (product?.is_available === false) {
      return { success: false, error: null, stockExceeded: true, stockLimit: 0 }
    }

    const { data: existingItem, error: menuError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('menu_item_id', product.id)
      .maybeSingle()

    if (menuError && menuError.code !== 'PGRST116') {
      return { success: false, error: menuError, stockExceeded: false, stockLimit: null }
    }

    if (existingItem) {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id)

      if (updateError) {
        return { success: false, error: updateError, stockExceeded: false, stockLimit: null }
      }

      emitCartChanged()
      return { success: true, error: null, stockExceeded: false, stockLimit: null }
    }

    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        user_id: userId,
        menu_item_id: product.id,
        quantity: 1
      })

    if (insertError) {
      return { success: false, error: insertError, stockExceeded: false, stockLimit: null }
    }

    emitCartChanged()
    return { success: true, error: null, stockExceeded: false, stockLimit: null }
  }

  const variantId = variant?.id || null
  const combinationId = combination?.id || null

  // Note: menu_items doesn't have stock_quantity, using is_available instead
  // Determine availability to check (combination > variant > product)
  let isAvailable = product.is_available !== false
  if (combination) {
    isAvailable = combination.is_available !== false
  } else if (variant) {
    isAvailable = variant.is_available !== false
  }

  // Get existing cart item (matching product, variant, and/or combination)
  const { item: existingItem, error: checkError } = await getExistingCartItem(
    userId,
    product.id,
    variantId,
    combinationId
  )

  if (checkError) {
    return { success: false, error: checkError, stockExceeded: false, stockLimit: null }
  }

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + 1

    // Check stock availability
    // Note: menu_items doesn't have stock_quantity, skip stock limit check
    if (!isAvailable) {
      return {
        success: false,
        error: null,
        stockExceeded: true,
        stockLimit: isAvailable ? 999 : 0 // Note: menu_items doesn't track stock, using availability
      }
    }

    const { error: updateError } = await updateCartItemQuantity(existingItem.id, newQuantity, userId)

    if (updateError) {
      return { success: false, error: updateError, stockExceeded: false, stockLimit: null }
    }

    return { success: true, error: null, stockExceeded: false, stockLimit: null }
  } else {
    // Check if we have stock before inserting
    if (!isAvailable) {
      return {
        success: false,
        error: null,
        stockExceeded: true,
        stockLimit: 0
      }
    }

    // Insert new cart item
    const { error: insertError } = await insertCartItem(userId, product.id, variantId, combinationId)

    if (insertError) {
      return { success: false, error: insertError, stockExceeded: false, stockLimit: null }
    }

    return { success: true, error: null, stockExceeded: false, stockLimit: null }
  }
}

/**
 * Get cart item count for a user (total number of unique items, not quantity)
 * @param {string} userId - The user's ID
 * @returns {number} Count of unique items in cart
 */
export async function getCartCount(userId) {
  try {
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error

    return count || 0
  } catch (error) {
    logger.error('Error fetching cart count:', error)
    return 0
  }
}

/**
 * Get total quantity of all items in cart (sum of all quantities)
 * @param {string} userId - The user's ID
 * @returns {number} Total quantity of all items
 */
export async function getCartTotalQuantity(userId) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId)

    if (error) throw error

    const total = (data || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
    return total
  } catch (error) {
    logger.error('Error fetching cart total quantity:', error)
    return 0
  }
}

// =====================================================
// MENU ITEM CART FUNCTIONS (for Star Café menu system)
// =====================================================

/**
 * Add menu item to cart (simplified version without variants)
 * @param {Object} menuItem - Menu item object
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const addMenuItemToCart = async (menuItem, userId) => {
  try {
    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItem.id)
      .maybeSingle();

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Insert new cart item
      const { error } = await supabase
        .from('cart_items')
        .insert([{
          user_id: userId,
          menu_item_id: menuItem.id,
          quantity: 1
        }]);

      if (error) throw error;
    }

    emitCartChanged(); // Trigger immediate UI update
    return { success: true, error: null };

  } catch (error) {
    logger.error('Error adding menu item to cart:', error);
    return { success: false, error };
  }
};

/**
 * Update menu item quantity in cart
 * @param {string} cartItemId - Cart item ID
 * @param {number} newQuantity - New quantity
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const updateMenuItemQuantity = async (cartItemId, newQuantity, userId) => {
  try {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId)
        .eq('user_id', userId);

      if (error) throw error;
    }

    emitCartChanged(); // Trigger immediate UI update
    return { success: true, error: null };

  } catch (error) {
    logger.error('Error updating menu item quantity:', error);
    return { success: false, error };
  }
};

/**
 * Remove menu item from cart
 * @param {string} cartItemId - Cart item ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const removeMenuItemFromCart = async (cartItemId, userId) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId);

    if (error) throw error;

    emitCartChanged(); // Trigger immediate UI update
    return { success: true, error: null };

  } catch (error) {
    logger.error('Error removing menu item from cart:', error);
    return { success: false, error };
  }
};

/**
 * Get cart items with menu item details (joins menu_items table)
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getCartWithMenuItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_items (
          id,
          name,
          description,
          price,
          currency,
          image_url,
          dietary_tags,
          spice_level,
          prep_time,
          menu_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('user_id', userId)
      .not('menu_item_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };

  } catch (error) {
    logger.error('Error fetching cart with menu items:', error);
    return { data: null, error };
  }
};

