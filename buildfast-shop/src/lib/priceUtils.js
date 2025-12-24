/**
 * Price Utility Functions
 *
 * Provides consistent price parsing and formatting across the application.
 * Handles both number and string price values from the database.
 * Consolidated from both utils/priceUtils.js and lib/priceUtils.js
 */

/**
 * Currency symbol mapper - converts currency codes to symbols
 * @param {string} currency - Currency code (e.g., 'BDT', 'USD')
 * @returns {string} Currency symbol (e.g., '৳', '$')
 */
export function getCurrencySymbol(currency) {
  const currencyMap = {
    BDT: '৳',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  }
  return currencyMap[currency] || currency || '৳'
}

/**
 * Safely parse a price value from the database
 * Handles both number and string types
 *
 * @param {number|string|null|undefined} price - Price value from database
 * @returns {number} Parsed price as number, or 0 if invalid
 */
export function parsePrice(price) {
  if (typeof price === 'number') {
    return isNaN(price) ? 0 : price
  }

  if (typeof price === 'string') {
    const parsed = parseFloat(price)
    return isNaN(parsed) ? 0 : parsed
  }

  return 0
}

/**
 * Format price for display with configurable decimal places
 *
 * @param {number|string|null|undefined} price - Price value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted price string (e.g., "19.99" or "350")
 */
export function formatPrice(price, decimals = 2) {
  return parsePrice(price).toFixed(decimals)
}

/**
 * Complete price display with currency symbol
 * @param {number|string} price - Price value
 * @param {string} currency - Currency code (default: 'BDT')
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Complete formatted price with symbol (e.g., '৳350')
 */
export function formatPriceWithCurrency(price, currency = 'BDT', decimals = 0) {
  return `${getCurrencySymbol(currency)}${formatPrice(price, decimals)}`
}

/**
 * Format price for database storage (DECIMAL(10,2))
 * Ensures proper precision for database insertion
 *
 * @param {number|string|null|undefined} price - Price value
 * @returns {number} Price rounded to 2 decimal places
 */
export function formatPriceForDB(price) {
  return parseFloat(parsePrice(price).toFixed(2))
}
