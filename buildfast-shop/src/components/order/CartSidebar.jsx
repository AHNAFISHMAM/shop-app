import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { logger } from '../../utils/logger';
import { saveItemForLater, saveCartItemNote, saveSelectedReward } from '../../lib/cartItemMetadata';
import { resolveLoyaltyState } from '../../lib/loyaltyUtils';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils';
import CartItemCard from './CartItemCard';
import EmptyCartState from './EmptyCartState';
import CartTotals from './CartTotals';
import LoyaltyCard from './LoyaltyCard';
import CartSkeleton from './CartSkeleton';

/**
 * Cart Sidebar Component (Desktop)
 * Sticky sidebar showing cart items and checkout button
 */
const CartSidebar = ({
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
    console.log('Navigating to checkout', { cartItemsCount: cartItems.length });
    navigate('/checkout');
  }, [navigate, cartItems.length]);

  // Handle browse menu with useCallback
  const handleBrowseMenu = useCallback(() => {
    navigate('/menu');
  }, [navigate]);

  // Handle remove item
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
      const reward = cartSummary?.loyalty?.redeemableRewards?.find((r) => r.id === rewardId);
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
  }, [cartSummary]);

  // Keyboard handler for checkout
  const handleCheckoutKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCheckout();
    }
  }, [handleCheckout]);

  return (
    <motion.aside
      className="cart-sidebar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      role="complementary"
      aria-label="Shopping cart"
    >
      <div className="cart-sidebar-container" style={{ height: 'fit-content', maxHeight: 'calc(100vh - 120px)' }}>
        {/* ARIA Live Region for Cart Updates */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="cart-announcements"
        >
          {cartItems.length > 0 && (
            <span>
              Cart updated: {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart. 
              Total: {getCurrencySymbol('BDT')}{formatPrice(cartSummary?.total || 0, 0)}
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
          <motion.div
            role="alert"
            className="cart-error"
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
          </motion.div>
        )}

        {/* Cart Items */}
        {cartItems.length === 0 && !isUpdating ? (
          <EmptyCartState
            onBrowseMenu={handleBrowseMenu}
            hasFavorites={false}
          />
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
                    {cartItems.map((item) => (
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
                <LoyaltyCard
                  loyalty={loyalty}
                  onApplyReward={handleApplyReward}
                />
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
                  className="cart-btn-primary"
                  aria-label="Proceed to checkout"
                  disabled={cartItems.length === 0 || isUpdating}
                >
                  {cartItems.length === 0 ? 'Cart is Empty' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
};

CartSidebar.propTypes = {
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

export default CartSidebar;
