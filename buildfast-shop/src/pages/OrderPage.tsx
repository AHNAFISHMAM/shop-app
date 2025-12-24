/**
 * OrderPage Component
 *
 * Main page for online ordering functionality
 * Features:
 * - Menu item browsing with sections and grid views
 * - Real-time filtering and search
 * - Cart management (guest and authenticated users)
 * - Favorites management
 * - Responsive design with mobile bottom sheet
 *
 * Performance optimizations:
 * - Memoized data fetching functions (useCallback)
 * - Memoized grid batches (useMemo)
 * - Stable function references to prevent infinite loops
 * - Real-time subscriptions with proper cleanup
 *
 * @component
 */
import { useState, useCallback, useMemo, useEffect, memo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useCartManagement } from '../hooks/useCartManagement'
import { useOrderFilters } from '../hooks/useOrderFilters'
import { useFavoritesManagement } from '../hooks/useFavoritesManagement'
import CartSidebar from '../components/order/CartSidebar'
import CartBottomSheet from '../components/order/CartBottomSheet'
import FilterDrawer from '../components/order/FilterDrawer'
import { logger } from '../utils/logger'
import SignupPromptModal from '../components/SignupPromptModal'
import { getCurrencySymbol, formatPrice } from '../lib/priceUtils'
import { m, AnimatePresence } from 'framer-motion'
import {
  pageFade,
  fadeSlideUp,
  menuStagger,
  gridReveal,
  batchFadeSlideUp,
  staggerContainer,
} from '../components/animations/menuAnimations'
import { useMenuItems, useSectionConfigs, useMenuCategories } from '../features/menu/hooks'
import { useTheme } from '../shared/hooks'
import {
  OrderPageHeader,
  OrderPageFilters,
  OrderPageViewToggle,
  ActiveFiltersChips,
} from '../features/menu/components'
import { getMealImage } from '../features/menu/utils/image-utils'
import SectionContainer from '../components/order/SectionContainer'
import ProductCard from '../components/menu/ProductCard'

/**
 * Meal/Product interface
 */
interface Meal {
  id: string | number
  name?: string
  price?: number | string
  category_id?: string | number
  subcategory_id?: string | number
  is_available?: boolean
  is_active?: boolean
  stock_quantity?: number
  [key: string]: unknown
}

const OrderPage = memo((): JSX.Element => {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  // Theme detection using shared hook
  const isLightTheme = useTheme()

  // State management
  const [_addingToCart, setAddingToCart] = useState<Record<string | number, boolean>>({})
  const [_successMessage, setSuccessMessage] = useState<Record<string | number, string>>({})
  const [isCartSheetOpen, setIsCartSheetOpen] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'sections' | 'grid'>('sections')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false)

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : false)
    }

    if (mediaQuery.addEventListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
    return undefined
  }, [])

  // Feature flags - default to true during loading to prevent hiding features that should be shown
  const enableCustomization = settingsLoading
    ? false
    : (settings?.enable_product_customization ?? true)

  // Data fetching using new hooks
  const { meals, loading } = useMenuItems()
  const { sectionConfigs } = useSectionConfigs()
  const { categories: menuCategories } = useMenuCategories()

  // Custom hooks for cart management
  const {
    cartItems,
    cartSummary,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleAddToCart: addToCartFromHook,
  } = useCartManagement(user)

  // Custom hooks for filters and sorting
  const {
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    sortedMeals,
    hasActiveFilters,
    clearAllFilters,
  } = useOrderFilters(meals)

  // Custom hooks for favorites management
  // Note: Currently unused but kept for future favorites integration
  const { favoriteItems: _favoriteItems, togglingFavorites: _togglingFavorites } = useFavoritesManagement(user)

  const totalCartQuantity = useMemo(() => {
    return cartItems.reduce(
      (sum: number, item: { quantity?: number }) => sum + (item.quantity || 0),
      0
    )
  }, [cartItems])

  // Core add to cart logic - no event required
  const handleAddToCart = useCallback(
    async (meal: Meal, event: React.MouseEvent | null = null): Promise<void> => {
      // Handle event if provided (for button clicks)
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Detect if this is a menu_item (has category_id and is_available) or dish (has subcategory_id and is_active)
      const isMenuItem = meal.category_id !== undefined && meal.is_available !== undefined

      // Check availability - backward compatible with both old and new schema
      const isOutOfStock = isMenuItem ? meal.is_available === false : meal.stock_quantity === 0

      if (isOutOfStock) {
        setSuccessMessage(prev => ({ ...prev, [meal.id]: 'This meal is out of stock' }))
        setTimeout(() => {
          setSuccessMessage(prev => {
            const updated = { ...prev }
            delete updated[meal.id]
            return updated
          })
        }, 5000)
        return
      }

      try {
        setAddingToCart(prev => ({ ...prev, [meal.id]: true }))
        setSuccessMessage(prev => {
          const updated = { ...prev }
          delete updated[meal.id]
          return updated
        })

        // Use the hook's handleAddToCart which handles both guest and authenticated users
        await addToCartFromHook(meal, isMenuItem)

        setSuccessMessage(prev => ({ ...prev, [meal.id]: 'Added to order!' }))

        setTimeout(() => {
          setSuccessMessage(prev => {
            const updated = { ...prev }
            delete updated[meal.id]
            return updated
          })
        }, 3000)
      } catch (err) {
        logger.error('Error adding to cart:', err)
        setSuccessMessage(prev => ({
          ...prev,
          [meal.id]: 'Failed to add meal to order. Please try again.',
        }))
        setTimeout(() => {
          setSuccessMessage(prev => {
            const updated = { ...prev }
            delete updated[meal.id]
            return updated
          })
        }, 3000)
      } finally {
        setAddingToCart(prev => {
          const updated = { ...prev }
          delete updated[meal.id]
          return updated
        })
      }
    },
    [addToCartFromHook]
  )

  // Unified handler for both sections and grid views
  const handleAddToCartForViews = useCallback(
    async (meal: Meal): Promise<void> => {
      await handleAddToCart(meal)
    },
    [handleAddToCart]
  )

  /**
   * Memoized grid batches for optimized rendering
   * Splits sorted meals into batches of 3 for grid layout
   * Only recalculates when sortedMeals changes
   */
  const mealGridBatches = useMemo(() => {
    const batches: Meal[][] = []
    for (let i = 0; i < sortedMeals.length; i += 3) {
      batches.push(sortedMeals.slice(i, i + 3))
    }
    return batches
  }, [sortedMeals]) // Recalculate when sorted meals change

  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)] pb-40 pt-12 text-[var(--text-main)]"
      style={{
        overflowX: 'clip',
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowY: 'visible',
      }}
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      role="main"
      aria-label="Order page"
    >
      <m.section
        className="mx-auto max-w-full space-y-10"
        variants={prefersReducedMotion ? {} : menuStagger}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
        exit={prefersReducedMotion ? undefined : 'exit'}
        aria-labelledby="order-page-heading"
      >
        <OrderPageHeader
          user={user ? ({ id: user.id, ...user } as { id: string; [key: string]: unknown }) : null}
          onShowSignupModal={() => setShowSignupModal(true)}
        />

        {/* Unified Professional Filter Bar */}
        <OrderPageFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={menuCategories}
          onMoreFilters={() => setIsFilterDrawerOpen(true)}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />

        {/* View Toggle and Active Filter Chips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <OrderPageViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>

          <ActiveFiltersChips
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            categories={menuCategories}
            onClearSearch={() => setSearchQuery('')}
            onClearCategory={() => setSelectedCategory('all')}
            onClearPrice={() => {
              setMinPrice('')
              setMaxPrice('')
            }}
            onClearAll={clearAllFilters}
          />
        </div>

        <AnimatePresence mode="wait">
          {searchQuery && sortedMeals.length > 0 && (
            <m.p
              key="search-results"
              variants={prefersReducedMotion ? {} : fadeSlideUp}
              initial={prefersReducedMotion ? undefined : 'hidden'}
              animate={prefersReducedMotion ? undefined : 'visible'}
              exit={prefersReducedMotion ? undefined : 'exit'}
              custom={0.28}
              className="text-sm text-muted"
              role="status"
              aria-live="polite"
            >
              Found {sortedMeals.length} meal{sortedMeals.length !== 1 ? 's' : ''}
            </m.p>
          )}
        </AnimatePresence>

        <m.div
          className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6"
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          custom={0.3}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
          exit={prefersReducedMotion ? undefined : 'exit'}
        >
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {viewMode === 'sections' ? (
                <m.div
                  key="sections-view"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
                  transition={prefersReducedMotion ? {} : { duration: 0.4 }}
                >
                  {loading ? (
                    <m.div
                      key="sections-loading"
                      variants={prefersReducedMotion ? {} : staggerContainer}
                      initial={prefersReducedMotion ? undefined : 'hidden'}
                      animate={prefersReducedMotion ? undefined : 'visible'}
                      exit={prefersReducedMotion ? undefined : 'exit'}
                      className="space-y-8"
                      role="status"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      {[1, 2, 3].map(section => (
                        <div key={section} className="space-y-4 animate-pulse">
                          <div
                            className="h-8 bg-[var(--bg-elevated)] rounded w-48"
                            aria-hidden="true"
                          ></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(item => (
                              <div key={item} className="space-y-3" aria-hidden="true">
                                <div className="h-48 bg-[var(--bg-elevated)] rounded-lg"></div>
                                <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4"></div>
                                <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </m.div>
                  ) : (
                    <m.div
                      key="sections-content"
                      initial={prefersReducedMotion ? {} : { opacity: 0 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0 }}
                      transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                    >
                      <SectionContainer
                        allDishes={meals}
                        sectionConfigs={sectionConfigs}
                        onAddToCart={handleAddToCartForViews}
                        getImageUrl={getMealImage}
                      />
                    </m.div>
                  )}
                </m.div>
              ) : (
                <m.div
                  key="grid-view"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
                  transition={prefersReducedMotion ? {} : { duration: 0.4 }}
                >
                  {loading ? (
                    <m.div
                      key="grid-loading"
                      variants={prefersReducedMotion ? {} : staggerContainer}
                      initial={prefersReducedMotion ? undefined : 'hidden'}
                      animate={prefersReducedMotion ? undefined : 'visible'}
                      exit={prefersReducedMotion ? undefined : 'exit'}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                      role="status"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="space-y-3 animate-pulse" aria-hidden="true">
                          <div className="h-48 bg-[var(--bg-elevated)] rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4"></div>
                            <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2"></div>
                          </div>
                          <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3"></div>
                        </div>
                      ))}
                    </m.div>
                  ) : sortedMeals.length === 0 ? (
                    <m.div
                      key="grid-empty"
                      variants={prefersReducedMotion ? {} : staggerContainer}
                      initial={prefersReducedMotion ? undefined : 'hidden'}
                      animate={prefersReducedMotion ? undefined : 'visible'}
                      exit={prefersReducedMotion ? undefined : 'exit'}
                      className="glow-surface glow-soft rounded-2xl border border-theme p-12 text-center"
                      style={{
                        backgroundColor: isLightTheme
                          ? 'rgba(var(--text-main-rgb), 0.02)'
                          : 'rgba(var(--text-main-rgb), 0.02)',
                        borderColor: isLightTheme ? 'rgba(var(--text-main-rgb), 0.1)' : undefined,
                      }}
                    >
                      <m.div
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-theme-strong"
                        variants={prefersReducedMotion ? {} : fadeSlideUp}
                        style={{
                          backgroundColor: isLightTheme
                            ? 'rgba(var(--text-main-rgb), 0.04)'
                            : 'rgba(var(--text-main-rgb), 0.05)',
                          borderColor: isLightTheme
                            ? 'rgba(var(--text-main-rgb), 0.15)'
                            : undefined,
                        }}
                        aria-hidden="true"
                      >
                        <m.svg
                          className="h-7 w-7 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          variants={prefersReducedMotion ? {} : fadeSlideUp}
                          aria-hidden="true"
                        >
                          {hasActiveFilters ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          )}
                        </m.svg>
                      </m.div>
                      <m.h3
                        className="text-xl font-semibold"
                        variants={prefersReducedMotion ? {} : fadeSlideUp}
                      >
                        {hasActiveFilters ? 'No meals found' : 'No meals available'}
                      </m.h3>
                      <m.p
                        className="mt-2 text-sm text-muted"
                        variants={prefersReducedMotion ? {} : fadeSlideUp}
                      >
                        {hasActiveFilters
                          ? 'Try adjusting your filters or browse our full menu.'
                          : 'Check back soon for new meal additions!'}
                      </m.p>
                      {hasActiveFilters && (
                        <m.button
                          onClick={clearAllFilters}
                          className="mt-4 text-sm font-medium text-[var(--accent)] transition hover:opacity-80 min-h-[44px]"
                          variants={prefersReducedMotion ? {} : fadeSlideUp}
                          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                          aria-label="Clear all filters"
                        >
                          Clear all filters
                        </m.button>
                      )}
                    </m.div>
                  ) : (
                    <m.div
                      key="grid-content"
                      className="flex flex-col gap-6"
                      initial={prefersReducedMotion ? {} : { opacity: 0 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1 }}
                      exit={prefersReducedMotion ? {} : { opacity: 0 }}
                      transition={prefersReducedMotion ? {} : { duration: 0.3 }}
                    >
                      {mealGridBatches.map((batch, batchIndex) => {
                        const batchMotionProps =
                          batchIndex === 0
                            ? {
                                initial: prefersReducedMotion ? undefined : 'hidden',
                                animate: prefersReducedMotion ? undefined : 'visible',
                                variants: prefersReducedMotion ? {} : gridReveal,
                                exit: prefersReducedMotion ? undefined : 'exit',
                              }
                            : {
                                initial: prefersReducedMotion ? undefined : 'hidden',
                                variants: prefersReducedMotion ? {} : gridReveal,
                                whileInView: prefersReducedMotion ? undefined : 'visible',
                                viewport: prefersReducedMotion
                                  ? undefined
                                  : { once: true, amount: 0.25, margin: '40px 0px 0px 0px' },
                                exit: prefersReducedMotion ? undefined : 'exit',
                              }

                        return (
                          <m.div
                            key={`order-grid-batch-${batchIndex}`}
                            className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
                            {...batchMotionProps}
                          >
                            {batch.map(meal => {
                              return (
                                <m.div
                                  key={meal.id}
                                  variants={prefersReducedMotion ? {} : batchFadeSlideUp}
                                  layout={!prefersReducedMotion}
                                  initial={prefersReducedMotion ? undefined : 'hidden'}
                                  animate={
                                    batchIndex === 0 && !prefersReducedMotion
                                      ? 'visible'
                                      : undefined
                                  }
                                  whileInView={
                                    batchIndex === 0 || prefersReducedMotion ? undefined : 'visible'
                                  }
                                  viewport={
                                    batchIndex === 0 || prefersReducedMotion
                                      ? undefined
                                      : { once: true, amount: 0.25, margin: '40px 0px 0px 0px' }
                                  }
                                  exit={prefersReducedMotion ? undefined : 'exit'}
                                >
                                  <ProductCard
                                    product={
                                      meal as unknown as {
                                        id: string
                                        name: string
                                        price: number | string
                                        [key: string]: unknown
                                      }
                                    }
                                    onAddToCart={handleAddToCartForViews}
                                    getImageUrl={getMealImage}
                                    enableCustomization={enableCustomization}
                                  />
                                </m.div>
                              )
                            })}
                          </m.div>
                        )
                      })}
                    </m.div>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </div>
          <CartSidebar
            cartItems={cartItems}
            cartSummary={cartSummary}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            getImageUrl={getMealImage}
          />
        </m.div>
      </m.section>

      {totalCartQuantity > 0 && (
        <m.div
          className="lg:hidden fixed inset-x-0 bottom-4 z-40 px-6"
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
          exit={prefersReducedMotion ? undefined : 'exit'}
        >
          <button
            onClick={() => setIsCartSheetOpen(true)}
            className="w-full rounded-xl sm:rounded-2xl bg-[var(--accent)] text-black py-3 px-5 min-h-[44px] font-semibold shadow-lg shadow-[var(--accent)]/25 flex items-center justify-between text-sm sm:text-base"
            aria-label={`View order with ${totalCartQuantity} items, total ${getCurrencySymbol('BDT')}${formatPrice(cartSummary.total, 0)}`}
          >
            <span>View Order ({totalCartQuantity})</span>
            <span>
              {getCurrencySymbol('BDT')}
              {formatPrice(cartSummary.total, 0)}
            </span>
          </button>
        </m.div>
      )}

      <CartBottomSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        cartItems={cartItems}
        cartSummary={cartSummary}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        getImageUrl={getMealImage}
      />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onApply={() => {}}
        onClearAll={() => {
          setMinPrice('')
          setMaxPrice('')
        }}
      />

      {/* Signup Prompt Modal for Order History */}
      <SignupPromptModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
    </m.main>
  )
})

OrderPage.displayName = 'OrderPage'

export default OrderPage
