/**
 * OrderPageContent Component
 * 
 * Main content area for OrderPage with sections or grid view.
 */

import { AnimatePresence, m } from 'framer-motion';
import { staggerContainer, fadeSlideUp } from '../../../components/animations/menuAnimations';
import SectionContainer from '../../../components/order/SectionContainer';
import ProductCard from '../../../components/menu/ProductCard';
import { OrderPageEmpty } from './OrderPageEmpty';

interface Meal {
  id: string;
  [key: string]: unknown;
}

interface SectionConfig {
  [key: string]: unknown;
}

interface OrderPageContentProps {
  viewMode: 'sections' | 'grid';
  loading: boolean;
  meals: Meal[];
  sectionConfigs: SectionConfig[];
  onAddToCart: (meal: Meal) => void;
  getImageUrl: (meal: Meal) => string;
  onClearFilters: () => void;
  isLightTheme: boolean;
  user?: { id: string; [key: string]: unknown } | null;
  enableCustomization: boolean;
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
  user,
  enableCustomization
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
          backgroundColor: isLightTheme 
            ? 'rgba(0, 0, 0, 0.02)' 
            : 'rgba(255, 255, 255, 0.02)',
          borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
        }}
      >
        <m.div
          className="space-y-3 text-center"
          variants={staggerContainer}
        >
          <m.div
            className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"
            variants={fadeSlideUp}
          />
          <m.p
            className="text-sm text-muted"
            variants={fadeSlideUp}
          >
            Loading meals...
          </m.p>
        </m.div>
      </m.div>
    );
  }

  if (!meals || meals.length === 0) {
    return <OrderPageEmpty onClearFilters={onClearFilters} />;
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
            allDishes={meals}
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
          {meals.map((meal) => (
            <ProductCard
              key={meal.id}
              product={meal}
              onAddToCart={onAddToCart}
              user={user}
              enableCustomization={enableCustomization}
            />
          ))}
        </m.div>
      )}
    </AnimatePresence>
  );
}

