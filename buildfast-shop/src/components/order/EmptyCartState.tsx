import { m } from 'framer-motion'

/**
 * EmptyCartState component props
 */
interface EmptyCartStateProps {
  /** Callback when user clicks "Browse Menu" */
  onBrowseMenu?: () => void
  /** Callback when user clicks "View Favorites" */
  onViewFavorites?: () => void
  /** Whether the user has favorites */
  hasFavorites?: boolean
}

/**
 * Enhanced Empty Cart State Component
 *
 * Provides illustrated empty state with quick actions.
 * Displays when the cart is empty with options to browse menu or view favorites.
 *
 * Features:
 * - Animated entrance
 * - Quick action buttons
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Respects prefers-reduced-motion
 */
const EmptyCartState = ({
  onBrowseMenu,
  onViewFavorites,
  hasFavorites = false,
}: EmptyCartStateProps) => {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <m.div
      className="cart-empty-state"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
      role="status"
      aria-live="polite"
      aria-label="Empty cart"
    >
      <m.div
        initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={prefersReducedMotion ? false : { scale: 1, opacity: 1 }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { delay: 0.1, type: 'spring', stiffness: 200 }
        }
        className="cart-empty-icon-container"
        aria-hidden="true"
      >
        <svg
          className="cart-empty-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </m.div>

      <m.h3
        className="cart-empty-title"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={prefersReducedMotion ? false : { opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
      >
        Your cart is empty
      </m.h3>

      <m.p
        className="cart-empty-text"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={prefersReducedMotion ? false : { opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3 }}
      >
        Looks like you haven&apos;t added anything to your cart yet. Start shopping to fill it up!
      </m.p>

      <m.div
        className="cart-empty-actions"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
      >
        {onBrowseMenu && (
          <button
            onClick={onBrowseMenu}
            className="cart-btn-browse min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="Browse menu"
          >
            Browse Menu
          </button>
        )}
        {hasFavorites && onViewFavorites && (
          <button
            onClick={onViewFavorites}
            className="cart-btn-secondary min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="View favorites"
          >
            View Favorites
          </button>
        )}
      </m.div>
    </m.div>
  )
}

export default EmptyCartState
