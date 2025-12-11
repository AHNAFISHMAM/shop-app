import { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { parsePrice } from '../../lib/priceUtils';
import { getCartItemNote } from '../../lib/cartItemMetadata';
import QuantityStepper from './QuantityStepper';
import PriceDisplay from './PriceDisplay';
import ItemActions from './ItemActions';

/**
 * Enhanced Cart Item Card Component
 * Modern design with all new features
 */
const CartItemCard = memo(({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  onAddNote,
  getImageUrl,
  isUpdating = false,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [itemNote, setItemNote] = useState(null);
  const removeTimeoutRef = useRef(null);
  const product = item.menu_items || item.dishes;

  // Load note for this item
  useEffect(() => {
    const note = getCartItemNote(item.id);
    setItemNote(note);
  }, [item.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle null/undefined product gracefully
  if (!product) {
    return null;
  }
  
  const productName = product.name || 'Unknown Item';
  const productPrice = parsePrice(product.price);
  const productCurrency = product.currency || 'BDT';
  const imageUrl = getImageUrl ? getImageUrl(product) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
  
  // Stock status (if available)
  const isMenuItem = product?.isMenuItem ?? (product?.category_id !== undefined && product?.is_available !== undefined);
  const stockQuantity = product?.stock_quantity;
  const hasFiniteStock = stockQuantity !== null && stockQuantity !== undefined;
  const isOutOfStock = isMenuItem ? product?.is_available === false : (hasFiniteStock && stockQuantity === 0);
  const isLowStock = hasFiniteStock && stockQuantity > 0 && stockQuantity <= 5;

  const handleRemove = () => {
    setIsRemoving(true);
    // Wait for animation before removing
    removeTimeoutRef.current = setTimeout(() => {
      onRemoveItem(item.id);
    }, 300);
  };

  const handleQuantityChange = (newQuantity) => {
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleSaveForLaterClick = () => {
    if (onSaveForLater) {
      onSaveForLater(item.id);
    }
  };

  const handleAddNoteClick = (note) => {
    if (onAddNote) {
      onAddNote(item.id, note);
      // Refresh note display
      const updatedNote = getCartItemNote(item.id);
      setItemNote(updatedNote);
    }
  };

  if (isRemoving) {
    return null;
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`cart-item-card-v2 ${isUpdating ? 'updating' : ''}`}
      style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <div className="cart-item-flex-container">
        {/* Product Image */}
        <div className="cart-item-image-v2">
          <img
            src={imageUrl}
            alt={`${productName} dish image`}
            className="cart-item-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
            }}
          />
        </div>

        {/* Product Info and Controls */}
        <div className="cart-item-content-v2">
          <div className="cart-item-header">
            <div className="cart-item-info">
              <h4 className="cart-item-title-v2">
                {productName}
              </h4>
              {itemNote && (
                <p className="cart-item-note-display">
                  📝 {itemNote}
                </p>
              )}
              {/* Stock Status Indicator */}
              {hasFiniteStock && (
                <div className="cart-stock-status-container" role="status" aria-live="polite">
                  {isOutOfStock ? (
                    <span className="cart-stock-status cart-stock-status-out" aria-label="Out of stock">
                      <svg className="cart-stock-status-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="cart-stock-status cart-stock-status-low" aria-label={`Low stock: Only ${stockQuantity} left`}>
                      <svg className="cart-stock-status-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Only {stockQuantity} left
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="cart-item-actions-container">
              <ItemActions
                onRemove={handleRemove}
                onSaveForLater={handleSaveForLaterClick}
                onAddNote={handleAddNoteClick}
                itemName={productName}
                hasNote={!!itemNote}
                showSaveForLater={!!onSaveForLater}
              />
            </div>
          </div>

          <div className="cart-item-footer">
            {/* Quantity Controls */}
            <QuantityStepper
              value={item.quantity}
              onChange={handleQuantityChange}
              min={1}
              max={hasFiniteStock && !isOutOfStock ? Math.min(99, stockQuantity) : 99}
              disabled={isUpdating || isOutOfStock}
              loading={isUpdating}
              aria-label={`Quantity of ${productName}`}
            />

            {/* Price Display */}
            <PriceDisplay
              unitPrice={productPrice}
              quantity={item.quantity}
              currency={productCurrency}
              showBreakdown={true}
              size="default"
            />
          </div>
        </div>
      </div>
    </motion.li>
  );
});

CartItemCard.displayName = 'CartItemCard';

CartItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    product_id: PropTypes.string, // optional (old system)
    menu_item_id: PropTypes.string, // optional (new system)
    quantity: PropTypes.number.isRequired,
    // Old system (dishes table)
    dishes: PropTypes.shape({
      name: PropTypes.string.isRequired,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      currency: PropTypes.string,
      description: PropTypes.string,
      image_url: PropTypes.string,
      images: PropTypes.arrayOf(PropTypes.string),
    }),
    // New system (menu_items table)
    menu_items: PropTypes.shape({
      name: PropTypes.string.isRequired,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      currency: PropTypes.string,
      description: PropTypes.string,
      image_url: PropTypes.string,
      is_available: PropTypes.bool,
      stock_quantity: PropTypes.number,
    }),
  }).isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onSaveForLater: PropTypes.func,
  onAddNote: PropTypes.func,
  getImageUrl: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
};

export default CartItemCard;

