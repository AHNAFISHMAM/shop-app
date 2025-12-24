/**
 * Cart Item Metadata Management
 * Handles notes and saved for later functionality for cart items
 * Uses localStorage for both guest and authenticated users
 */

import { logger } from '../utils/logger'

const CART_NOTES_KEY = 'cart_item_notes'
const SAVED_FOR_LATER_KEY = 'saved_for_later_items'

/**
 * Get all cart item notes
 */
export const getCartItemNotes = () => {
  try {
    const notes = localStorage.getItem(CART_NOTES_KEY)
    return notes ? JSON.parse(notes) : {}
  } catch (error) {
    logger.error('Error loading cart item notes:', error)
    return {}
  }
}

/**
 * Save note for a cart item
 */
export const saveCartItemNote = (itemId, note) => {
  try {
    const notes = getCartItemNotes()
    if (note && note.trim()) {
      notes[itemId] = note.trim()
    } else {
      delete notes[itemId]
    }
    localStorage.setItem(CART_NOTES_KEY, JSON.stringify(notes))
    return { success: true }
  } catch (error) {
    logger.error('Error saving cart item note:', error)
    return { success: false, error }
  }
}

/**
 * Get note for a specific cart item
 */
export const getCartItemNote = itemId => {
  const notes = getCartItemNotes()
  return notes[itemId] || null
}

/**
 * Remove note for a cart item
 */
export const removeCartItemNote = itemId => {
  try {
    const notes = getCartItemNotes()
    delete notes[itemId]
    localStorage.setItem(CART_NOTES_KEY, JSON.stringify(notes))
    return { success: true }
  } catch (error) {
    logger.error('Error removing cart item note:', error)
    return { success: false, error }
  }
}

/**
 * Get all saved for later items
 */
export const getSavedForLaterItems = () => {
  try {
    const saved = localStorage.getItem(SAVED_FOR_LATER_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    logger.error('Error loading saved for later items:', error)
    return []
  }
}

/**
 * Save item for later
 */
export const saveItemForLater = item => {
  try {
    const saved = getSavedForLaterItems()
    // Check if already saved
    const exists = saved.find(savedItem => savedItem.id === item.id)
    if (!exists) {
      saved.push({
        ...item,
        savedAt: new Date().toISOString(),
      })
      localStorage.setItem(SAVED_FOR_LATER_KEY, JSON.stringify(saved))
    }
    return { success: true }
  } catch (error) {
    logger.error('Error saving item for later:', error)
    return { success: false, error }
  }
}

/**
 * Remove item from saved for later
 */
export const removeFromSavedForLater = itemId => {
  try {
    const saved = getSavedForLaterItems()
    const filtered = saved.filter(item => item.id !== itemId)
    localStorage.setItem(SAVED_FOR_LATER_KEY, JSON.stringify(filtered))
    return { success: true }
  } catch (error) {
    logger.error('Error removing from saved for later:', error)
    return { success: false, error }
  }
}

/**
 * Check if item is saved for later
 */
export const isItemSavedForLater = itemId => {
  const saved = getSavedForLaterItems()
  return saved.some(item => item.id === itemId)
}

/**
 * Get selected reward for checkout
 */
export const getSelectedReward = () => {
  try {
    const reward = localStorage.getItem('selected_reward')
    return reward ? JSON.parse(reward) : null
  } catch (error) {
    logger.error('Error loading selected reward:', error)
    return null
  }
}

/**
 * Save selected reward for checkout
 */
export const saveSelectedReward = reward => {
  try {
    if (reward) {
      localStorage.setItem('selected_reward', JSON.stringify(reward))
    } else {
      localStorage.removeItem('selected_reward')
    }
    return { success: true }
  } catch (error) {
    logger.error('Error saving selected reward:', error)
    return { success: false, error }
  }
}

/**
 * Clear all cart metadata (useful for cleanup)
 */
export const clearCartMetadata = () => {
  try {
    localStorage.removeItem(CART_NOTES_KEY)
    localStorage.removeItem(SAVED_FOR_LATER_KEY)
    localStorage.removeItem('selected_reward')
    return { success: true }
  } catch (error) {
    logger.error('Error clearing cart metadata:', error)
    return { success: false, error }
  }
}
