import { useMemo } from 'react'
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils'

/**
 * CartTotals component props
 */
interface CartTotalsProps {
  /** Subtotal amount */
  subtotal: number
  /** Delivery fee amount */
  deliveryFee: number
  /** Total amount */
  total: number
  /** Currency code (default: 'BDT') */
  currency?: string
  /** Discount amount (default: 0) */
  discount?: number
  /** Whether to show trust badges (default: true) */
  showTrustBadges?: boolean
}

/**
 * Enhanced Cart Totals Component
 *
 * Displays price breakdown with trust badges and promo code.
 * Shows subtotal, discount, delivery fee, and total with secure checkout indicators.
 *
 * Features:
 * - Price breakdown display
 * - Discount handling
 * - Free delivery indicator
 * - Trust badges (secure checkout, money back)
 * - Accessibility compliant (ARIA, semantic HTML)
 * - Performance optimized (memoized values)
 *
 * @example
 * ```tsx
 * <CartTotals
 *   subtotal={150.00}
 *   deliveryFee={10.00}
 *   total={160.00}
 *   currency="BDT"
 *   discount={15.00}
 *   showTrustBadges={true}
 * />
 * ```
 */
const CartTotals = ({
  subtotal,
  deliveryFee,
  total,
  currency = 'BDT',
  discount = 0,
  showTrustBadges = true,
}: CartTotalsProps) => {
  // Memoize formatted values
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])
  const formattedSubtotal = useMemo(() => formatPrice(subtotal, 0), [subtotal])
  const formattedDiscount = useMemo(() => formatPrice(discount, 0), [discount])
  const formattedDeliveryFee = useMemo(() => formatPrice(deliveryFee, 0), [deliveryFee])
  const formattedTotal = useMemo(() => formatPrice(total, 0), [total])
  const isFreeDelivery = useMemo(() => deliveryFee === 0, [deliveryFee])
  const hasDiscount = useMemo(() => discount > 0, [discount])

  return (
    <section className="cart-totals" aria-labelledby="cart-totals-heading">
      <h2 id="cart-totals-heading" className="sr-only">
        Cart Totals
      </h2>
      {/* Price Breakdown */}
      <div className="cart-totals-breakdown" role="table" aria-label="Price breakdown">
        <div className="cart-totals-row" role="row">
          <span className="cart-totals-label" role="rowheader">
            Subtotal
          </span>
          <span
            className="cart-totals-value"
            role="cell"
            aria-label={`Subtotal: ${currencySymbol}${formattedSubtotal}`}
          >
            {currencySymbol}
            {formattedSubtotal}
          </span>
        </div>

        {hasDiscount && (
          <div className="cart-totals-row" role="row">
            <span className="cart-totals-discount" role="rowheader">
              Discount
            </span>
            <span
              className="cart-totals-discount"
              role="cell"
              aria-label={`Discount: -${currencySymbol}${formattedDiscount}`}
            >
              -{currencySymbol}
              {formattedDiscount}
            </span>
          </div>
        )}

        <div className="cart-totals-row" role="row">
          <span className="cart-totals-label" role="rowheader">
            Delivery
          </span>
          <span
            className="cart-totals-value"
            role="cell"
            aria-label={
              isFreeDelivery
                ? 'Free delivery'
                : `Delivery fee: ${currencySymbol}${formattedDeliveryFee}`
            }
          >
            {isFreeDelivery ? (
              <span className="cart-totals-delivery-free">FREE</span>
            ) : (
              `${currencySymbol}${formattedDeliveryFee}`
            )}
          </span>
        </div>

        <div className="cart-totals-total" role="row">
          <div className="cart-totals-total-row">
            <span className="cart-totals-total-label" role="rowheader">
              Total
            </span>
            <span
              className="cart-totals-total-value"
              role="cell"
              aria-label={`Total: ${currencySymbol}${formattedTotal}`}
            >
              {currencySymbol}
              {formattedTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      {showTrustBadges && (
        <div className="cart-trust-badges" role="group" aria-label="Trust badges">
          <div className="cart-trust-badge" aria-label="Secure checkout">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div className="cart-trust-badge" aria-label="Money back guarantee">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Money Back</span>
          </div>
        </div>
      )}
    </section>
  )
}

export default CartTotals
