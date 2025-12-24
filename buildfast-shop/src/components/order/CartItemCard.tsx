import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { m } from 'framer-motion'
import { parsePrice } from '../../lib/priceUtils'
import { getCartItemNote } from '../../lib/cartItemMetadata'
import type { CartItem, GetImageUrlFunction } from '../../types/cart'
import QuantityStepper from './QuantityStepper'
import PriceDisplay from './PriceDisplay'
import ItemActions from './ItemActions'

/**
 * CartItemCard component props
 */
interface CartItemCardProps {
  /** Cart item data */
  item: CartItem
  /** Callback when quantity is updated */
  onUpdateQuantity: (itemId: string, newQuantity: number) => void
  /** Callback when item is removed */
  onRemoveItem: (itemId: string) => void
  /** Optional callback when item is saved for later */
  onSaveForLater?: (itemId: string) => void
  /** Optional callback when note is added */
  onAddNote?: (itemId: string, note: string) => void
  /** Function to get image URL for product */
  getImageUrl: GetImageUrlFunction
  /** Whether item is currently being updated */
  isUpdating?: boolean
}

/**
 * Enhanced Cart Item Card Component
 *
 * Modern design with all new features including quantity controls,
 * price display, stock status, and item actions.
 *
 * Features:
 * - Product image display
 * - Quantity stepper controls
 * - Price breakdown
 * - Stock status indicators
 * - Item notes
 * - Save for later
 * - Remove item
 * - Smooth animations
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized values and callbacks)
 */
const CartItemCard = memo(
  ({
    item,
    onUpdateQuantity,
    onRemoveItem,
    onSaveForLater,
    onAddNote,
    getImageUrl,
    isUpdating = false,
  }: CartItemCardProps) => {
    const [isRemoving, setIsRemoving] = useState<boolean>(false)
    const [itemNote, setItemNote] = useState<string | null>(null)
    const removeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const product = item.menu_items || item.dishes

    // Load note for this item
    useEffect(() => {
      const note = getCartItemNote(item.id)
      setItemNote(note)
    }, [item.id])

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (removeTimeoutRef.current) {
          clearTimeout(removeTimeoutRef.current)
        }
      }
    }, [])

    // Handle null/undefined product gracefully
    if (!product) {
      return null
    }

    // Memoized product data
    const productName = useMemo(() => product.name || 'Unknown Item', [product.name])
    const productPrice = useMemo(() => parsePrice(product.price), [product.price])
    const productCurrency = useMemo(() => product.currency || 'BDT', [product.currency])
    const imageUrl = useMemo(() => {
      if (!getImageUrl) {
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'
      }
      // getImageUrl accepts CartItem | Product | { [key: string]: unknown }
      // We can pass either item (CartItem) or product (Product)
      // Passing item to maintain compatibility with existing callers
      return getImageUrl(item)
    }, [getImageUrl, item])

    // Stock status (if available)
    const isMenuItem = useMemo(() => {
      return (
        product?.isMenuItem ??
        (product?.category_id !== undefined && product?.is_available !== undefined)
      )
    }, [product?.isMenuItem, product?.category_id, product?.is_available])

    // Note: menu_items don't have stock_quantity, this is for legacy products only
    const stockQuantity = useMemo(() => {
      if (isMenuItem) return null // menu_items don't track stock
      return product?.stock_quantity
    }, [isMenuItem, product?.stock_quantity])
    const hasFiniteStock = useMemo(
      () => stockQuantity !== null && stockQuantity !== undefined,
      [stockQuantity]
    )
    const isOutOfStock = useMemo(() => {
      return isMenuItem ? product?.is_available === false : hasFiniteStock && stockQuantity === 0
    }, [isMenuItem, product?.is_available, hasFiniteStock, stockQuantity])

    const isLowStock = useMemo(() => {
      return (
        hasFiniteStock &&
        stockQuantity !== null &&
        stockQuantity !== undefined &&
        stockQuantity > 0 &&
        stockQuantity <= 5
      )
    }, [hasFiniteStock, stockQuantity])

    const maxQuantity = useMemo(() => {
      return hasFiniteStock &&
        !isOutOfStock &&
        stockQuantity !== null &&
        stockQuantity !== undefined
        ? Math.min(99, stockQuantity)
        : 99
    }, [hasFiniteStock, isOutOfStock, stockQuantity])

    // Check for reduced motion preference
    const prefersReducedMotion = useMemo(() => {
      return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    }, [])

    const handleRemove = useCallback(() => {
      setIsRemoving(true)
      // Wait for animation before removing
      removeTimeoutRef.current = setTimeout(() => {
        onRemoveItem(item.id)
      }, 300)
    }, [item.id, onRemoveItem])

    const handleQuantityChange = useCallback(
      (newQuantity: number) => {
        onUpdateQuantity(item.id, newQuantity)
      },
      [item.id, onUpdateQuantity]
    )

    const handleSaveForLaterClick = useCallback(() => {
      if (onSaveForLater) {
        onSaveForLater(item.id)
      }
    }, [item.id, onSaveForLater])

    const handleAddNoteClick = useCallback(
      (note: string) => {
        if (onAddNote) {
          onAddNote(item.id, note)
          // Refresh note display
          const updatedNote = getCartItemNote(item.id)
          setItemNote(updatedNote)
        }
      },
      [item.id, onAddNote]
    )

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement
      target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'
    }, [])

    if (isRemoving) {
      return null
    }

    return (
      <m.li
        layout={!prefersReducedMotion}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, x: -100, height: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
        className={`cart-item-card-v2 ${isUpdating ? 'updating' : ''}`}
        style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        role="listitem"
        aria-label={`${productName}, quantity ${item.quantity}`}
      >
        <div className="cart-item-flex-container">
          {/* Product Image */}
          <div className="cart-item-image-v2">
            <img
              src={imageUrl}
              alt={`${productName} dish image`}
              className="cart-item-image"
              loading="lazy"
              onError={handleImageError}
            />
          </div>

          {/* Product Info and Controls */}
          <div className="cart-item-content-v2">
            <div className="cart-item-header">
              <div className="cart-item-info">
                <h4 className="cart-item-title-v2">{productName}</h4>
                {itemNote && (
                  <p
                    className="cart-item-note-display"
                    role="note"
                    aria-label={`Note: ${itemNote}`}
                  >
                    📝 {itemNote}
                  </p>
                )}
                {/* Stock Status Indicator */}
                {hasFiniteStock && (
                  <div className="cart-stock-status-container" role="status" aria-live="polite">
                    {isOutOfStock ? (
                      <span
                        className="cart-stock-status cart-stock-status-out"
                        aria-label="Out of stock"
                      >
                        <svg
                          className="cart-stock-status-icon"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Out of Stock
                      </span>
                    ) : isLowStock && stockQuantity !== null && stockQuantity !== undefined ? (
                      <span
                        className="cart-stock-status cart-stock-status-low"
                        aria-label={`Low stock: Only ${stockQuantity} left`}
                      >
                        <svg
                          className="cart-stock-status-icon"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
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
                max={maxQuantity}
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
      </m.li>
    )
  }
)

CartItemCard.displayName = 'CartItemCard'

export default CartItemCard
