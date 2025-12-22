/**
 * useCheckoutCalculations Hook
 *
 * Calculates checkout totals (subtotal, shipping, tax, grand total, etc.)
 */

import { useMemo } from 'react'
import {
  calculateTotalItemsCount,
  calculateSubtotal,
  calculateShipping,
  calculateTax,
  calculateGrandTotal,
  getTaxRatePercent,
  type CartItem,
} from '../utils/calculations'
import { resolveLoyaltyState } from '../../../lib/loyaltyUtils'

interface UseCheckoutCalculationsOptions {
  cartItems: CartItem[]
  discountAmount: number
}

interface UseCheckoutCalculationsReturn {
  totalItemsCount: number
  subtotal: number
  shipping: number
  tax: number
  taxRatePercent: number
  grandTotal: number
  loyalty: ReturnType<typeof resolveLoyaltyState>
}

/**
 * Hook for calculating checkout totals
 */
export function useCheckoutCalculations({
  cartItems,
  discountAmount,
}: UseCheckoutCalculationsOptions): UseCheckoutCalculationsReturn {
  const totalItemsCount = useMemo(
    () => calculateTotalItemsCount(cartItems),
    [cartItems]
  )

  const subtotal = useMemo(
    () => calculateSubtotal(cartItems),
    [cartItems]
  )

  const shipping = useMemo(
    () => calculateShipping(subtotal),
    [subtotal]
  )

  const tax = useMemo(
    () => calculateTax(subtotal),
    [subtotal]
  )

  const taxRatePercent = getTaxRatePercent()

  const grandTotal = useMemo(
    () => calculateGrandTotal(subtotal, shipping, tax, discountAmount),
    [subtotal, shipping, tax, discountAmount]
  )

  const loyalty = useMemo(
    () => resolveLoyaltyState(grandTotal),
    [grandTotal]
  )

  return {
    totalItemsCount,
    subtotal,
    shipping,
    tax,
    taxRatePercent,
    grandTotal,
    loyalty,
  }
}

