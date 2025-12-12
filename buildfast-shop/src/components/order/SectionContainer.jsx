import { useMemo } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import SectionCarousel from './SectionCarousel';
import { gridReveal, batchFadeSlideUp } from '../animations/menuAnimations';

/**
 * Section Container Component - Professional Version
 * Smart expand: sections with dishes auto-expand, empty ones collapse
 * Persists user preferences to localStorage
 */
const SectionContainer = ({
  allDishes,
  sectionConfigs,
  onAddToCart,
  getImageUrl,
}) => {
  const safeAddToCart = typeof onAddToCart === 'function' ? onAddToCart : () => {};
  const safeGetImageUrl = typeof getImageUrl === 'function' ? getImageUrl : () => '';

  // Filter dishes for each section
  const sectionData = useMemo(() => {
    const sections = [];
    const validDishes = allDishes.filter(dish => dish && typeof dish === 'object');
    const validConfigs = Array.isArray(sectionConfigs) ? sectionConfigs : [];

    // Define the section order and their corresponding dish filter flags
    const sectionMapping = [
      {
        key: 'todays_menu',
        name: "Today's Menu",
        filter: (dish) => dish.is_todays_menu === true,
      },
      {
        key: 'daily_specials',
        name: 'Daily Specials',
        filter: (dish) => dish.is_daily_special === true,
      },
      {
        key: 'new_dishes',
        name: 'New Dishes',
        filter: (dish) => dish.is_new_dish === true,
      },
      {
        key: 'discount_combos',
        name: 'Discount Combos',
        filter: (dish) => dish.is_discount_combo === true,
      },
      {
        key: 'limited_time',
        name: 'Limited-Time Meals',
        filter: (dish) => dish.is_limited_time === true,
      },
      {
        key: 'happy_hour',
        name: 'Happy Hour Offers',
        filter: (dish) => dish.is_happy_hour === true,
      },
    ];

    // For each section, filter dishes and get configuration
    sectionMapping.forEach((section) => {
      const config = validConfigs.find((c) => c && c.section_key === section.key);
      const filteredDishes = validDishes.filter(
        (dish) => dish && (dish.is_available !== false) && section.filter(dish)
      );

      sections.push({
        key: section.key,
        name: config?.section_name || section.name,
        dishes: filteredDishes,
        isAvailable: config?.is_available !== false,
        customMessage: config?.custom_message,
        displayOrder: config?.display_order || sections.length,
      });
    });

    // Sort by display order
    return sections.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [allDishes, sectionConfigs]);

  // Count total dishes across all available sections
  const totalDishes = useMemo(() => {
    return sectionData.reduce((sum, section) => {
      return sum + (section.isAvailable ? section.dishes.length : 0);
    }, 0);
  }, [sectionData]);

  // Don't render if no sections have dishes
  if (totalDishes === 0) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10">
          <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-yellow-500 mb-2">No Special Sections Available</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          No dishes have been assigned to special sections yet.<br/>
          Go to Admin → Special Sections to assign dishes.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Total dishes in database: {allDishes.length}
        </p>
      </div>
    );
  }

  return (
    <m.div
      className="space-y-6"
      variants={gridReveal}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* All Sections - Clean & Professional */}
      {sectionData.map((section) => (
        <m.div
          key={section.key}
          variants={batchFadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3, margin: '0px 0px -10% 0px' }}
          exit="exit"
        >
          <SectionCarousel
            sectionName={section.name}
            dishes={section.dishes}
            isAvailable={section.isAvailable}
            customMessage={section.customMessage}
            onAddToCart={safeAddToCart}
            getImageUrl={safeGetImageUrl}
            defaultExpanded={true}
            onToggle={() => {}}
          />
        </m.div>
      ))}
    </m.div>
  );
};

SectionContainer.propTypes = {
  allDishes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      is_available: PropTypes.bool,
      is_todays_menu: PropTypes.bool,
      is_daily_special: PropTypes.bool,
      is_new_dish: PropTypes.bool,
      is_discount_combo: PropTypes.bool,
      is_limited_time: PropTypes.bool,
      is_happy_hour: PropTypes.bool,
    })
  ).isRequired,
  sectionConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      section_key: PropTypes.string.isRequired,
      section_name: PropTypes.string.isRequired,
      is_available: PropTypes.bool,
      custom_message: PropTypes.string,
      display_order: PropTypes.number,
    })
  ),
  onAddToCart: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
};

export default SectionContainer;
