/**
 * Checkout Formatting Utilities
 */

import { formatPrice, getCurrencySymbol } from '../../../lib/priceUtils'
import { CURRENCY_CODE } from '../constants'

/**
 * Format currency value with symbol
 */
export function formatCurrency(value: number | string): string {
  return `${getCurrencySymbol(CURRENCY_CODE)}${formatPrice(value, 0)}`
}

/**
 * Get product image URL with fallback
 */
export function getProductImage(product: {
  image_url?: string | null
  image?: string | null
}): string {
  return (
    product.image_url ||
    product.image ||
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
  )
}
