import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { m, useMotionValue, useTransform } from 'framer-motion';
import CartItemCard from './CartItemCard';

/**
 * Swipeable Cart Item Wrapper
 * Adds swipe gestures for mobile (swipe left to remove, swipe right to save)
 */
const SwipeableCartItem = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  onAddNote,
  getImageUrl,
  isUpdating = false,
  swipeThreshold = 100,
}) => {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Transform values for opacity and scale of action buttons
  const removeOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0]);
  const saveOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const offset = info.offset.x;

    if (Math.abs(offset) > swipeThreshold) {
      if (offset < 0 && onRemoveItem) {
        // Swipe left - remove (direct removal, toast shown by cart management)
        onRemoveItem(item.id);
      } else if (offset > 0 && onSaveForLater) {
        // Swipe right - save for later
        onSaveForLater(item.id);
        x.set(0);
      } else {
        x.set(0);
      }
    } else {
      x.set(0);
    }
  };

  // Reset on item change
  useEffect(() => {
    x.set(0);
  }, [item.id, x]);

  const productName = item.menu_items?.name || item.dishes?.name || 'item';

  return (
    <div className="cart-item-swipeable">
      {/* Swipe Actions Background */}
      <div className="cart-item-swipe-actions">
        {onSaveForLater && (
          <m.button
            className="cart-swipe-action-btn cart-swipe-action-save"
            onClick={() => onSaveForLater(item.id)}
            aria-label={`Save ${productName} for later`}
            style={{ opacity: saveOpacity }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="cart-swipe-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </m.button>
        )}
        {onRemoveItem && (
          <m.button
            className="cart-swipe-action-btn cart-swipe-action-remove"
            onClick={() => onRemoveItem(item.id)}
            aria-label={`Remove ${productName}`}
            style={{ opacity: removeOpacity }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="cart-swipe-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </m.button>
        )}
      </div>

      {/* Swipeable Content */}
      <m.div
        className="cart-item-swipe-content"
        drag="x"
        dragConstraints={{ left: -swipeThreshold, right: swipeThreshold }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileDrag={{ cursor: 'grabbing' }}
        animate={{ x: isDragging ? undefined : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <CartItemCard
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onSaveForLater={onSaveForLater}
          onAddNote={onAddNote}
          getImageUrl={getImageUrl}
          isUpdating={isUpdating}
        />
      </m.div>
    </div>
  );
};

SwipeableCartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    menu_items: PropTypes.object,
    dishes: PropTypes.object,
  }).isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onSaveForLater: PropTypes.func,
  onAddNote: PropTypes.func,
  getImageUrl: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
  swipeThreshold: PropTypes.number,
};

export default SwipeableCartItem;

