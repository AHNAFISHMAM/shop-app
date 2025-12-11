/**
 * Quote Background Helper
 * Provides utility function to get hero quote background image URL
 * with fallback to default asset
 */

// Default fallback image URL (local asset)
const DEFAULT_BACKGROUND = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'

/**
 * Get hero quote background image URL
 * Returns uploaded image URL from settings if available, otherwise fallback
 *
 * @param {Object} settings - Store settings object
 * @param {string} settings.hero_quote_bg_url - Uploaded background image URL
 * @returns {string} Background image URL
 */
export function getQuoteBackgroundUrl(settings) {
  // Return uploaded URL if it exists and is valid
  if (settings?.hero_quote_bg_url && typeof settings.hero_quote_bg_url === 'string' && settings.hero_quote_bg_url.trim() !== '') {
    return settings.hero_quote_bg_url
  }

  // Fallback to default
  return DEFAULT_BACKGROUND
}

/**
 * Get default background URL
 * Useful for testing and as a reference
 *
 * @returns {string} Default background image URL
 */
export function getDefaultBackgroundUrl() {
  return DEFAULT_BACKGROUND
}
