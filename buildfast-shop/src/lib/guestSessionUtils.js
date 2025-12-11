/**
 * Guest Session Management
 *
 * Manages guest user sessions for checkout without authentication
 */

import { emitCartChanged } from './cartEvents'
import { logger } from '../utils/logger'

const GUEST_SESSION_KEY = 'guest_session_id'
const GUEST_CART_KEY = 'guest_cart'
/**
 * Generate or retrieve guest session ID
 */
export const getGuestSessionId = () => {
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY)

  if (!sessionId) {
    // Generate new session ID (UUID v4)
    sessionId = generateUUID()
    localStorage.setItem(GUEST_SESSION_KEY, sessionId)
  }

  return sessionId
}

/**
 * Clear guest session (on account creation)
 */
export const clearGuestSession = () => {
  localStorage.removeItem(GUEST_SESSION_KEY)
  localStorage.removeItem(GUEST_CART_KEY)
}

/**
 * Generate UUID v4
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Guest Cart Management (localStorage)
 */

/**
 * Get guest cart items
 */
export const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY)
    return cart ? JSON.parse(cart) : []
  } catch (error) {
    logger.error('Error loading guest cart:', error)
    return []
  }
}

/**
 * Save guest cart items
 */
export const saveGuestCart = (cartItems) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems))

    // Dispatch custom events to notify components of cart update
    window.dispatchEvent(new CustomEvent('guestCartUpdated', {
      detail: { itemCount: cartItems.length }
    }))
    
    // Dispatch generic cart update event for hooks
    window.dispatchEvent(new CustomEvent('cart:updated'))
  } catch (error) {
    logger.error('Error saving guest cart:', error)
  }
}

/**
 * Add item to guest cart (supports both products and menu_items)
 */
export const addToGuestCart = (product, quantity = 1, optionsOrIsMenuItem = null, legacyVariantId = null, legacyVariantDisplay = null) => {
  if (!product) return []

  const cart = getGuestCart()

  let options = {}
  if (optionsOrIsMenuItem && typeof optionsOrIsMenuItem === 'object' && !Array.isArray(optionsOrIsMenuItem)) {
    options = { ...optionsOrIsMenuItem }
  } else if (optionsOrIsMenuItem !== null && optionsOrIsMenuItem !== undefined) {
    options.isMenuItem = optionsOrIsMenuItem
  }

  if (legacyVariantId !== null && legacyVariantId !== undefined) {
    options.variantId = legacyVariantId
  }

  if (legacyVariantDisplay !== null && legacyVariantDisplay !== undefined) {
    options.variantDisplay = legacyVariantDisplay
  }

  const {
    isMenuItem: explicitIsMenuItem = null,
    variantId: optionVariantId = null,
    variantDisplay = null
  } = options

  let isMenuItem = explicitIsMenuItem
  if (isMenuItem === null || isMenuItem === undefined) {
    isMenuItem = product?.category_id !== undefined && product?.is_available !== undefined
  }

  const productId = isMenuItem ? null : product?.id
  const menuItemId = isMenuItem ? product?.id : null
  const resolvedVariantId = optionVariantId

  const existingIndex = cart.findIndex(
    (item) =>
      ((productId && item.product_id === productId) || (menuItemId && item.menu_item_id === menuItemId)) &&
      item.variant_id === resolvedVariantId
  )

  if (existingIndex !== -1) {
    cart[existingIndex].quantity += quantity
  } else {
    cart.push({
      id: generateUUID(),
      product_id: productId,
      menu_item_id: menuItemId,
      product: { ...product, isMenuItem },
      quantity,
      variant_id: resolvedVariantId,
      variant_display: variantDisplay ?? null,
      created_at: new Date().toISOString()
    })
  }

  saveGuestCart(cart)
  emitCartChanged()
  return cart
}

/**
 * Update guest cart item quantity
 */
export const updateGuestCartQuantity = (itemId, newQuantity) => {
  const cart = getGuestCart()

  if (newQuantity <= 0) {
    // Remove item
    const filtered = cart.filter((item) => item.id !== itemId)
    saveGuestCart(filtered)
    emitCartChanged() // Trigger navbar update
    return filtered
  }

  const updated = cart.map((item) =>
    item.id === itemId ? { ...item, quantity: newQuantity } : item
  )

  saveGuestCart(updated)
  emitCartChanged() // Trigger navbar update
  return updated
}

/**
 * Remove item from guest cart
 */
export const removeFromGuestCart = (itemId) => {
  const cart = getGuestCart()
  const filtered = cart.filter((item) => item.id !== itemId)
  saveGuestCart(filtered)
  emitCartChanged() // Trigger navbar update
  return filtered
}

/**
 * Clear guest cart
 */
export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY)

  // Dispatch custom event to notify navbar of cart update
  window.dispatchEvent(new CustomEvent('guestCartUpdated', {
    detail: { itemCount: 0 }
  }))

  emitCartChanged() // Trigger navbar update
}

/**
 * Migrate guest cart to user account (supports both products and menu_items)
 */
export const migrateGuestCartToUser = async (userId, supabase) => {
  const guestCart = getGuestCart()

  if (guestCart.length === 0) {
    return { success: true, message: 'No items to migrate' }
  }

  try {
    // Insert guest cart items into database
    const cartItemsData = guestCart.map((item) => ({
      user_id: userId,
      product_id: item.product_id || null,
      menu_item_id: item.menu_item_id || null,
      quantity: item.quantity,
      variant_id: item.variant_id || null
    }))

    // Migrate each item individually since we might have mixed product/menu_item IDs
    for (const itemData of cartItemsData) {
      // Skip if neither ID is present
      if (!itemData.product_id && !itemData.menu_item_id) continue

      const { error } = await supabase
        .from('cart_items')
        .upsert([itemData], {
          onConflict: itemData.product_id
            ? 'user_id,product_id'
            : 'user_id,menu_item_id'
        })

      if (error) {
        logger.error('Error migrating cart item:', error)
        // Continue with other items even if one fails
      }
    }

    // Clear guest cart after migration attempt
    clearGuestCart()

    return { success: true, message: 'Cart migrated successfully' }
  } catch (error) {
    logger.error('Error migrating guest cart:', error)
    return { success: false, error: error.message }
  }
}
