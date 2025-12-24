import { useCallback, useState, useEffect, useMemo } from 'react'
import { m } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { staggerContainer, fadeSlideUp, batchFadeSlideUp } from '../animations/menuAnimations'

/**
 * Product interface
 */
interface Product {
  id: string
  name: string
  description?: string
  price: number | string
  stock_quantity?: number
  chef_special?: boolean
  [key: string]: unknown
}

/**
 * ChefsPicks component props
 */
interface ChefsPicksProps {
  /** Array of products to display */
  products: Product[]
  /** Callback when item is added to cart */
  onAddToCart: (product: Product) => void
  /** Function to get image URL for product */
  getImageUrl: (product: Product) => string
}

/**
 * Chef's Picks Section Component
 *
 * Displays featured products marked as chef_special.
 * Compact card design for visual distinction from regular menu items.
 *
 * Features:
 * - Responsive grid layout (2 cols mobile, 4 cols desktop)
 * - Product cards with images and details
 * - Add to cart functionality
 * - Navigation to product detail pages
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 * - Respects prefers-reduced-motion
 */
const ChefsPicks = ({ products, onAddToCart, getImageUrl }: ChefsPicksProps) => {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])

  const navigate = useNavigate()

  // Handle card click with useCallback
  const handleCardClick = useCallback(
    (productId: string) => {
      navigate(`/products/${productId}`)
    },
    [navigate]
  )

  // Handle add to cart with event stop propagation
  const handleAddClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, product: Product) => {
      e.stopPropagation()
      onAddToCart(product)
    },
    [onAddToCart]
  )

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'
  }, [])

  const cardBackgroundColor = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.04)' : 'rgba(var(--text-main-rgb), 0.05)'
  }, [isLightTheme])

  const formatPrice = useCallback((price: number | string): string => {
    if (typeof price === 'number') {
      return price.toFixed(2)
    }
    return parseFloat(price || '0').toFixed(2)
  }, [])

  if (!products || products.length === 0) {
    return null
  }

  return (
    <m.section
      variants={prefersReducedMotion ? undefined : staggerContainer}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      aria-labelledby="chefs-picks-heading"
    >
      {/* Section Header */}
      <m.h3
        id="chefs-picks-heading"
        className="text-2xl font-bold text-[var(--accent)] mb-6 text-center flex items-center justify-center gap-2"
        variants={prefersReducedMotion ? undefined : fadeSlideUp}
        custom={prefersReducedMotion ? undefined : 0.1}
      >
        <m.span
          animate={prefersReducedMotion ? undefined : { rotate: [0, 10, -10, 10, 0] }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 2, repeat: Infinity, repeatDelay: 3 }
          }
          aria-hidden="true"
        >
          ⭐
        </m.span>
        Chef&apos;s Picks
        <m.span
          animate={prefersReducedMotion ? undefined : { rotate: [0, -10, 10, -10, 0] }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 2, repeat: Infinity, repeatDelay: 3 }
          }
          aria-hidden="true"
        >
          ⭐
        </m.span>
      </m.h3>

      {/* Products Grid - Responsive: 2 cols mobile, 4 cols desktop */}
      <m.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        role="list"
        aria-label="Chef's picks products"
      >
        {products.map((item, index) => {
          const isOutOfStock = item.stock_quantity === 0
          const imageUrl = getImageUrl(item)

          return (
            <m.article
              key={item.id}
              className="border border-[var(--border-default)] rounded-xl overflow-hidden group cursor-pointer hover:border-[var(--accent)]/50 transition-all duration-300 min-h-[44px]"
              style={{
                backgroundColor: cardBackgroundColor,
              }}
              onClick={() => handleCardClick(item.id)}
              variants={prefersReducedMotion ? undefined : batchFadeSlideUp}
              custom={prefersReducedMotion ? undefined : index * 0.08}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -5, rotate: 1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              role="listitem"
              aria-label={`${item.name}, ${isOutOfStock ? 'out of stock' : 'in stock'}`}
            >
              {/* Product Image */}
              <div className="mb-3 rounded-xl overflow-hidden relative">
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={handleImageError}
                />

                {/* Chef's Pick Badge */}
                <m.div
                  className="absolute top-2 right-2 bg-[var(--accent)]/90 backdrop-blur text-black px-2 py-1 rounded-full text-sm font-bold z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, x: 10 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 5 }}
                  aria-label="Chef's Pick"
                >
                  ⭐ Chef&apos;s Pick
                </m.div>
              </div>

              {/* Product Info */}
              <div className="px-3 pb-3">
                {/* Product Name */}
                <m.h4
                  className="text-sm font-semibold mb-1 text-[var(--text-main)] line-clamp-1"
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 5 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.1 }
                  }
                >
                  {item.name}
                </m.h4>

                {/* Product Description */}
                {item.description && (
                  <m.p
                    className="text-sm text-[var(--text-muted)] mb-2 line-clamp-2"
                    initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                    transition={
                      prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.15 }
                    }
                  >
                    {item.description}
                  </m.p>
                )}

                {/* Price and Add Button */}
                <m.div
                  className="flex justify-between items-center"
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 5 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }
                  }
                >
                  <p
                    className="text-sm font-bold text-[var(--accent)]"
                    aria-label={`Price: ৳${formatPrice(item.price)}`}
                  >
                    ৳{formatPrice(item.price)}
                  </p>
                  <m.button
                    type="button"
                    onClick={e => handleAddClick(e, item)}
                    disabled={isOutOfStock}
                    className={`text-sm px-3 py-1.5 rounded-full font-semibold transition min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                      isOutOfStock
                        ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'bg-[var(--accent)] text-black hover:bg-[var(--accent)]/90'
                    }`}
                    aria-label={
                      isOutOfStock ? `${item.name} is out of stock` : `Add ${item.name} to cart`
                    }
                    aria-disabled={isOutOfStock}
                    whileHover={
                      !isOutOfStock && !prefersReducedMotion ? { scale: 1.1, y: -2 } : undefined
                    }
                    whileTap={!isOutOfStock && !prefersReducedMotion ? { scale: 0.95 } : undefined}
                  >
                    {isOutOfStock ? 'Out' : 'Add'}
                  </m.button>
                </m.div>
              </div>
            </m.article>
          )
        })}
      </m.div>
    </m.section>
  )
}

export default ChefsPicks
