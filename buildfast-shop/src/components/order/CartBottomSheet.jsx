import { useCallback, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
 * Cart Bottom Sheet Component (Mobile)
 * Slide-up modal showing cart items and checkout button
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
}) => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useStoreSettings();
  
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
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
    (itemId, newQuantity) => {
      onUpdateQuantity(itemId, newQuantity);
    },
    [onUpdateQuantity]
  );

  // Handle remove item with useCallback
  const handleRemoveItem = useCallback(
    (itemId) => {
      onRemoveItem(itemId);
    },
    [onRemoveItem]
  );

  // Handle save for later
  const handleSaveForLater = useCallback((itemId) => {
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
  const handleAddNote = useCallback((itemId, note) => {
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
  const handleApplyReward = useCallback((rewardId) => {
    try {
      const reward = loyalty?.redeemableRewards?.find((r) => r.id === rewardId);
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="cart-bottom-sheet">
      {/* Backdrop */}
      <m.div
        className="cart-bottom-sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <m.div
        className="cart-bottom-sheet-content"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          boxShadow: isLightTheme 
            ? '0 -10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
            : '0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(197, 157, 95, 0.1)'
        }}
      >
        {/* Handle */}
        <div className="cart-bottom-sheet-handle">
          <div className="cart-bottom-sheet-handle-bar" />
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
              className="cart-close-btn"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.05)';
              }}
              aria-label="Close cart"
            >
              <svg
                className="cart-close-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            aria-live="assertive"
          >
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="cart-error-retry"
              aria-label="Retry"
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
              className="cart-btn-primary"
              aria-label="Proceed to checkout"
              disabled={cartItems.length === 0 || isUpdating}
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

CartBottomSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      product_id: PropTypes.string, // optional (old system)
      menu_item_id: PropTypes.string, // optional (new system)
      quantity: PropTypes.number.isRequired,
      // Old system (dishes table)
      dishes: PropTypes.shape({
        name: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
          .isRequired,
      }),
      // New system (menu_items table)
      menu_items: PropTypes.shape({
        name: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
          .isRequired,
      }),
    })
  ).isRequired,
  cartSummary: PropTypes.shape({
    subtotal: PropTypes.number.isRequired,
    deliveryFee: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    loyalty: PropTypes.shape({
      tier: PropTypes.string,
      currentPoints: PropTypes.number,
      nextTierThreshold: PropTypes.number,
      nextTierLabel: PropTypes.string,
      pointsEarnedThisOrder: PropTypes.number,
      progressPercent: PropTypes.number,
      pointsToNextTier: PropTypes.number,
      redeemableRewards: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          cost: PropTypes.number.isRequired,
        })
      ),
      newlyUnlockedRewards: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          cost: PropTypes.number.isRequired,
        })
      ),
    }),
  }).isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
  error: PropTypes.string,
};

export default CartBottomSheet;
