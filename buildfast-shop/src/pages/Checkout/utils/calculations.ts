/**
 * Checkout Calculation Utilities
 */

import { parsePrice } from '../../../lib/priceUtils'
import { SHIPPING_THRESHOLD, SHIPPING_FEE, DEFAULT_TAX_RATE } from '../constants'

export interface CartItem {
  id: string
  quantity: number
  price?: number | string
  price_at_purchase?: number | string
  resolvedProduct?: {
    price?: number | string
  } | null
  product?: {
    price?: number | string
  } | null
}

/**
 * Calculate total number of items (sum of all quantities)
 */
export function calculateTotalItemsCount(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Calculate subtotal (sum of all item prices * quantities)
 */
export function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    // Use resolved product, fallback to embedded product, or use cart item data
    const product = item.resolvedProduct || item.product || {
      price: item.price || item.price_at_purchase || 0
    }
    
    // Handle price - might be string or number, or use fallback from cart item
    const price = typeof product.price === 'number' 
      ? product.price 
      : parsePrice(product.price || item.price || item.price_at_purchase || '0')
    
    return sum + (price * item.quantity)
  }, 0)
}

/**
 * Calculate shipping fee
 */
export function calculateShipping(subtotal: number): number {
  return subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}

/**
 * Calculate tax
 */
export function calculateTax(subtotal: number): number {
  return subtotal * DEFAULT_TAX_RATE
}

/**
 * Calculate grand total (subtotal + shipping + tax - discount)
 */
export function calculateGrandTotal(
  subtotal: number,
  shipping: number,
  tax: number,
  discountAmount: number
): number {
  const total = subtotal + shipping + tax
  return Math.max(0, total - discountAmount) // Ensure total doesn't go negative
}

/**
 * Get tax rate as percentage
 */
export function getTaxRatePercent(): number {
  return DEFAULT_TAX_RATE * 100
}

