/**
 * Checkout Calculations Tests
 * 
 * Unit tests for checkout calculation utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTotalItemsCount,
  calculateSubtotal,
  calculateShipping,
  calculateTax,
  calculateGrandTotal,
  type CartItem,
} from './calculations'
import { SHIPPING_THRESHOLD, SHIPPING_FEE, DEFAULT_TAX_RATE } from '../constants'

describe('calculateTotalItemsCount', () => {
  it('should sum all item quantities', () => {
    const items: CartItem[] = [
      { id: '1', quantity: 2 },
      { id: '2', quantity: 3 },
      { id: '3', quantity: 1 },
    ]

    expect(calculateTotalItemsCount(items)).toBe(6)
  })

  it('should return 0 for empty array', () => {
    expect(calculateTotalItemsCount([])).toBe(0)
  })
})

describe('calculateSubtotal', () => {
  it('should calculate subtotal from item prices and quantities', () => {
    const items: CartItem[] = [
      {
        id: '1',
        quantity: 2,
        price: 10,
        resolvedProduct: { price: 10 },
      },
      {
        id: '2',
        quantity: 1,
        price: 20,
        resolvedProduct: { price: 20 },
      },
    ]

    expect(calculateSubtotal(items)).toBe(40) // (2 * 10) + (1 * 20)
  })

  it('should handle string prices', () => {
    const items: CartItem[] = [
      {
        id: '1',
        quantity: 1,
        price: '10.50',
        resolvedProduct: { price: '10.50' },
      },
    ]

    expect(calculateSubtotal(items)).toBe(10.5)
  })

  it('should return 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0)
  })
})

describe('calculateShipping', () => {
  it('should return 0 when subtotal exceeds threshold', () => {
    expect(calculateShipping(SHIPPING_THRESHOLD + 1)).toBe(0)
    expect(calculateShipping(SHIPPING_THRESHOLD)).toBe(0)
  })

  it('should return shipping fee when subtotal is below threshold', () => {
    expect(calculateShipping(SHIPPING_THRESHOLD - 1)).toBe(SHIPPING_FEE)
    expect(calculateShipping(0)).toBe(SHIPPING_FEE)
  })
})

describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    const subtotal = 100
    const shipping = 10
    const expectedTax = (subtotal + shipping) * DEFAULT_TAX_RATE

    expect(calculateTax(subtotal, shipping)).toBe(expectedTax)
  })

  it('should return 0 when subtotal and shipping are 0', () => {
    expect(calculateTax(0, 0)).toBe(0)
  })
})

describe('calculateGrandTotal', () => {
  it('should sum subtotal, shipping, tax, and subtract discount', () => {
    const subtotal = 100
    const shipping = 10
    const tax = 8.8
    const discount = 10

    const expected = subtotal + shipping + tax - discount
    expect(calculateGrandTotal(subtotal, shipping, tax, discount)).toBe(expected)
  })

  it('should handle zero discount', () => {
    const subtotal = 100
    const shipping = 10
    const tax = 8.8

    expect(calculateGrandTotal(subtotal, shipping, tax, 0)).toBe(subtotal + shipping + tax)
  })
})

