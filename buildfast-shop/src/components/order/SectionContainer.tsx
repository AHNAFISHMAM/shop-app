import { useMemo } from 'react'
import { m } from 'framer-motion'
import SectionCarousel from './SectionCarousel'
import { gridReveal, batchFadeSlideUp } from '../animations/menuAnimations'

/**
 * Dish interface
 */
interface Dish {
  id: string
  name: string
  description?: string
  price: number | string
  is_available?: boolean
  is_todays_menu?: boolean
  is_daily_special?: boolean
  is_new_dish?: boolean
  is_discount_combo?: boolean
  is_limited_time?: boolean
  is_happy_hour?: boolean
  [key: string]: unknown
}

/**
 * Section configuration interface
 */
interface SectionConfig {
  section_key: string
  section_name: string
  is_available?: boolean
  custom_message?: string
  display_order?: number
}

/**
 * Section data interface
 */
interface SectionData {
  key: string
  name: string
  dishes: Dish[]
  isAvailable: boolean
  customMessage?: string
  displayOrder: number
}

/**
 * SectionContainer component props
 */
interface SectionContainerProps {
  /** All dishes to filter */
  allDishes: Dish[]
  /** Section configurations */
  sectionConfigs?: SectionConfig[]
  /** Callback when item is added to cart */
  onAddToCart: (product: Dish) => void
  /** Function to get image URL for product */
  getImageUrl: (product: Dish) => string
}

/**
 * Section Container Component - Professional Version
 *
 * Smart expand: sections with dishes auto-expand, empty ones collapse.
 * Persists user preferences to localStorage.
 *
 * Features:
 * - Filters dishes into special sections
 * - Configurable section display
 * - Empty state handling
 * - Smooth animations
 * - Accessibility compliant (ARIA, semantic HTML)
 * - Performance optimized (memoized filtering)
 * - Respects prefers-reduced-motion
 */
const SectionContainer = ({
  allDishes,
  sectionConfigs = [],
  onAddToCart,
  getImageUrl,
}: SectionContainerProps) => {
  const safeAddToCart = useMemo(() => {
    return typeof onAddToCart === 'function' ? onAddToCart : () => {}
  }, [onAddToCart])

  const safeGetImageUrl = useMemo(() => {
    return typeof getImageUrl === 'function' ? getImageUrl : () => ''
  }, [getImageUrl])

  // Filter dishes for each section
  const sectionData = useMemo<SectionData[]>(() => {
    const sections: SectionData[] = []
    const validDishes = allDishes.filter((dish): dish is Dish => dish && typeof dish === 'object')
    const validConfigs = Array.isArray(sectionConfigs) ? sectionConfigs : []

    // Define the section order and their corresponding dish filter flags
    const sectionMapping = [
      {
        key: 'todays_menu',
        name: "Today's Menu",
        filter: (dish: Dish) => dish.is_todays_menu === true,
      },
      {
        key: 'daily_specials',
        name: 'Daily Specials',
        filter: (dish: Dish) => dish.is_daily_special === true,
      },
      {
        key: 'new_dishes',
        name: 'New Dishes',
        filter: (dish: Dish) => dish.is_new_dish === true,
      },
      {
        key: 'discount_combos',
        name: 'Discount Combos',
        filter: (dish: Dish) => dish.is_discount_combo === true,
      },
      {
        key: 'limited_time',
        name: 'Limited-Time Meals',
        filter: (dish: Dish) => dish.is_limited_time === true,
      },
      {
        key: 'happy_hour',
        name: 'Happy Hour Offers',
        filter: (dish: Dish) => dish.is_happy_hour === true,
      },
    ]

    // For each section, filter dishes and get configuration
    sectionMapping.forEach(section => {
      const config = validConfigs.find(c => c && c.section_key === section.key)
      const filteredDishes = validDishes.filter(
        dish => dish && dish.is_available !== false && section.filter(dish)
      )

      sections.push({
        key: section.key,
        name: config?.section_name || section.name,
        dishes: filteredDishes,
        isAvailable: config?.is_available !== false,
        customMessage: config?.custom_message,
        displayOrder: config?.display_order ?? sections.length,
      })
    })

    // Sort by display order
    return sections.sort((a, b) => a.displayOrder - b.displayOrder)
  }, [allDishes, sectionConfigs])

  // Count total dishes across all available sections
  const totalDishes = useMemo(() => {
    return sectionData.reduce((sum, section) => {
      return sum + (section.isAvailable ? section.dishes.length : 0)
    }, 0)
  }, [sectionData])

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])

  // Don't render if no sections have dishes
  if (totalDishes === 0) {
    return (
      <div
        className="rounded-2xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] min-h-[44px] min-w-[44px]">
          <svg
            className="h-8 w-8 text-[var(--status-warning-border)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--status-warning-border)] mb-2">
          No Special Sections Available
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          No dishes have been assigned to special sections yet.
          <br />
          Go to Admin → Special Sections to assign dishes.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Total dishes in database: {allDishes.length}
        </p>
      </div>
    )
  }

  return (
    <m.div
      className="space-y-6"
      variants={prefersReducedMotion ? undefined : gridReveal}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      role="region"
      aria-label="Special sections"
    >
      {/* All Sections - Clean & Professional */}
      {sectionData.map(section => (
        <m.div
          key={section.key}
          variants={prefersReducedMotion ? undefined : batchFadeSlideUp}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          whileInView={prefersReducedMotion ? undefined : 'visible'}
          viewport={
            prefersReducedMotion
              ? undefined
              : { once: true, amount: 0.3, margin: '0px 0px -10% 0px' }
          }
          exit={prefersReducedMotion ? undefined : 'exit'}
        >
          <SectionCarousel
            sectionName={section.name}
            dishes={section.dishes}
            isAvailable={section.isAvailable}
            customMessage={section.customMessage}
            onAddToCart={safeAddToCart}
            getImageUrl={safeGetImageUrl}
            defaultExpanded={true}
          />
        </m.div>
      ))}
    </m.div>
  )
}

export default SectionContainer
