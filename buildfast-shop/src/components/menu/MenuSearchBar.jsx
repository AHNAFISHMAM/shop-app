import { useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { searchBarSequence, staggerContainer, fadeSlideUp } from '../animations/menuAnimations';

/**
 * Menu Search Bar Component
 * Glass morphism design with search icon
 */
const MenuSearchBar = ({ searchQuery, onSearchChange }) => {
  // Wrap handler in useCallback for performance
  const handleChange = useCallback(
    (e) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <m.section
      className="app-container py-3 sm:py-4"
      variants={searchBarSequence}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Hero Section */}
      <m.div className="text-center mb-8" variants={staggerContainer}>
        <m.p className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--accent)] mb-2" variants={fadeSlideUp}>
          Discover Our Menu
        </m.p>
        <m.h1 className="text-lg sm:text-xl md:text-5xl font-bold text-[var(--text-main)] mb-4" variants={fadeSlideUp}>
          Taste That Shines
        </m.h1>
        <m.p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto" variants={fadeSlideUp}>
          Explore our exquisite selection of dishes crafted with passion and
          premium ingredients
        </m.p>
      </m.div>

      {/* Search Bar - Glass Morphism */}
      <m.div className="max-w-2xl mx-auto" variants={staggerContainer}>
        <m.div className="relative group" variants={fadeSlideUp}>
          {/* Search Icon */}
          <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input Field */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Search dishes, cuisines, or ingredients..."
            className="w-full pl-12 pr-4 sm:px-6 py-3 min-h-[44px] bg-theme-elevated backdrop-blur-md border border-theme rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200"
            aria-label="Search menu"
          />

          {/* Clear Button */}
          {searchQuery && (
            <m.button
              onClick={() => onSearchChange('')}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors min-h-[44px] py-3"
              aria-label="Clear search"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </m.button>
          )}
        </m.div>

        {/* Search Results Count */}
        {searchQuery && (
          <m.p className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2 text-center" variants={fadeSlideUp}>
            Searching for &quot;{searchQuery}&quot;
          </m.p>
        )}
      </m.div>
    </m.section>
  );
};

MenuSearchBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
};

export default MenuSearchBar;
