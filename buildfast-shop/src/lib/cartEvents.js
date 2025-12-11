/**
 * Cart Event Emitter (Star Cafe)
 *
 * Provides instant cart count updates without waiting for database subscriptions.
 * This ensures the navbar count updates immediately when items are added/removed.
 */

// Custom event name
const CART_CHANGED_EVENT = 'cart:changed'

/**
 * Emit a cart changed event
 * Call this after adding/removing from cart to trigger immediate UI updates
 */
export function emitCartChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT))
  }
}

/**
 * Listen for cart changes
 * @param {Function} callback - Function to call when cart changes
 * @returns {Function} Cleanup function to remove the listener
 */
export function onCartChanged(callback) {
  if (typeof window === 'undefined') {
    return () => {} // No-op for SSR
  }

  const handler = () => {
    callback()
  }

  window.addEventListener(CART_CHANGED_EVENT, handler)

  // Return cleanup function
  return () => {
    window.removeEventListener(CART_CHANGED_EVENT, handler)
  }
}
