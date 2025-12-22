import { useState, useEffect, useCallback, useMemo } from 'react';
import { m, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import CartItemCard from './CartItemCard';

/**
 * Cart item interface
 */
interface CartItem {
  id: string;
  quantity: number;
  menu_items?: {
    name?: string;
    [key: string]: unknown;
  };
  dishes?: {
    name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * SwipeableCartItem component props
 */
interface SwipeableCartItemProps {
  /** Cart item data */
  item: CartItem;
  /** Callback when quantity is updated */
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  /** Callback when item is removed */
  onRemoveItem: (itemId: string) => void;
  /** Optional callback when item is saved for later */
  onSaveForLater?: (itemId: string) => void;
  /** Optional callback when note is added */
  onAddNote?: (itemId: string, note: string) => void;
  /** Function to get image URL for product */
  getImageUrl: (product: unknown) => string;
  /** Whether item is currently being updated */
  isUpdating?: boolean;
  /** Swipe threshold in pixels (default: 100) */
  swipeThreshold?: number;
}

/**
 * Swipeable Cart Item Wrapper
 *
 * Adds swipe gestures for mobile (swipe left to remove, swipe right to save).
 * Provides visual feedback during swipe with action buttons appearing.
 *
 * Features:
 * - Swipe left to remove item
 * - Swipe right to save for later
 * - Visual feedback during swipe
 * - Smooth animations
 * - Accessibility compliant (ARIA, keyboard navigation)
 * - Performance optimized (memoized callbacks)
 * - Respects prefers-reduced-motion
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
}: SwipeableCartItemProps) => {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Transform values for opacity and scale of action buttons
  const removeOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0]);
  const saveOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
    },
    [item.id, onRemoveItem, onSaveForLater, swipeThreshold, x]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (onSaveForLater) {
      onSaveForLater(item.id);
      x.set(0);
    }
  }, [item.id, onSaveForLater, x]);

  const handleRemoveClick = useCallback(() => {
    if (onRemoveItem) {
      onRemoveItem(item.id);
    }
  }, [item.id, onRemoveItem]);

  // Reset on item change
  useEffect(() => {
    x.set(0);
  }, [item.id, x]);

  const productName = useMemo(() => {
    return item.menu_items?.name || item.dishes?.name || 'item';
  }, [item.menu_items?.name, item.dishes?.name]);

  const saveLabel = useMemo(() => `Save ${productName} for later`, [productName]);
  const removeLabel = useMemo(() => `Remove ${productName}`, [productName]);

  return (
    <div className="cart-item-swipeable" role="listitem">
      {/* Swipe Actions Background */}
      <div className="cart-item-swipe-actions" role="group" aria-label="Swipe actions">
        {onSaveForLater ? (
          <m.button
            type="button"
            className="cart-swipe-action-btn cart-swipe-action-save min-h-[44px] min-w-[44px]"
            onClick={handleSaveClick}
            aria-label={saveLabel}
            style={{ opacity: saveOpacity }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
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
        ) : null}
        {onRemoveItem ? (
          <m.button
            type="button"
            className="cart-swipe-action-btn cart-swipe-action-remove min-h-[44px] min-w-[44px]"
            onClick={handleRemoveClick}
            aria-label={removeLabel}
            style={{ opacity: removeOpacity }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
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
        ) : null}
      </div>

      {/* Swipeable Content */}
      <m.div
        className="cart-item-swipe-content"
        drag={prefersReducedMotion ? false : 'x'}
        dragConstraints={prefersReducedMotion ? undefined : { left: -swipeThreshold, right: swipeThreshold }}
        dragElastic={prefersReducedMotion ? 0 : 0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileDrag={prefersReducedMotion ? undefined : { cursor: 'grabbing' }}
        animate={prefersReducedMotion ? undefined : { x: isDragging ? undefined : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
      >
        <CartItemCard
          item={item as never}
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

export default SwipeableCartItem;

