/**
 * Favorites Event Emitter (Star Cafe)
 *
 * Provides instant favorites count updates without waiting for database subscriptions.
 * This ensures the navbar count updates immediately when dishes are added/removed.
 */

// Custom event name
const FAVORITES_CHANGED_EVENT = 'favorites:changed'

/**
 * Emit a favorites changed event
 * Call this after adding/removing from favorites to trigger immediate UI updates
 */
export function emitFavoritesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT))
  }
}

/**
 * Listen for favorites changes
 * @param {Function} callback - Function to call when favorites change
 * @returns {Function} Cleanup function to remove the listener
 */
export function onFavoritesChanged(callback) {
  if (typeof window === 'undefined') {
    return () => {} // No-op for SSR
  }

  const handler = () => {
    callback()
  }

  window.addEventListener(FAVORITES_CHANGED_EVENT, handler)

  // Return cleanup function
  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, handler)
  }
}
