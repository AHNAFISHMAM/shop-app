import React, { memo, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Trash2, ShoppingCart } from 'lucide-react'
import { fadeSlideUp } from '../animations/menuAnimations'
import { parsePrice, formatPrice, formatPriceWithCurrency } from '../../lib/priceUtils'
import { removeFavorite } from '../../lib/favoritesUtils'
import { addProductToCart, addMenuItemToCart } from '../../lib/cartUtils'
import { useAuth } from '../../hooks/useAuth'
import { logger } from '../../utils/logger'

interface Product {
  id: string
  name: string
  price: number | string
  currency?: string
  image_url?: string
  images?: string[]
  is_available?: boolean
  stock_quantity?: number
  [key: string]: unknown
}

interface FavoriteCardProps {
  favorite: {
    id: string
    product_id: string | null
    menu_item_id: string | null
    product?: Product | null
    menu_item?: Product | null
  }
  index: number
  onRemove: (favoriteId: string) => void
}

const FavoriteCard = memo(({ favorite, index, onRemove }: FavoriteCardProps) => {
  const { user } = useAuth()
  const [isRemoving, setIsRemoving] = useState(false)
  const [isMovingToCart, setIsMovingToCart] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isMenuItem = !!favorite.menu_item_id
  const item = isMenuItem ? favorite.menu_item : favorite.product

  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!user || isRemoving || isMovingToCart) return

      try {
        setIsRemoving(true)
        await removeFavorite(favorite.id, user.id)
        onRemove(favorite.id)
      } catch (error) {
        logger.error('Failed to remove favorite:', error)
        setMessage('Failed to remove. Please try again.')
        setTimeout(() => setMessage(null), 3000)
      } finally {
        setIsRemoving(false)
      }
    },
    [favorite.id, user, onRemove, isRemoving, isMovingToCart]
  )

  const handleMoveToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!user || !item || isRemoving || isMovingToCart) return

      const isOutOfStock = isMenuItem
        ? item.is_available === false
        : typeof item.stock_quantity === 'number' && item.stock_quantity <= 0

      if (isOutOfStock) {
        setMessage('This item is currently unavailable')
        setTimeout(() => setMessage(null), 3000)
        return
      }

      try {
        setIsMovingToCart(true)
        let cartResult

        if (isMenuItem) {
          cartResult = await addMenuItemToCart(
            {
              id: item.id,
              name: item.name ?? '',
              price: Number(item.price ?? 0),
              is_available: item.is_available ?? true,
              is_featured: (item as { is_featured?: boolean }).is_featured ?? false,
              created_at: (item as { created_at?: string }).created_at ?? new Date().toISOString(),
              updated_at: (item as { updated_at?: string }).updated_at ?? new Date().toISOString(),
              category_id: (item as { category_id?: string | null }).category_id ?? null,
              description: (item as { description?: string | null }).description ?? null,
              image_url: (item as { image_url?: string | null }).image_url ?? null,
            },
            user.id
          )
        } else {
          cartResult = await addProductToCart(
            {
              id: item.id,
              name: item.name ?? '',
              price: Number(item.price ?? 0),
              is_available: item.is_available ?? true,
              stock_quantity: (() => {
                const sq = (item as { stock_quantity?: number | null }).stock_quantity
                return sq !== null && sq !== undefined ? sq : undefined
              })(),
              created_at: (item as { created_at?: string }).created_at ?? new Date().toISOString(),
              updated_at: (item as { updated_at?: string }).updated_at ?? new Date().toISOString(),
              category_id: (item as { category_id?: string | null }).category_id ?? null,
              description: (item as { description?: string | null }).description ?? null,
              image_url: (item as { image_url?: string | null }).image_url ?? null,
            },
            user.id
          )
        }

        if (cartResult.stockExceeded) {
          setMessage(`Only ${cartResult.stockLimit} item(s) available in stock`)
          setTimeout(() => setMessage(null), 5000)
          return
        }

        if (cartResult.error) {
          throw cartResult.error
        }

        if (cartResult.success) {
          await removeFavorite(favorite.id, user.id)
          onRemove(favorite.id)
          setMessage('Moved to cart!')
        }
      } catch (error) {
        logger.error('Error moving to cart:', error)
        setMessage('Failed to move to cart. Please try again.')
        setTimeout(() => setMessage(null), 3000)
      } finally {
        setIsMovingToCart(false)
      }
    },
    [favorite.id, user, item, isMenuItem, onRemove, isRemoving, isMovingToCart]
  )

  if (!item) {
    return null
  }

  const price = parsePrice(item.price)
  const formattedPrice = item.currency
    ? formatPriceWithCurrency(price, item.currency)
    : formatPrice(price)
  const itemId = item.id
  const itemPath = isMenuItem ? `/menu/${itemId}` : `/products/${itemId}`
  const isOutOfStock = isMenuItem
    ? item.is_available === false
    : typeof item.stock_quantity === 'number' && item.stock_quantity <= 0

  const getProductImage = (product: Product | null | undefined): string => {
    if (!product) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
    }
    if (product.image_url) {
      return product.image_url
    }
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      return product.images[0]
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
  }

  return (
    <m.li
      variants={fadeSlideUp}
      custom={index * 0.05}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="group relative"
    >
      <article className="glow-surface glow-soft flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_28px_55px_-45px_rgba(var(--accent-rgb),0.65)] sm:rounded-2xl">
        <Link
          to={itemPath}
          className="relative aspect-square overflow-hidden bg-[var(--bg-main)]/20"
          aria-label={`View details for ${item.name}`}
        >
          <img
            src={getProductImage(item)}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
            onError={e => {
              ;(e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'
            }}
          />
        </Link>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <Link to={itemPath}>
            <h3 className="min-h-[3.5rem] text-sm font-semibold leading-snug text-[var(--text-main)] transition hover:text-[var(--accent)] sm:text-base">
              {item.name}
            </h3>
          </Link>

          <div
            className="mb-3 text-lg font-semibold text-[var(--accent)] sm:text-xl"
            aria-label={`Price: ${formattedPrice}`}
          >
            {formattedPrice}
          </div>

          {/* Availability Status */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <>
                  <svg
                    className="h-4 w-4 text-[var(--color-red)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p
                    className="text-xs font-medium text-[var(--color-red)] sm:text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    Currently unavailable
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 text-[var(--color-emerald)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p
                    className="text-xs font-medium text-[var(--color-emerald)] sm:text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    Available Now
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-3 rounded-lg px-3 py-2 text-xs font-medium sm:text-sm ${
                message.includes('Moved') || message.includes('cart')
                  ? 'bg-[var(--status-success-bg)] text-[var(--color-emerald)] ring-1 ring-[var(--status-success-border)]'
                  : 'bg-[var(--status-error-bg)] text-[var(--color-red)] ring-1 ring-[var(--status-error-border)]'
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto space-y-2 sm:space-y-3">
            <button
              onClick={handleMoveToCart}
              disabled={isMovingToCart || isRemoving || isOutOfStock}
              className={`flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition sm:rounded-2xl sm:text-base ${
                isMovingToCart || isRemoving || isOutOfStock
                  ? 'cursor-not-allowed bg-white/10 text-[var(--text-muted)]'
                  : 'bg-[var(--accent)] text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]'
              }`}
              aria-label={
                isOutOfStock
                  ? 'Product is out of stock'
                  : isMovingToCart
                    ? 'Moving to cart'
                    : `Move ${item.name} to cart`
              }
              aria-disabled={isMovingToCart || isRemoving || isOutOfStock}
              type="button"
            >
              {isMovingToCart ? (
                <>
                  <div
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
                    aria-hidden="true"
                  />
                  Moving to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Move to Cart
                </>
              )}
            </button>

            <button
              onClick={handleRemove}
              disabled={isRemoving || isMovingToCart}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] disabled:opacity-50 sm:rounded-2xl sm:text-base"
              aria-label={
                isRemoving ? 'Removing from favorites' : `Remove ${item.name} from favorites`
              }
              aria-disabled={isRemoving || isMovingToCart}
              type="button"
            >
              {isRemoving ? (
                <>
                  <div
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    </m.li>
  )
})

FavoriteCard.displayName = 'FavoriteCard'

export default FavoriteCard
