/**
 * Image Utility Functions
 *
 * Utility functions for handling meal/item images.
 * Handles both new menu_items schema (image_url) and legacy dishes schema (images array).
 */

/**
 * Default placeholder image URL
 */
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'

/**
 * Get meal image URL with fallback support
 *
 * Handles both new menu_items schema (image_url) and legacy dishes schema (images array).
 * Returns placeholder if no image is available.
 *
 * @param {Object} meal - Meal/item object
 * @returns {string} Image URL
 *
 * @example
 * const imageUrl = getMealImage(meal);
 */
export function getMealImage(meal) {
  if (!meal) return PLACEHOLDER_IMAGE

  // Support both menu_items (image_url) and old dishes (images array)
  if (meal?.image_url) {
    return meal.image_url
  }

  const images = meal?.images
  if (Array.isArray(images) && images.length > 0) {
    return images[0]
  }

  // Fallback placeholder image
  return PLACEHOLDER_IMAGE
}

/**
 * Get meal image URL or return default
 *
 * @param {Object} meal - Meal/item object
 * @param {string} defaultImage - Default image URL
 * @returns {string} Image URL
 */
export function getMealImageWithDefault(meal, defaultImage = PLACEHOLDER_IMAGE) {
  const image = getMealImage(meal)
  return image || defaultImage
}

/**
 * Alias for getMealImage for backward compatibility
 * @param {Object} meal - Meal/item object
 * @returns {string} Image URL
 */
export const getMealImageUrl = getMealImage
