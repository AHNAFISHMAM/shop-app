import { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { logger } from '../../utils/logger'
import { saveItemForLater, saveCartItemNote, saveSelectedReward } from '../../lib/cartItemMetadata'
import { resolveLoyaltyState } from '../../lib/loyaltyUtils'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils'
import type { CartItem, GetImageUrlFunction } from '../../types/cart'
import CartItemCard from './CartItemCard'
import EmptyCartState from './EmptyCartState'
import CartTotals from './CartTotals'
import LoyaltyCard from './LoyaltyCard'
import CartSkeleton from './CartSkeleton'

/**
 * Loyalty reward interface
 * Compatible with Reward from loyaltyUtils
 */
interface LoyaltyReward {
  id: string
  label: string
  cost: number
  [key: string]: unknown
}

// Type guard to ensure Reward is compatible with LoyaltyReward
function toLoyaltyReward(reward: { id: string; label: string; cost: number }): LoyaltyReward {
  return { ...reward, [Symbol.for('__loyalty_reward')]: true }
}

/**
 * Loyalty state interface
 */
interface LoyaltyState {
  tier?: string
  currentPoints?: number
  nextTierThreshold?: number
  nextTierLabel?: string
  pointsEarnedThisOrder?: number
  progressPercent?: number
  pointsToNextTier?: number
  redeemableRewards?: LoyaltyReward[]
  newlyUnlockedRewards?: LoyaltyReward[]
}

/**
 * Cart summary interface
 */
interface CartSummary {
  subtotal: number
  deliveryFee: number
  total: number
  loyalty?: LoyaltyState
}

/**
 * CartSidebar component props
 */
interface CartSidebarProps {
  /** Array of cart items */
  cartItems: CartItem[]
  /** Cart summary with totals and loyalty info */
  cartSummary: CartSummary
  /** Callback to update item quantity */
  onUpdateQuantity: (itemId: string, quantity: number) => void
  /** Callback to remove item from cart */
  onRemoveItem: (itemId: string) => void
  /** Function to get image URL for a product */
  getImageUrl: GetImageUrlFunction
  /** Whether cart is currently updating */
  isUpdating?: boolean
  /** Error message to display */
  error?: string | null
}

/**
 * Cart Sidebar Component (Desktop)
 *
 * Sticky sidebar showing cart items and checkout button.
 * Features:
 * - Real-time cart updates with ARIA announcements
 * - Loyalty program integration
 * - Save for later functionality
 * - Item notes
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks, reduced motion support)
 */
const CartSidebar = ({
  cartItems,
  cartSummary,
  onUpdateQuantity,
  onRemoveItem,
  getImageUrl,
  isUpdating = false,
  error = null,
}: CartSidebarProps) => {
  const navigate = useNavigate()
  const { settings, loading: settingsLoading } = useStoreSettings()
  const enableLoyalty = settingsLoading ? false : (settings?.enable_loyalty_program ?? true)

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const loyalty = useMemo(() => {
    if (!enableLoyalty) return null
    if (cartSummary?.loyalty) return cartSummary.loyalty
    return resolveLoyaltyState(cartSummary?.total || 0)
  }, [cartSummary, enableLoyalty])

  // Handle checkout with useCallback
  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      logger.warn('Attempted to checkout with empty cart')
      return
    }
    logger.log('Navigating to checkout', { cartItemsCount: cartItems.length })
    navigate('/checkout')
  }, [navigate, cartItems.length])

  // Handle browse menu with useCallback
  const handleBrowseMenu = useCallback(() => {
    navigate('/menu')
  }, [navigate])

  // Handle remove item
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      onRemoveItem(itemId)
    },
    [onRemoveItem]
  )

  // Handle save for later
  const handleSaveForLater = useCallback(
    (itemId: string) => {
      try {
        const item = cartItems.find(i => i.id === itemId)
        if (!item) return

        const result = saveItemForLater(item)

        if (result.success) {
          // Remove from cart
          onRemoveItem(itemId)
          toast.success('Item saved for later!', { icon: '💾' })
        } else {
          toast.error('Failed to save item for later')
        }
      } catch (error) {
        logger.error('Error saving item for later:', error)
        toast.error('Failed to save item for later')
      }
    },
    [cartItems, onRemoveItem]
  )

  // Handle add note
  const handleAddNote = useCallback((itemId: string, note: string) => {
    try {
      const result = saveCartItemNote(itemId, note)

      if (result.success) {
        toast.success('Note saved!', { icon: '📝', duration: 2000 })
      } else {
        toast.error('Failed to save note')
      }
    } catch (error) {
      logger.error('Error saving note:', error)
      toast.error('Failed to save note')
    }
  }, [])

  // Handle apply reward
  const handleApplyReward = useCallback(
    (rewardId: string) => {
      try {
        const reward = cartSummary?.loyalty?.redeemableRewards?.find(r => r.id === rewardId)
        if (!reward) {
          toast.error('Reward not found')
          return
        }

        const result = saveSelectedReward(toLoyaltyReward(reward))
        if (result.success) {
          toast.success(`${reward.label} will be applied at checkout!`, {
            icon: '🎁',
            duration: 3000,
          })
        } else {
          toast.error('Failed to apply reward')
        }
      } catch (error) {
        logger.error('Error applying reward:', error)
        toast.error('Failed to apply reward')
      }
    },
    [cartSummary]
  )

  // Keyboard handler for checkout
  const handleCheckoutKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleCheckout()
      }
    },
    [handleCheckout]
  )

  // Animation variants with reduced motion support
  const sidebarVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    }
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
  }, [prefersReducedMotion])

  const errorVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    }
    return {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
    }
  }, [prefersReducedMotion])

  return (
    <m.aside
      className="cart-sidebar"
      variants={sidebarVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : 0.35,
      }}
      role="complementary"
      aria-label="Shopping cart"
    >
      <div
        className="cart-sidebar-container"
        style={{ height: 'fit-content', maxHeight: 'calc(100vh - 120px)' }}
      >
        {/* ARIA Live Region for Cart Updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="cart-announcements">
          {cartItems.length > 0 && (
            <span>
              Cart updated: {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart.
              Total: {getCurrencySymbol('BDT')}
              {formatPrice(cartSummary?.total || 0, 0)}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="cart-sidebar-header">
          <h2 className="cart-title">Your Cart</h2>
          <p className="cart-subtitle" id="cart-item-count">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <m.div
            role="alert"
            className="cart-error"
            variants={errorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            aria-live="assertive"
          >
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="cart-error-retry min-h-[44px]"
              aria-label="Retry loading cart"
            >
              Retry
            </button>
          </m.div>
        )}

        {/* Cart Items */}
        {cartItems.length === 0 && !isUpdating ? (
          <EmptyCartState onBrowseMenu={handleBrowseMenu} hasFavorites={false} />
        ) : (
          <>
            {/* Items List - Scrollable Container */}
            <div
              className="cart-items-scrollable"
              role="region"
              aria-label="Cart items"
              aria-describedby="cart-item-count"
            >
              {isUpdating && cartItems.length === 0 ? (
                <ul className="cart-items-list">
                  <CartSkeleton count={3} />
                </ul>
              ) : (
                <AnimatePresence mode="popLayout">
                  <ul className="cart-items-list">
                    {cartItems.map(item => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        onSaveForLater={handleSaveForLater}
                        onAddNote={handleAddNote}
                        getImageUrl={getImageUrl}
                        isUpdating={isUpdating}
                      />
                    ))}
                  </ul>
                </AnimatePresence>
              )}
            </div>

            {/* Totals Section - Fixed at Bottom (Contains Loyalty) */}
            <div className="cart-totals-section">
              {/* Loyalty Snapshot - Inside Totals Section */}
              {enableLoyalty && loyalty && (
                <LoyaltyCard loyalty={loyalty} onApplyReward={handleApplyReward} />
              )}

              {/* Totals */}
              <div className="cart-totals-wrapper">
                <CartTotals
                  subtotal={cartSummary?.subtotal || 0}
                  deliveryFee={cartSummary?.deliveryFee || 0}
                  total={cartSummary?.total || 0}
                  currency="BDT"
                  showTrustBadges={true}
                />

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  onKeyDown={handleCheckoutKeyDown}
                  className="cart-btn-primary min-h-[44px]"
                  aria-label="Proceed to checkout"
                  disabled={cartItems.length === 0 || isUpdating}
                  aria-busy={isUpdating}
                >
                  {cartItems.length === 0 ? 'Cart is Empty' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </m.aside>
  )
}

export default CartSidebar
