import { useCallback, useState, useEffect, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { staggerContainer, fadeSlideUp, fadeSlideDown } from '../animations/menuAnimations'

/**
 * Category interface
 */
interface Category {
  id: string
  name: string
  [key: string]: unknown
}

/**
 * CategoryTabs component props
 */
interface CategoryTabsProps {
  /** Array of main categories */
  categories: Category[]
  /** Array of filtered subcategories */
  filteredSubcategories?: Category[]
  /** Currently selected main category */
  selectedMainCategory?: Category | null
  /** Currently selected subcategory */
  selectedSubcategory?: Category | null
  /** Callback when main category is clicked */
  onMainCategoryClick: (category: Category | null) => void
  /** Callback when subcategory is clicked */
  onSubcategoryClick: (subcategory: Category | null) => void
}

/**
 * Category and Subcategory Navigation Tabs
 *
 * Sticky navigation with active state highlighting.
 * Displays main categories and subcategories when a main category is selected.
 *
 * Features:
 * - Sticky positioning
 * - Active state highlighting
 * - Smooth animations
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks and values)
 */
const CategoryTabs = ({
  categories,
  filteredSubcategories = [],
  selectedMainCategory = null,
  selectedSubcategory = null,
  onMainCategoryClick,
  onSubcategoryClick,
}: CategoryTabsProps) => {
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

  // Memoized background colors
  const stickyBg = useMemo(() => {
    return isLightTheme ? 'rgba(var(--text-main-rgb), 0.98)' : 'rgba(var(--bg-dark-rgb), 0.95)'
  }, [isLightTheme])

  const stickyBorder = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.1)' : undefined
  }, [isLightTheme])

  const hoverBg = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.08)' : 'rgba(var(--text-main-rgb), 0.1)'
  }, [isLightTheme])

  const inactiveBg = useMemo(() => {
    return isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.04)' : 'rgba(var(--text-main-rgb), 0.05)'
  }, [isLightTheme])

  // Handle main category click with useCallback
  const handleMainClick = useCallback(
    (category: Category | null) => {
      onMainCategoryClick(category)
    },
    [onMainCategoryClick]
  )

  // Handle subcategory click with useCallback
  const handleSubClick = useCallback(
    (subcategory: Category | null) => {
      onSubcategoryClick(subcategory)
    },
    [onSubcategoryClick]
  )

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <m.nav
      className="sticky top-16 z-20 backdrop-blur-md border-b py-3 sm:py-4"
      style={{
        backgroundColor: stickyBg,
        borderColor: stickyBorder,
      }}
      variants={prefersReducedMotion ? undefined : fadeSlideDown}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      role="navigation"
      aria-label="Category navigation"
    >
      {/* Main Categories */}
      <div className="app-container">
        <m.div
          className="flex items-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate={prefersReducedMotion ? false : 'visible'}
        >
          {/* All Dishes Button */}
          <m.button
            onClick={() => handleMainClick(null)}
            className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
              !selectedMainCategory
                ? 'bg-[var(--accent)] text-black shadow-lg'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            onMouseEnter={e => {
              if (selectedMainCategory) {
                e.currentTarget.style.backgroundColor = hoverBg
              }
            }}
            onMouseLeave={e => {
              if (selectedMainCategory) {
                e.currentTarget.style.backgroundColor = ''
              }
            }}
            variants={prefersReducedMotion ? undefined : fadeSlideUp}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            layout={!prefersReducedMotion}
            aria-label="Show all dishes"
            aria-pressed={!selectedMainCategory}
          >
            All Dishes
          </m.button>

          {/* Category Tabs */}
          {categories.map((category, index) => (
            <m.button
              key={category.id}
              onClick={() => handleMainClick(category)}
              className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                selectedMainCategory?.id === category.id
                  ? 'bg-[var(--accent)] text-black shadow-lg'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              onMouseEnter={e => {
                if (selectedMainCategory?.id !== category.id) {
                  e.currentTarget.style.backgroundColor = hoverBg
                }
              }}
              onMouseLeave={e => {
                if (selectedMainCategory?.id !== category.id) {
                  e.currentTarget.style.backgroundColor = ''
                }
              }}
              variants={prefersReducedMotion ? undefined : fadeSlideUp}
              custom={index * 0.05}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              layout={!prefersReducedMotion}
              aria-label={`Filter by ${category.name}`}
              aria-pressed={selectedMainCategory?.id === category.id}
            >
              {category.name}
            </m.button>
          ))}
        </m.div>

        {/* Subcategories (shown when main category is selected) */}
        <AnimatePresence mode="wait">
          {selectedMainCategory && filteredSubcategories.length > 0 && (
            <m.div
              className="flex items-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide mt-2"
              variants={prefersReducedMotion ? undefined : staggerContainer}
              initial={prefersReducedMotion ? undefined : 'hidden'}
              animate={prefersReducedMotion ? undefined : 'visible'}
              exit={prefersReducedMotion ? undefined : 'hidden'}
            >
              {/* All in Category Button */}
              <m.button
                onClick={() => handleSubClick(null)}
                className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                  !selectedSubcategory
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]'
                    : 'text-[var(--text-muted)]'
                }`}
                style={
                  selectedSubcategory
                    ? {
                        backgroundColor: inactiveBg,
                      }
                    : undefined
                }
                onMouseEnter={e => {
                  if (selectedSubcategory) {
                    e.currentTarget.style.backgroundColor = hoverBg
                  }
                }}
                onMouseLeave={e => {
                  if (selectedSubcategory) {
                    e.currentTarget.style.backgroundColor = inactiveBg
                  }
                }}
                variants={prefersReducedMotion ? undefined : fadeSlideUp}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                layout={!prefersReducedMotion}
                aria-label={`Show all ${selectedMainCategory.name}`}
                aria-pressed={!selectedSubcategory}
              >
                All {selectedMainCategory.name}
              </m.button>

              {/* Subcategory Tabs */}
              {filteredSubcategories.map((subcategory, index) => (
                <m.button
                  key={subcategory.id}
                  onClick={() => handleSubClick(subcategory)}
                  className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                    selectedSubcategory?.id === subcategory.id
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                  style={
                    selectedSubcategory?.id !== subcategory.id
                      ? {
                          backgroundColor: inactiveBg,
                        }
                      : undefined
                  }
                  onMouseEnter={e => {
                    if (selectedSubcategory?.id !== subcategory.id) {
                      e.currentTarget.style.backgroundColor = hoverBg
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedSubcategory?.id !== subcategory.id) {
                      e.currentTarget.style.backgroundColor = inactiveBg
                    }
                  }}
                  variants={prefersReducedMotion ? undefined : fadeSlideUp}
                  custom={index * 0.05}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                  layout={!prefersReducedMotion}
                  aria-label={`Filter by ${subcategory.name}`}
                  aria-pressed={selectedSubcategory?.id === subcategory.id}
                >
                  {subcategory.name}
                </m.button>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.nav>
  )
}

export default CategoryTabs
