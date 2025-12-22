import { useCallback, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { searchBarSequence, staggerContainer, fadeSlideUp } from '../animations/menuAnimations';

/**
 * MenuSearchBar component props
 */
interface MenuSearchBarProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
}

/**
 * Menu Search Bar Component
 *
 * Glass morphism design with search icon and clear button.
 * Displays a hero section and search input for filtering menu items.
 *
 * Features:
 * - Glass morphism design
 * - Clear button with animation
 * - Search results count
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 * - Respects prefers-reduced-motion
 */
const MenuSearchBar = ({ searchQuery, onSearchChange }: MenuSearchBarProps) => {
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Wrap handler in useCallback for performance
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const handleClear = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <m.section
      className="app-container py-3 sm:py-4"
      variants={prefersReducedMotion ? undefined : searchBarSequence}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      aria-labelledby="menu-search-heading"
    >
      {/* Hero Section */}
      <m.div className="text-center mb-8" variants={prefersReducedMotion ? undefined : staggerContainer}>
        <m.p className="text-sm uppercase tracking-widest text-[var(--accent)] mb-2" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          Discover Our Menu
        </m.p>
        <m.h1 id="menu-search-heading" className="text-lg sm:text-xl md:text-5xl font-bold text-[var(--text-main)] mb-4" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          Taste That Shines
        </m.h1>
        <m.p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          Explore our exquisite selection of dishes crafted with passion and
          premium ingredients
        </m.p>
      </m.div>

      {/* Search Bar - Glass Morphism */}
      <m.div className="max-w-2xl mx-auto" variants={prefersReducedMotion ? undefined : staggerContainer}>
        <m.div className="relative group" variants={prefersReducedMotion ? undefined : fadeSlideUp}>
          {/* Search Icon */}
          <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" aria-hidden="true">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            className="w-full pl-12 pr-4 sm:pl-14 sm:pr-14 py-3 min-h-[44px] bg-[var(--bg-elevated)] backdrop-blur-md border border-[var(--border-default)] rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200"
            aria-label="Search menu"
            aria-describedby={searchQuery ? 'search-results-count' : undefined}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {searchQuery && (
              <m.button
                onClick={handleClear}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="Clear search"
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 90 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
          </AnimatePresence>
        </m.div>

        {/* Search Results Count */}
        {searchQuery && (
          <m.p id="search-results-count" className="text-sm text-[var(--text-muted)] mt-2 text-center" variants={prefersReducedMotion ? undefined : fadeSlideUp} role="status" aria-live="polite">
            Searching for &quot;{searchQuery}&quot;
          </m.p>
        )}
      </m.div>
    </m.section>
  );
};

export default MenuSearchBar;

