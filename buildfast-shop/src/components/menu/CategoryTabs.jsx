import { useCallback, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { staggerContainer, fadeSlideUp, fadeSlideDown } from '../animations/menuAnimations';

/**
 * Category and Subcategory Navigation Tabs
 * Sticky navigation with active state highlighting
 */
const CategoryTabs = ({
  categories,
  filteredSubcategories,
  selectedMainCategory,
  selectedSubcategory,
  onMainCategoryClick,
  onSubcategoryClick,
}) => {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Handle main category click with useCallback
  const handleMainClick = useCallback(
    (category) => {
      onMainCategoryClick(category);
    },
    [onMainCategoryClick]
  );

  // Handle subcategory click with useCallback
  const handleSubClick = useCallback(
    (subcategory) => {
      onSubcategoryClick(subcategory);
    },
    [onSubcategoryClick]
  );

  return (
    <m.div
      className="sticky top-16 z-20 backdrop-blur-md border-b py-3 sm:py-4"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.98)' 
          : 'rgba(5, 5, 9, 0.95)',
        borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
      }}
      variants={fadeSlideDown}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Main Categories */}
      <div className="app-container">
        <m.div
          className="flex items-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* All Dishes Button */}
          <m.button
            onClick={() => handleMainClick(null)}
            className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
              !selectedMainCategory
                ? 'bg-[var(--accent)] text-black shadow-lg'
                : 'bg-theme-elevated text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            onMouseEnter={(e) => {
              if (selectedMainCategory) {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedMainCategory) {
                e.currentTarget.style.backgroundColor = '';
              }
            }}
            variants={fadeSlideUp}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            All Dishes
          </m.button>

          {/* Category Tabs */}
          {categories.map((category, index) => (
            <m.button
              key={category.id}
              onClick={() => handleMainClick(category)}
              className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
                selectedMainCategory?.id === category.id
                  ? 'bg-[var(--accent)] text-black shadow-lg'
                  : 'bg-theme-elevated text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              onMouseEnter={(e) => {
                if (selectedMainCategory?.id !== category.id) {
                  e.currentTarget.style.backgroundColor = isLightTheme 
                    ? 'rgba(0, 0, 0, 0.08)' 
                    : 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMainCategory?.id !== category.id) {
                  e.currentTarget.style.backgroundColor = '';
                }
              }}
              variants={fadeSlideUp}
              custom={index * 0.05}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              layout
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
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* All in Category Button */}
              <m.button
                onClick={() => handleSubClick(null)}
                className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  !selectedSubcategory
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]'
                    : 'text-[var(--text-muted)]'
                }`}
                style={selectedSubcategory ? {
                  backgroundColor: isLightTheme 
                    ? 'rgba(0, 0, 0, 0.04)' 
                    : 'rgba(255, 255, 255, 0.05)'
                } : undefined}
                onMouseEnter={(e) => {
                  if (selectedSubcategory) {
                    e.currentTarget.style.backgroundColor = isLightTheme 
                      ? 'rgba(0, 0, 0, 0.08)' 
                      : 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSubcategory) {
                    e.currentTarget.style.backgroundColor = isLightTheme 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                variants={fadeSlideUp}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                All {selectedMainCategory.name}
              </m.button>

              {/* Subcategory Tabs */}
              {filteredSubcategories.map((subcategory, index) => (
                <m.button
                  key={subcategory.id}
                  onClick={() => handleSubClick(subcategory)}
                  className={`px-4 sm:px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedSubcategory?.id === subcategory.id
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                  style={selectedSubcategory?.id !== subcategory.id ? {
                    backgroundColor: isLightTheme 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.05)'
                  } : undefined}
                  onMouseEnter={(e) => {
                    if (selectedSubcategory?.id !== subcategory.id) {
                      e.currentTarget.style.backgroundColor = isLightTheme 
                        ? 'rgba(0, 0, 0, 0.08)' 
                        : 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSubcategory?.id !== subcategory.id) {
                      e.currentTarget.style.backgroundColor = isLightTheme 
                        ? 'rgba(0, 0, 0, 0.04)' 
                        : 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  variants={fadeSlideUp}
                  custom={index * 0.05}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  {subcategory.name}
                </m.button>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
};

CategoryTabs.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  filteredSubcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  selectedMainCategory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  selectedSubcategory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onMainCategoryClick: PropTypes.func.isRequired,
  onSubcategoryClick: PropTypes.func.isRequired,
};

CategoryTabs.defaultProps = {
  filteredSubcategories: [],
  selectedMainCategory: null,
  selectedSubcategory: null,
};

export default CategoryTabs;
