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
 */
import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import UpdateTimestamp from '../components/UpdateTimestamp'
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
  staggerContainer
} from '../components/animations/menuAnimations'
// New hooks and components
import { useMenuItems, useSectionConfigs, useMenuCategories } from '../features/menu/hooks'
import { useTheme } from '../shared/hooks'
import { OrderPageHeader, OrderPageFilters, OrderPageViewToggle, ActiveFiltersChips } from '../features/menu/components'
import { getMealImage } from '../features/menu/utils/image-utils'
// Existing components still used
import SectionContainer from '../components/order/SectionContainer'
import ProductCard from '../components/menu/ProductCard'

function OrderPage() {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()

  // Theme detection using shared hook
  const isLightTheme = useTheme()

  // State management
  // eslint-disable-next-line no-unused-vars
  const [addingToCart, setAddingToCart] = useState({})
  // eslint-disable-next-line no-unused-vars
  const [successMessage, setSuccessMessage] = useState({})
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState('sections') // 'sections' or 'grid'
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // Feature flags - default to true during loading to prevent hiding features that should be shown
  const enableCustomization = settingsLoading ? false : (settings?.enable_product_customization ?? true)

  // Data fetching using new hooks
  const { meals, loading } = useMenuItems()
  const { sectionConfigs, loading: loadingSectionConfigs } = useSectionConfigs()
  const { categories: menuCategories, loading: loadingCategories } = useMenuCategories()

  // Custom hooks for cart management
  const {
    cartItems,
    cartSummary,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleAddToCart: addToCartFromHook
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
  const {
    // eslint-disable-next-line no-unused-vars
    favoriteItems,
    // eslint-disable-next-line no-unused-vars
    togglingFavorites,
    // eslint-disable-next-line no-unused-vars
    handleToggleFavorites,
  } = useFavoritesManagement(user)

  // Image utility function (now imported from utils)
  // getMealImage is already imported from '../features/menu/utils/image-utils'

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  // Core add to cart logic - no event required
  const handleAddToCart = useCallback(async (meal, event = null) => {
    // Handle event if provided (for button clicks)
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Detect if this is a menu_item (has category_id and is_available) or dish (has subcategory_id and is_active)
    const isMenuItem = meal.category_id !== undefined && meal.is_available !== undefined

    // Check availability - backward compatible with both old and new schema
    const isOutOfStock = isMenuItem
      ? meal.is_available === false
      : meal.stock_quantity === 0

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
      setSuccessMessage(prev => ({ ...prev, [meal.id]: 'Failed to add meal to order. Please try again.' }))
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
  }, [addToCartFromHook])

  // Unified handler for both sections and grid views
  const handleAddToCartForViews = useCallback(async (meal) => {
    await handleAddToCart(meal)
  }, [handleAddToCart])

  /**
   * Memoized grid batches for optimized rendering
   * Splits sorted meals into batches of 3 for grid layout
   * Only recalculates when sortedMeals changes
   */
  const mealGridBatches = useMemo(() => {
    const batches = []
    for (let i = 0; i < sortedMeals.length; i += 3) {
      batches.push(sortedMeals.slice(i, i + 3))
    }
    return batches
  }, [sortedMeals]) // Recalculate when sorted meals change

  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)] px-4 pb-40 pt-12 text-[var(--text-main)]"
      style={{ overflowX: 'clip' }}
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <UpdateTimestamp />

      <m.section
        className="mx-auto max-w-full space-y-10"
        variants={menuStagger}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <OrderPageHeader 
          user={user} 
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
            <OrderPageViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
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
              setMinPrice('');
              setMaxPrice('');
            }}
            onClearAll={clearAllFilters}
          />
        </div>

        <AnimatePresence mode="wait">
          {searchQuery && sortedMeals.length > 0 && (
            <m.p
              key="search-results"
              variants={fadeSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={0.28}
              className="text-sm text-muted"
            >
              Found {sortedMeals.length} meal{sortedMeals.length !== 1 ? 's' : ''}
            </m.p>
          )}
        </AnimatePresence>

        <m.div
          className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6"
          variants={fadeSlideUp}
          custom={0.3}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {viewMode === 'sections' ? (
                <m.div
                  key="sections-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {loading ? (
                    <m.div
                      key="sections-loading"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-8"
                    >
                      {[1, 2, 3].map((section) => (
                        <div key={section} className="space-y-4 animate-pulse">
                          <div className="h-8 bg-[var(--bg-elevated)] rounded w-48"></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((item) => (
                              <div key={item} className="space-y-3">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {loading ? (
                    <m.div
                      key="grid-loading"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    >
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-3 animate-pulse">
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
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glow-surface glow-soft rounded-2xl border border-theme p-12 text-center"
                        style={{
                          backgroundColor: isLightTheme 
                            ? 'rgba(0, 0, 0, 0.02)' 
                            : 'rgba(255, 255, 255, 0.02)',
                          borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
                        }}
                      >
                        <m.div
                          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-theme-strong"
                          variants={fadeSlideUp}
                          style={{
                            backgroundColor: isLightTheme 
                              ? 'rgba(0, 0, 0, 0.04)' 
                              : 'rgba(255, 255, 255, 0.05)',
                            borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
                          }}
                        >
                          <m.svg
                            className="h-7 w-7 text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            variants={fadeSlideUp}
                          >
                            {hasActiveFilters ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            )}
                          </m.svg>
                        </m.div>
                        <m.h3
                          className="text-xl font-semibold"
                          variants={fadeSlideUp}
                        >
                          {hasActiveFilters ? 'No meals found' : 'No meals available'}
                        </m.h3>
                        <m.p
                          className="mt-2 text-sm text-muted"
                          variants={fadeSlideUp}
                        >
                          {hasActiveFilters
                            ? 'Try adjusting your filters or browse our full menu.'
                            : 'Check back soon for new meal additions!'}
                        </m.p>
                        {hasActiveFilters && (
                          <m.button
                            onClick={clearAllFilters}
                            className="mt-4 text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
                            variants={fadeSlideUp}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Clear all filters
                          </m.button>
                        )}
                      </m.div>
                    ) : (
                      <m.div
                        key="grid-content"
                        className="flex flex-col gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {mealGridBatches.map((batch, batchIndex) => {
                          const batchMotionProps = batchIndex === 0
                            ? {
                                initial: 'hidden',
                                animate: 'visible',
                                variants: gridReveal,
                                exit: 'exit',
                              }
                            : {
                                initial: 'hidden',
                                variants: gridReveal,
                                whileInView: 'visible',
                                viewport: { once: true, amount: 0.25, margin: '40px 0px 0px 0px' },
                                exit: 'exit',
                              }

                          return (
                            <m.div
                              key={`order-grid-batch-${batchIndex}`}
                              className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
                              {...batchMotionProps}
                            >
                              {batch.map((meal) => {
                                return (
                                  <m.div
                                    key={meal.id}
                                    variants={batchFadeSlideUp}
                                    layout
                                    initial="hidden"
                                    animate={batchIndex === 0 ? 'visible' : undefined}
                                    whileInView={batchIndex === 0 ? undefined : 'visible'}
                                    viewport={
                                      batchIndex === 0
                                        ? undefined
                                        : { once: true, amount: 0.25, margin: '40px 0px 0px 0px' }
                                    }
                                    exit="exit"
                                  >
                                    <ProductCard
                                      product={meal}
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
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button
            onClick={() => setIsCartSheetOpen(true)}
            className="w-full rounded-xl sm:rounded-2xl bg-[var(--accent)] text-black py-3 px-5 min-h-[44px] font-semibold shadow-lg shadow-[var(--accent)]/25 flex items-center justify-between text-sm sm:text-base"
          >
            <span>View Order ({totalCartQuantity})</span>
            <span>{getCurrencySymbol('BDT')}{formatPrice(cartSummary.total, 0)}</span>
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
          setMinPrice('');
          setMaxPrice('');
        }}
      />

      {/* Signup Prompt Modal for Order History */}
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </m.main>
  )
}

export default OrderPage
