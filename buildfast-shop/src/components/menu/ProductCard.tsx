import { memo, useMemo, useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils'

/**
 * Product interface
 */
export interface Product {
  id: string
  name: string
  description?: string
  price: number | string
  currency?: string
  stock_quantity?: number
  low_stock_threshold?: number
  images?: string[]
  chef_special?: boolean
  is_available?: boolean
  is_featured?: boolean
  image_url?: string
  spice_level?: number
  prep_time?: number
  dietary_tags?: string[]
  allergens?: string[]
  allergen_tags?: string[]
  allergen_info?: string
  customization_options?: {
    extras?: ExtraOption[]
  }
  available_extras?: ExtraOption[]
  review_snippet?: string
  reviewSnippet?: string
  review_highlight?: string
  reviewHighlight?: string
  [key: string]: unknown
}

/**
 * Extra option interface
 */
interface ExtraOption {
  id: string | number
  label: string
  price?: number | string
}

/**
 * ProductCard component props
 */
interface ProductCardProps {
  /** Product data */
  product: Product
  /** Callback when item is added to cart */
  onAddToCart: (product: Product) => void
  /** Function to get image URL for product */
  getImageUrl: (product: Product) => string
  /** Whether to enable customization options (default: false) */
  enableCustomization?: boolean
  /** Whether to use compact layout (default: false) */
  compact?: boolean
}

/**
 * Resolve allergens from product data
 */
const resolveAllergens = (product: Product): string[] => {
  if (Array.isArray(product?.allergens)) return product.allergens
  if (Array.isArray(product?.allergen_tags)) return product.allergen_tags
  if (typeof product?.allergen_info === 'string') {
    return product.allergen_info
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Build extras options from product data
 */
const buildExtras = (product: Product): ExtraOption[] => {
  if (Array.isArray(product?.customization_options?.extras)) {
    return product.customization_options.extras
  }
  if (Array.isArray(product?.available_extras)) {
    return product.available_extras
  }

  return [
    { id: 'extra-rice', label: 'Extra Jasmine Rice', price: 2.5 },
    { id: 'extra-sauce', label: 'Extra Sauce', price: 1.5 },
    { id: 'add-side', label: 'Add Seasonal Side', price: 3.5 },
  ]
}

/**
 * Format extra price display
 */
const formatExtraPrice = (price: number | string | undefined | null, currency = 'BDT'): string => {
  if (price === undefined || price === null || Number.isNaN(Number(price))) return ''
  return `+${getCurrencySymbol(currency || 'BDT')}${formatPrice(Number(price), 2)}`
}

/**
 * ProductCard Component
 *
 * Displays a product card with image, details, customization options, and add to cart functionality.
 *
 * Features:
 * - Product image with hover effects
 * - Stock status indicators
 * - Dietary tags and allergen badges
 * - Customization options (extras, spice level)
 * - Review snippets
 * - Add to cart button
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized values and callbacks)
 * - Respects prefers-reduced-motion
 */
const ProductCard = memo(
  ({
    product,
    onAddToCart,
    getImageUrl,
    enableCustomization = false,
    compact = false,
  }: ProductCardProps) => {
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
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    }, [])

    // Memoized product data
    const imageUrl = useMemo(() => getImageUrl(product), [getImageUrl, product])
    const isOutOfStock = useMemo(() => {
      return product.stock_quantity !== undefined
        ? product.stock_quantity === 0
        : product.is_available === false
    }, [product.stock_quantity, product.is_available])

    const isFeatured = useMemo(
      () => product.is_featured || product.chef_special,
      [product.is_featured, product.chef_special]
    )
    const [customizerOpen, setCustomizerOpen] = useState<boolean>(false)
    const extrasOptions = useMemo(() => buildExtras(product), [product])
    const [selectedExtras, setSelectedExtras] = useState<(string | number)[]>([])
    const [preferredSpiceLevel, setPreferredSpiceLevel] = useState<number>(
      typeof product.spice_level === 'number' ? product.spice_level : 1
    )
    const allergenBadges = useMemo(() => resolveAllergens(product), [product])
    const reviewSnippet = useMemo(() => {
      return (
        product.review_snippet ||
        product.reviewSnippet ||
        product.review_highlight ||
        product.reviewHighlight ||
        null
      )
    }, [
      product.review_snippet,
      product.reviewSnippet,
      product.review_highlight,
      product.reviewHighlight,
    ])

    const toggleExtra = useCallback((extraId: string | number) => {
      setSelectedExtras(prev =>
        prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
      )
    }, [])

    const selectedExtrasSummary = useMemo(() => {
      if (!selectedExtras.length) return 'No add-ons selected'
      return selectedExtras
        .map(id => extrasOptions.find(option => option.id === id)?.label || String(id))
        .join(', ')
    }, [selectedExtras, extrasOptions])

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement
      target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'
    }, [])

    const handleAddToCart = useCallback(() => {
      onAddToCart(product)
    }, [onAddToCart, product])

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (prefersReducedMotion) return
        e.currentTarget.style.backgroundColor = isLightTheme
          ? 'rgba(var(--bg-dark-rgb), 0.04)'
          : 'rgba(var(--text-main-rgb), 0.04)'
        e.currentTarget.style.boxShadow = isLightTheme
          ? '0 35px 70px -40px rgba(var(--accent-rgb), 0.5), 0 0 0 1px rgba(var(--accent-rgb), 0.3)'
          : '0 35px 70px -40px rgba(var(--accent-rgb), 0.75)'
      },
      [isLightTheme, prefersReducedMotion]
    )

    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = ''
      e.currentTarget.style.boxShadow = ''
    }, [])

    const imageBackgroundColor = useMemo(() => {
      return isLightTheme ? 'rgba(var(--text-main-rgb), 0.95)' : 'rgba(var(--bg-dark-rgb), 0.95)'
    }, [isLightTheme])

    const spiceLevelText = useMemo(() => {
      if (preferredSpiceLevel === 0) return 'Mild'
      if (preferredSpiceLevel === 1) return 'Medium'
      if (preferredSpiceLevel === 2) return 'Hot'
      if (preferredSpiceLevel === 3) return 'Fiery'
      return 'Medium'
    }, [preferredSpiceLevel])

    const isLowStock = useMemo(() => {
      return (
        !isOutOfStock &&
        product.stock_quantity !== undefined &&
        product.stock_quantity <= (product.low_stock_threshold || 10)
      )
    }, [isOutOfStock, product.stock_quantity, product.low_stock_threshold])

    return (
      <article
        className={`group border border-[var(--border-default)] bg-[var(--bg-elevated)] backdrop-blur-sm overflow-hidden transition-transform transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-rotate-1 hover:border-[var(--accent)]/60 min-w-0 h-full flex flex-col will-change-transform ${
          compact
            ? 'rounded-lg sm:rounded-xl hover:-translate-y-1'
            : 'rounded-xl sm:rounded-2xl hover:-translate-y-2'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="article"
        aria-labelledby={`product-${product.id}-name`}
      >
        <div
          className="relative aspect-square w-full overflow-hidden"
          style={{
            backgroundColor: imageBackgroundColor,
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:brightness-110"
            loading="lazy"
            onError={handleImageError}
          />

          <AnimatePresence>
            {isFeatured && (
              <m.div
                key="featured"
                className={`absolute bg-[var(--accent)] text-black rounded-md text-sm font-bold flex items-center gap-1 z-10 min-h-[44px] min-w-[44px] ${
                  compact ? 'top-1 left-1 px-1 py-0.5' : 'top-2 left-2 px-2 py-1 sm:text-base'
                }`}
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, x: -10 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                aria-label="Chef's Pick"
              >
                <span>⭐</span>
                <span>Chef&apos;s Pick</span>
              </m.div>
            )}

            {isOutOfStock && (
              <m.div
                key="out-of-stock"
                className={`absolute bg-[var(--status-error-bg)] text-[var(--color-red)] rounded-md text-sm font-bold z-10 min-h-[44px] min-w-[44px] ${
                  compact ? 'top-1 right-1 px-1 py-0.5' : 'top-2 right-2 px-2 py-1 sm:text-base'
                }`}
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, x: 10 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }}
                aria-label="Out of stock"
              >
                Unavailable
              </m.div>
            )}

            {product.spice_level !== undefined && product.spice_level > 0 && !isOutOfStock && (
              <m.div
                key="spice-level"
                className={`absolute bg-[var(--color-red)]/90 text-[var(--color-red)] rounded-md text-sm font-bold backdrop-blur-sm z-10 min-h-[44px] min-w-[44px] ${
                  compact ? 'top-1 right-1 px-1 py-0.5' : 'top-2 right-2 px-2 py-1 sm:text-base'
                }`}
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, x: 10 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }}
                aria-label={`Spice level: ${product.spice_level}`}
              >
                {'🌶️'.repeat(product.spice_level)}
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className={`flex flex-col flex-1 ${compact ? 'px-2 sm:px-3 py-1.5 sm:py-2' : 'px-4 sm:px-6 py-3 sm:py-4'}`}
        >
          <h3
            id={`product-${product.id}-name`}
            className={`font-bold text-[var(--text-main)] line-clamp-2 ${
              compact
                ? 'text-sm sm:text-base mb-1 min-h-[1.75rem]'
                : 'text-base sm:text-lg mb-2 min-h-[3.5rem]'
            }`}
          >
            {product.name}
          </h3>

          <p
            className={`text-[var(--text-muted)] line-clamp-2 ${
              compact
                ? 'text-sm mb-1.5 min-h-[1.25rem]'
                : 'text-sm sm:text-base mb-3 min-h-[2.5rem]'
            }`}
          >
            {product.description ||
              'Delicious dish prepared with quality ingredients and served fresh.'}
          </p>

          <m.div
            className={`flex flex-wrap mb-3 ${
              compact ? 'gap-1.5 sm:gap-2 min-h-[0.75rem]' : 'gap-3 sm:gap-4 min-h-[1.5rem]'
            }`}
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.1 }}
            role="group"
            aria-label="Dietary tags"
          >
            {product.dietary_tags && product.dietary_tags.length > 0 && (
              <>
                {product.dietary_tags.slice(0, 3).map((tag, index) => (
                  <m.span
                    key={tag}
                    className={`py-0.5 text-sm bg-[var(--status-success-bg)] text-[var(--color-emerald)] border border-[var(--status-success-border)] rounded-full capitalize min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      compact ? 'px-1' : 'px-2 sm:text-base'
                    }`}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 5 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.3, delay: 0.15 + index * 0.05 }
                    }
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                    aria-label={`Dietary tag: ${tag}`}
                  >
                    {tag.replace('-', ' ')}
                  </m.span>
                ))}
                {product.dietary_tags.length > 3 && (
                  <m.span
                    className={`py-0.5 text-sm bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-default)] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      compact ? 'px-1' : 'px-2 sm:text-base'
                    }`}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 5 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                    transition={
                      prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.3 }
                    }
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                    aria-label={`${product.dietary_tags.length - 3} more dietary tags`}
                  >
                    +{product.dietary_tags.length - 3} more
                  </m.span>
                )}
              </>
            )}

            {product.prep_time && (
              <m.span
                className={`py-0.5 text-sm bg-[var(--color-blue)]/20 text-[var(--color-blue)] border border-[var(--color-blue)]/30 rounded-full flex items-center gap-1 min-h-[44px] min-w-[44px] ${
                  compact ? 'px-1' : 'px-2 sm:text-base'
                }`}
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 5 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                aria-label={`Preparation time: ${product.prep_time} minutes`}
              >
                <span>⏱️</span>
                <span>{product.prep_time}m</span>
              </m.span>
            )}
          </m.div>

          {/* Allergen badges, stock info, review snippet, and customization - Before price/button */}
          {allergenBadges.length > 0 && (
            <m.div
              className={`flex flex-wrap ${
                compact ? 'mb-1.5 gap-1.5 sm:gap-2' : 'mb-3 gap-3 sm:gap-4'
              }`}
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.25 }}
              role="group"
              aria-label="Allergen information"
            >
              {allergenBadges.slice(0, 4).map((tag, index) => (
                <m.span
                  key={tag}
                  className={`py-0.5 text-sm uppercase tracking-wide bg-[var(--status-warning-bg)] text-[var(--color-amber)] border border-[var(--status-warning-border)] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    compact ? 'px-1' : 'px-2 sm:text-base'
                  }`}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 5 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.3, delay: 0.3 + index * 0.05 }
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                  aria-label={`Allergen: ${tag}`}
                >
                  {tag}
                </m.span>
              ))}
              {allergenBadges.length > 4 && (
                <m.span
                  className={`py-0.5 text-sm uppercase tracking-wide text-[var(--text-muted)] border border-[var(--border-default)] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    compact ? 'px-1' : 'px-2 sm:text-base'
                  }`}
                  style={{
                    backgroundColor: isLightTheme
                      ? 'rgba(var(--bg-dark-rgb), 0.04)'
                      : 'rgba(var(--text-main-rgb), 0.05)',
                  }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 5 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.5 }
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                  aria-label={`${allergenBadges.length - 4} more allergens`}
                >
                  +{allergenBadges.length - 4}
                </m.span>
              )}
            </m.div>
          )}

          {isLowStock && (
            <p
              className={`text-sm text-[var(--color-orange)] ${
                compact ? 'mb-1' : 'mb-2 sm:text-base'
              }`}
              role="status"
              aria-live="polite"
            >
              {product.stock_quantity !== undefined
                ? `Only ${product.stock_quantity} left in stock!`
                : 'Limited stock available!'}
            </p>
          )}

          {reviewSnippet && (
            <p
              className={`text-sm italic text-[var(--text-main)]/70 line-clamp-2 ${
                compact ? 'mb-1.5' : 'mb-3 sm:text-base'
              }`}
              role="note"
            >
              &ldquo;{reviewSnippet}&rdquo;
            </p>
          )}

          {enableCustomization && (
            <m.div
              className={`border-t border-[var(--border-default)] ${
                compact ? 'mt-2 pt-2' : 'mt-4 pt-4'
              }`}
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
            >
              <m.button
                type="button"
                onClick={() => setCustomizerOpen(prev => !prev)}
                className={`flex w-full items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] font-medium text-[var(--text-main)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                  compact
                    ? 'min-h-[44px] px-2 sm:px-3 py-1.5 text-sm sm:text-base'
                    : 'min-h-[44px] px-4 sm:px-6 py-3 text-base sm:text-lg'
                }`}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onMouseEnter={e => {
                  if (prefersReducedMotion) return
                  e.currentTarget.style.backgroundColor = isLightTheme
                    ? 'rgba(var(--bg-dark-rgb), 0.08)'
                    : 'rgba(var(--text-main-rgb), 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = ''
                }}
                aria-expanded={customizerOpen}
                aria-controls={`customizer-${product.id}`}
                aria-label={
                  customizerOpen ? 'Close customization options' : 'Open customization options'
                }
              >
                <span>Customize</span>
                <m.svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={prefersReducedMotion ? undefined : { rotate: customizerOpen ? 180 : 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </m.svg>
              </m.button>

              <AnimatePresence>
                {customizerOpen && (
                  <m.div
                    id={`customizer-${product.id}`}
                    className={`${compact ? 'mt-1.5 space-y-2' : 'mt-3 space-y-4'}`}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, height: 'auto' }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                    role="region"
                    aria-label="Customization options"
                  >
                    <m.div
                      className="space-y-2"
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={
                        prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.1 }
                      }
                    >
                      <p className="text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Add-ons
                      </p>
                      <div
                        className={`flex flex-wrap ${
                          compact ? 'gap-1.5 sm:gap-2' : 'gap-3 sm:gap-4'
                        }`}
                        role="group"
                        aria-label="Add-on options"
                      >
                        {extrasOptions.map((extra, index) => {
                          const isActive = selectedExtras.includes(extra.id)
                          return (
                            <m.button
                              key={extra.id}
                              type="button"
                              onClick={() => toggleExtra(extra.id)}
                              className={`rounded-full border text-sm font-medium transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                compact ? 'px-2 sm:px-3 py-1.5' : 'px-4 sm:px-6 py-3 sm:text-base'
                              } ${
                                isActive
                                  ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]'
                                  : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]'
                              }`}
                              initial={
                                prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 5 }
                              }
                              animate={
                                prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }
                              }
                              transition={
                                prefersReducedMotion
                                  ? { duration: 0 }
                                  : { duration: 0.3, delay: 0.15 + index * 0.05 }
                              }
                              whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                              onMouseEnter={e => {
                                if (!isActive && !prefersReducedMotion) {
                                  e.currentTarget.style.backgroundColor = isLightTheme
                                    ? 'rgba(var(--bg-dark-rgb), 0.08)'
                                    : 'rgba(var(--text-main-rgb), 0.1)'
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = ''
                                }
                              }}
                              aria-pressed={isActive}
                              aria-label={`${isActive ? 'Remove' : 'Add'} ${extra.label}`}
                            >
                              <span>{extra.label}</span>
                              {extra.price ? (
                                <span className="ml-2 text-sm sm:text-base uppercase text-[var(--text-muted)]/80">
                                  {formatExtraPrice(extra.price, product.currency)}
                                </span>
                              ) : null}
                            </m.button>
                          )
                        })}
                      </div>
                    </m.div>

                    <m.div
                      className="space-y-2"
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={
                        prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }
                      }
                    >
                      <p className="text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Spice Level
                      </p>
                      <div
                        className={`flex items-center ${
                          compact ? 'gap-1.5 sm:gap-2' : 'gap-3 sm:gap-4'
                        }`}
                      >
                        <input
                          type="range"
                          min="0"
                          max="3"
                          value={preferredSpiceLevel}
                          onChange={event => setPreferredSpiceLevel(Number(event.target.value))}
                          className={`w-full accent-[var(--accent)] min-h-[44px]`}
                          aria-label={`Spice level: ${spiceLevelText}`}
                          aria-valuemin={0}
                          aria-valuemax={3}
                          aria-valuenow={preferredSpiceLevel}
                        />
                        <span className="text-sm sm:text-base text-[var(--text-muted)] min-w-[60px]">
                          {spiceLevelText}
                        </span>
                      </div>
                    </m.div>

                    <m.p
                      className="text-sm sm:text-base text-[var(--text-muted)]"
                      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                      transition={
                        prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.3 }
                      }
                      role="status"
                      aria-live="polite"
                    >
                      {selectedExtrasSummary}
                    </m.p>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}

          {/* Price and Add to Cart - Always at bottom */}
          <div
            className={`flex items-center justify-between mt-auto ${
              compact ? 'gap-2' : 'gap-3 sm:gap-4'
            }`}
          >
            <div
              className={`font-bold text-[var(--accent)] ${
                compact ? 'text-base sm:text-lg md:text-xl' : 'text-base sm:text-lg md:text-xl'
              }`}
              aria-label={`Price: ${getCurrencySymbol(product.currency || 'BDT')}${formatPrice(Number(product.price), 0)}`}
            >
              {getCurrencySymbol(product.currency || 'BDT')}
              {formatPrice(Number(product.price), 0)}
            </div>

            <m.button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`rounded-lg font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                compact
                  ? 'px-2 sm:px-3 py-1.5 text-sm sm:text-base'
                  : 'px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base'
              } ${
                isOutOfStock
                  ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed'
                  : 'bg-[var(--accent)] text-black hover:bg-[var(--accent)]/90 hover:shadow-[0_20px_35px_-20px_rgba(var(--accent-rgb),0.7)]'
              }`}
              whileHover={
                !isOutOfStock && !prefersReducedMotion ? { scale: 1.06, y: -2 } : undefined
              }
              whileTap={!isOutOfStock && !prefersReducedMotion ? { scale: 0.95 } : undefined}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.2 }}
              aria-label={
                isOutOfStock ? `${product.name} is unavailable` : `Add ${product.name} to cart`
              }
              aria-disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
            </m.button>
          </div>
        </div>
      </article>
    )
  }
)

ProductCard.displayName = 'ProductCard'

export default ProductCard
