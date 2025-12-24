import { useState, useEffect, useMemo } from 'react'
import ProductCard from '../menu/ProductCard'

/**
 * Dish/Product interface
 */
interface Dish {
  id: string
  name: string
  description?: string
  price: number | string
  stock_quantity?: number
  chef_special?: boolean
  dietary_tags?: string[]
  spice_level?: number
  prep_time?: number
  is_available?: boolean
  [key: string]: unknown
}

/**
 * SectionCarousel component props
 */
interface SectionCarouselProps {
  /** Section name */
  sectionName: string
  /** Array of dishes to display */
  dishes: Dish[]
  /** Whether section is available (default: true) */
  isAvailable?: boolean
  /** Custom message for empty/unavailable state */
  customMessage?: string
  /** Callback when item is added to cart */
  onAddToCart: (product: Dish) => void
  /** Function to get image URL for product */
  getImageUrl: (product: Dish) => string
  /** Whether section is expanded by default (default: true) */
  defaultExpanded?: boolean
}

/**
 * Professional Section Carousel Component
 *
 * Netflix-style horizontal scrolling carousel for displaying product sections.
 * Mobile-optimized with swipe support and smart visibility controls.
 *
 * Features:
 * - Horizontal scrolling carousel
 * - Responsive card sizing
 * - Empty state handling
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, semantic HTML)
 * - Performance optimized (memoized values)
 * - Respects prefers-reduced-motion
 */
const SectionCarousel = ({
  sectionName,
  dishes,
  isAvailable = true,
  customMessage,
  onAddToCart,
  getImageUrl,
  defaultExpanded = true,
}: SectionCarouselProps) => {
  // Theme detection - must be before early returns
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

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

  // Memoized values - must be before early returns
  const isExpanded = useMemo(() => defaultExpanded, [defaultExpanded])
  const hasDishes = useMemo(() => {
    if (!Array.isArray(dishes)) return false
    return dishes.length > 0
  }, [dishes])
  const showContent = useMemo(
    () => isExpanded && isAvailable && hasDishes,
    [isExpanded, isAvailable, hasDishes]
  )
  const showEmpty = useMemo(
    () => isExpanded && (!isAvailable || !hasDishes),
    [isExpanded, isAvailable, hasDishes]
  )

  const emptyMessage = useMemo(() => {
    if (!sectionName || typeof sectionName !== 'string') return ''
    return customMessage || `No ${sectionName.toLowerCase()} available right now`
  }, [customMessage, sectionName])

  const emptyStateBackgroundColor = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.04)' : 'rgba(var(--text-main-rgb), 0.05)'
  }, [isLightTheme])

  const emptyStateBorderColor = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.1)' : undefined
  }, [isLightTheme])

  // Validate required props - after all hooks
  if (!sectionName || typeof sectionName !== 'string') {
    return null
  }

  if (!Array.isArray(dishes)) {
    return null
  }

  if (typeof onAddToCart !== 'function' || typeof getImageUrl !== 'function') {
    return null
  }

  // Hide empty sections completely from Order page
  if (!hasDishes) {
    return null // Don't render empty sections at all
  }

  return (
    <section
      className="mb-6 animate-fade-in"
      aria-labelledby={`section-${sectionName.toLowerCase().replace(/\s+/g, '-')}-heading`}
    >
      {/* Section Header - Clean & Professional */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <h2
          id={`section-${sectionName.toLowerCase().replace(/\s+/g, '-')}-heading`}
          className="text-2xl md:text-3xl font-bold text-[var(--accent)]"
        >
          {sectionName}
        </h2>
        {hasDishes && (
          <span
            className="px-3 py-1.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full text-sm md:text-base font-semibold min-h-[44px] flex items-center justify-center"
            aria-label={`${dishes.length} items in ${sectionName}`}
          >
            {dishes.length}
          </span>
        )}
      </div>

      {/* Products Carousel with Always-Visible Controls */}
      {showContent && (
        <div
          className="relative max-w-full overflow-hidden"
          role="region"
          aria-label={`${sectionName} products`}
        >
          {/* RESPONSIVE CONTAINER - Square cards (1:1) - Shows 2.5 cards desktop, 1.3 mobile */}
          <div
            className="overflow-x-auto scroll-smooth flex gap-4 sm:gap-6 pb-4 px-6 snap-x snap-mandatory"
            role="list"
            aria-label={`${sectionName} product list`}
          >
            {dishes.map(dish => (
              <div
                key={dish.id}
                className="flex-shrink-0 w-[calc((100%-3rem)/2)] sm:w-[calc((100%-4rem-1.5rem)/4)] lg:w-[186.5px] snap-start"
                role="listitem"
              >
                <ProductCard
                  product={dish}
                  onAddToCart={onAddToCart}
                  getImageUrl={getImageUrl}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty/Unavailable State - Inline Message */}
      {showEmpty && (
        <div
          className="border border-[var(--border-default)] rounded-xl p-6 text-center"
          style={{
            backgroundColor: emptyStateBackgroundColor,
            borderColor: emptyStateBorderColor,
          }}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[var(--text-muted)] italic">{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}

export default SectionCarousel
