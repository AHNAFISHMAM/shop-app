/**
 * OrderPageContent Component
 *
 * Main content area for OrderPage with sections or grid view.
 */

import { AnimatePresence, m } from 'framer-motion'
import { staggerContainer, fadeSlideUp } from '../../../components/animations/menuAnimations'
import SectionContainer from '../../../components/order/SectionContainer'
import ProductCard from '../../../components/menu/ProductCard'
import type { Product } from '../../../components/menu/ProductCard'
import { OrderPageEmpty } from './OrderPageEmpty'

interface Meal {
  id: string
  name: string
  price?: number | string
  description?: string
  is_available?: boolean
  is_todays_menu?: boolean
  is_daily_special?: boolean
  is_new_dish?: boolean
  is_discount_combo?: boolean
  is_limited_time?: boolean
  is_happy_hour?: boolean
  [key: string]: unknown
}

interface SectionConfig {
  section_key: string
  section_name: string
  is_available?: boolean
  custom_message?: string
  display_order?: number
  [key: string]: unknown
}

// Type guard to convert Meal to Dish format expected by SectionContainer
function mealToDish(meal: Meal): {
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
} {
  return {
    id: meal.id,
    name: meal.name || '',
    description: meal.description,
    price: meal.price ?? 0,
    is_available: meal.is_available,
    is_todays_menu: meal.is_todays_menu,
    is_daily_special: meal.is_daily_special,
    is_new_dish: meal.is_new_dish,
    is_discount_combo: meal.is_discount_combo,
    is_limited_time: meal.is_limited_time,
    is_happy_hour: meal.is_happy_hour,
  }
}

// Convert Meal to Product format for ProductCard
function mealToProduct(meal: Meal): Product {
  return {
    id: meal.id,
    name: meal.name || '',
    description: meal.description,
    price: meal.price ?? 0,
    is_available: meal.is_available,
  } as Product
}

interface OrderPageContentProps {
  viewMode: 'sections' | 'grid'
  loading: boolean
  meals: Meal[]
  sectionConfigs: SectionConfig[]
  onAddToCart: (meal: Meal) => void
  getImageUrl: (meal: Meal) => string
  onClearFilters: () => void
  isLightTheme: boolean
  user?: { id: string; [key: string]: unknown } | null
  enableCustomization: boolean
}

/**
 * OrderPageContent Component
 */
export function OrderPageContent({
  viewMode,
  loading,
  meals,
  sectionConfigs,
  onAddToCart,
  getImageUrl,
  onClearFilters,
  isLightTheme,
  enableCustomization,
}: OrderPageContentProps): JSX.Element {
  if (loading) {
    return (
      <m.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="glow-surface glow-soft flex min-h-[300px] items-center justify-center rounded-2xl border border-theme"
        style={{
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
          borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
        }}
      >
        <m.div className="space-y-3 text-center" variants={staggerContainer}>
          <m.div
            className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"
            variants={fadeSlideUp}
          />
          <m.p className="text-sm text-muted" variants={fadeSlideUp}>
            Loading meals...
          </m.p>
        </m.div>
      </m.div>
    )
  }

  if (!meals || meals.length === 0) {
    return <OrderPageEmpty onClearFilters={onClearFilters} />
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {viewMode === 'sections' ? (
        <m.div
          key="sections-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <SectionContainer
            allDishes={meals.map(mealToDish)}
            sectionConfigs={sectionConfigs}
            onAddToCart={onAddToCart}
            getImageUrl={getImageUrl}
          />
        </m.div>
      ) : (
        <m.div
          key="grid-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {meals.map(meal => {
            const product = mealToProduct(meal) as Product
            return (
              <ProductCard
                key={meal.id}
                product={product}
                onAddToCart={(product: Product) => {
                  const mealFromProduct = meals.find(m => m.id === product.id)
                  if (mealFromProduct) {
                    onAddToCart(mealFromProduct)
                  }
                }}
                getImageUrl={(product: Product) => {
                  const mealFromProduct = meals.find(m => m.id === product.id)
                  return mealFromProduct ? getImageUrl(mealFromProduct) : ''
                }}
                enableCustomization={enableCustomization}
              />
            )
          })}
        </m.div>
      )}
    </AnimatePresence>
  )
}
