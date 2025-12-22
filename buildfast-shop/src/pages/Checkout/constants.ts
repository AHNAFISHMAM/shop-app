/**
 * Checkout Constants
 */

export const CURRENCY_SYMBOL = '৳'
export const CURRENCY_CODE = 'BDT'
export const SHIPPING_THRESHOLD = 500
export const SHIPPING_FEE = 50
export const DEFAULT_TAX_RATE = 0.08

/**
 * Scheduled delivery/pickup time slots
 */
export const SCHEDULED_SLOTS = [
  { value: 'asap', label: 'ASAP (30-40 min)' },
  { value: '18:00', label: '6:00 – 6:15 PM' },
  { value: '18:20', label: '6:20 – 6:35 PM' },
  { value: '18:40', label: '6:40 – 6:55 PM' },
  { value: '19:00', label: '7:00 – 7:15 PM' },
] as const
