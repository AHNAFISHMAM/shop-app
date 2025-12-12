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
import PropTypes from 'prop-types';

/**
 * OrderPageContent Component
 * 
 * @param {Object} props
 * @param {string} props.viewMode - Current view mode ('sections' | 'grid')
 * @param {boolean} props.loading - Loading state
 * @param {Array} props.meals - Meals array
 * @param {Array} props.sectionConfigs - Section configurations
 * @param {Function} props.onAddToCart - Add to cart handler
 * @param {Function} props.getImageUrl - Get image URL function
 * @param {Function} props.onClearFilters - Clear filters callback
 * @param {boolean} props.isLightTheme - Whether theme is light
 * @param {Object} props.user - Current user
 * @param {boolean} props.enableCustomization - Whether customization is enabled
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
}) {
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

OrderPageContent.propTypes = {
  viewMode: PropTypes.oneOf(['sections', 'grid']).isRequired,
  loading: PropTypes.bool.isRequired,
  meals: PropTypes.array.isRequired,
  sectionConfigs: PropTypes.array.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  isLightTheme: PropTypes.bool.isRequired,
  user: PropTypes.object,
  enableCustomization: PropTypes.bool.isRequired,
};

