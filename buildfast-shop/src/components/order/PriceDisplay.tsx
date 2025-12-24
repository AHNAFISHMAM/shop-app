import { useMemo } from 'react'
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils'

/**
 * PriceDisplay component props
 */
interface PriceDisplayProps {
  /** Unit price of the item */
  unitPrice: number
  /** Quantity of items */
  quantity: number
  /** Currency code (default: 'BDT') */
  currency?: string
  /** Whether to show price breakdown (default: true) */
  showBreakdown?: boolean
  /** Size variant */
  size?: 'small' | 'default' | 'large'
}

/**
 * Enhanced Price Display Component
 *
 * Shows unit price, quantity, and total with visual breakdown.
 * Displays different layouts based on quantity and size.
 *
 * Features:
 * - Unit price display
 * - Quantity multiplication
 * - Total calculation
 * - Size variants
 * - Accessibility compliant (semantic HTML)
 *
 * @example
 * ```tsx
 * <PriceDisplay
 *   unitPrice={25.99}
 *   quantity={3}
 *   currency="BDT"
 *   showBreakdown={true}
 *   size="default"
 * />
 * ```
 */
const PriceDisplay = ({
  unitPrice,
  quantity,
  currency = 'BDT',
  showBreakdown = true,
  size = 'default',
}: PriceDisplayProps) => {
  // Memoize calculations
  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity])
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])
  const formattedUnitPrice = useMemo(() => formatPrice(unitPrice, 0), [unitPrice])
  const formattedTotal = useMemo(() => formatPrice(total, 0), [total])

  const sizeClasses = useMemo(
    () => ({
      small: 'cart-price-display-small',
      default: 'cart-price-display-default',
      large: 'cart-price-display-large',
    }),
    []
  )

  return (
    <div
      className="cart-price-display"
      role="text"
      aria-label={`Price: ${currencySymbol}${formattedTotal}`}
    >
      {showBreakdown && quantity > 1 && (
        <div
          className="cart-price-breakdown"
          aria-label={`${currencySymbol}${formattedUnitPrice} per item, quantity ${quantity}`}
        >
          <span>
            {currencySymbol}
            {formattedUnitPrice} × {quantity}
          </span>
        </div>
      )}
      <div
        className={`cart-price-total ${sizeClasses[size]}`}
        aria-label={`Total: ${currencySymbol}${formattedTotal}`}
      >
        {currencySymbol}
        {formattedTotal}
      </div>
      {showBreakdown && quantity === 1 && (
        <div
          className="cart-price-unit"
          aria-label={`Unit price: ${currencySymbol}${formattedUnitPrice}`}
        >
          {currencySymbol}
          {formattedUnitPrice} each
        </div>
      )}
    </div>
  )
}

export default PriceDisplay
