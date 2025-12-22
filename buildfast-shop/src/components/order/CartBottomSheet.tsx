import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { logger } from '../../utils/logger';
import { saveItemForLater, saveCartItemNote, saveSelectedReward } from '../../lib/cartItemMetadata';
import { fadeSlideUp } from '../animations/menuAnimations';
import { resolveLoyaltyState } from '../../lib/loyaltyUtils';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import SwipeableCartItem from './SwipeableCartItem';
import EmptyCartState from './EmptyCartState';
import CartTotals from './CartTotals';
import LoyaltyCard from './LoyaltyCard';
import CartSkeleton from './CartSkeleton';

/**
 * Cart item interface
 */
interface CartItem {
  id: string;
  product_id?: string;
  menu_item_id?: string;
  quantity: number;
  dishes?: {
    name: string;
    price: number | string;
  };
  menu_items?: {
    name: string;
    price: number | string;
  };
}

/**
 * Loyalty reward interface
 */
interface LoyaltyReward {
  id: string;
  label: string;
  cost: number;
}

/**
 * Loyalty state interface
 */
interface LoyaltyState {
  tier?: string;
  currentPoints?: number;
  nextTierThreshold?: number;
  nextTierLabel?: string;
  pointsEarnedThisOrder?: number;
  progressPercent?: number;
  pointsToNextTier?: number;
  redeemableRewards?: LoyaltyReward[];
  newlyUnlockedRewards?: LoyaltyReward[];
}

/**
 * Cart summary interface
 */
interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
  loyalty?: LoyaltyState;
}

/**
 * CartBottomSheet component props
 */
interface CartBottomSheetProps {
  /** Whether the bottom sheet is open */
  isOpen: boolean;
  /** Callback to close the bottom sheet */
  onClose: () => void;
  /** Array of cart items */
  cartItems: CartItem[];
  /** Cart summary with totals and loyalty info */
  cartSummary: CartSummary;
  /** Callback to update item quantity */
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  /** Callback to remove item from cart */
  onRemoveItem: (itemId: string) => void;
  /** Function to get image URL for a product */
  getImageUrl: (item: CartItem) => string;
  /** Whether cart is currently updating */
  isUpdating?: boolean;
  /** Error message to display */
  error?: string | null;
}

/**
 * Cart Bottom Sheet Component (Mobile)
 *
 * Slide-up modal showing cart items and checkout button.
 * Features:
 * - Swipeable cart items
 * - Real-time cart updates with ARIA announcements
 * - Loyalty program integration
 * - Save for later functionality
 * - Item notes
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks, reduced motion support)
 */
const CartBottomSheet = ({
  isOpen,
  onClose,
  cartItems,
  cartSummary,
  onUpdateQuantity,
  onRemoveItem,
  getImageUrl,
  isUpdating = false,
  error = null,
}: CartBottomSheetProps) => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useStoreSettings();

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [isOpen]);

  // Watch for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const enableLoyalty = settingsLoading ? false : (settings?.enable_loyalty_program ?? true);
  const loyalty = useMemo(() => {
    if (!enableLoyalty) return null;
    if (cartSummary?.loyalty) return cartSummary.loyalty;
    return resolveLoyaltyState(cartSummary?.total || 0);
  }, [cartSummary, enableLoyalty]);

  // Handle checkout with useCallback
  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      logger.warn('Attempted to checkout with empty cart');
      return;
    }
    logger.log('Navigating to checkout', { cartItemsCount: cartItems.length });
    onClose();
    navigate('/checkout');
  }, [onClose, navigate, cartItems.length]);

  // Handle update quantity with useCallback
  const handleUpdateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      onUpdateQuantity(itemId, newQuantity);
    },
    [onUpdateQuantity]
  );

  // Handle remove item with useCallback
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      onRemoveItem(itemId);
    },
    [onRemoveItem]
  );

  // Handle save for later
  const handleSaveForLater = useCallback((itemId: string) => {
    try {
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;

      const result = saveItemForLater(item);

      if (result.success) {
        // Remove from cart
        onRemoveItem(itemId);
        toast.success('Item saved for later!', { icon: '💾' });
      } else {
        toast.error('Failed to save item for later');
      }
    } catch (error) {
      logger.error('Error saving item for later:', error);
      toast.error('Failed to save item for later');
    }
  }, [cartItems, onRemoveItem]);

  // Handle add note
  const handleAddNote = useCallback((itemId: string, note: string) => {
    try {
      const result = saveCartItemNote(itemId, note);

      if (result.success) {
        toast.success('Note saved!', { icon: '📝', duration: 2000 });
      } else {
        toast.error('Failed to save note');
      }
    } catch (error) {
      logger.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  }, []);

  // Handle apply reward
  const handleApplyReward = useCallback((rewardId: string) => {
    try {
      const reward = loyalty?.redeemableRewards?.find((r: LoyaltyReward) => r.id === rewardId);
      if (!reward) {
        toast.error('Reward not found');
        return;
      }

      const result = saveSelectedReward(reward);
      if (result.success) {
        toast.success(`${reward.label} will be applied at checkout!`, { icon: '🎁', duration: 3000 });
      } else {
        toast.error('Failed to apply reward');
      }
    } catch (error) {
      logger.error('Error applying reward:', error);
      toast.error('Failed to apply reward');
    }
  }, [loyalty]);

  // Animation variants with reduced motion support
  const backdropVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }, [prefersReducedMotion]);

  const errorVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
    };
  }, [prefersReducedMotion]);

  // Memoized fadeSlideUp variants with reduced motion support
  const sheetVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 0 },
      };
    }
    return fadeSlideUp;
  }, [prefersReducedMotion]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="cart-bottom-sheet" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop */}
      <m.div
        className="cart-bottom-sheet-backdrop"
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
        style={{
          backgroundColor: isLightTheme
            ? 'rgba(var(--bg-dark-rgb), 0.45)'
            : 'rgba(var(--bg-dark-rgb), 0.5)'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <m.div
        className="cart-bottom-sheet-content"
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          boxShadow: isLightTheme
            ? '0 -10px 40px rgba(var(--bg-dark-rgb), 0.2), 0 0 0 1px rgba(var(--bg-dark-rgb), 0.1)'
            : '0 -10px 40px rgba(var(--bg-dark-rgb), 0.5), 0 0 0 1px rgba(var(--accent-rgb), 0.1)'
        }}
      >
        {/* Handle */}
        <div className="cart-bottom-sheet-handle">
          <div className="cart-bottom-sheet-handle-bar" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="cart-bottom-sheet-header">
          <div className="cart-bottom-sheet-header-content">
            <div>
              <h2 className="cart-title">Shopping Cart</h2>
              <p className="cart-subtitle" id="cart-item-count-mobile">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
              </p>
            </div>
            <button
              onClick={onClose}
              className="cart-close-btn min-h-[44px] min-w-[44px]"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(var(--bg-dark-rgb), 0.04)'
                  : 'rgba(var(--text-main-rgb), 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(var(--bg-dark-rgb), 0.08)'
                  : 'rgba(var(--text-main-rgb), 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(var(--bg-dark-rgb), 0.04)'
                  : 'rgba(var(--text-main-rgb), 0.05)';
              }}
              aria-label="Close cart"
            >
              <svg
                className="cart-close-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <m.div
            role="alert"
            className="cart-error"
            style={{ margin: '16px var(--cart-spacing-lg)' }}
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
        <div
          data-overlay-scroll
          className="cart-bottom-sheet-items"
          role="region"
          aria-label="Cart items"
          aria-describedby="cart-item-count-mobile"
        >
          {cartItems.length === 0 && !isUpdating ? (
            <EmptyCartState
              onBrowseMenu={() => {
                onClose();
                navigate('/menu');
              }}
              hasFavorites={false}
            />
          ) : isUpdating && cartItems.length === 0 ? (
            <div className="cart-bottom-sheet-items-list">
              <CartSkeleton count={3} />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="cart-bottom-sheet-items-list">
                {cartItems.map((item) => (
                  <SwipeableCartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onSaveForLater={handleSaveForLater}
                    onAddNote={handleAddNote}
                    getImageUrl={getImageUrl}
                    isUpdating={isUpdating}
                    swipeThreshold={100}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Totals - Fixed at Bottom */}
        <div className="cart-bottom-sheet-totals">
          {enableLoyalty && loyalty && (
            <LoyaltyCard
              loyalty={loyalty}
              onApplyReward={handleApplyReward}
            />
          )}

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
              className="cart-btn-primary min-h-[44px]"
              aria-label="Proceed to checkout"
              disabled={cartItems.length === 0 || isUpdating}
              aria-busy={isUpdating}
            >
              <span>{cartItems.length === 0 ? 'Cart is Empty' : 'Proceed to Checkout'}</span>
              {cartItems.length > 0 && (
                <svg className="cart-swipe-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </m.div>
    </div>
  );
};

export default CartBottomSheet;

