/**
 * OrderPageFilters Component
 * 
 * Filter bar component for OrderPage with search, category, and sort filters.
 */

import { m } from 'framer-motion';
import CustomDropdown from '../../../components/ui/CustomDropdown';
import { fadeSlideUp, batchFadeSlideUp, gridReveal } from '../../../components/animations/menuAnimations';
import { useTheme } from '../../../shared/hooks';

interface Category {
  id: string;
  name: string;
}

interface OrderPageFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories?: Category[];
  onMoreFilters: () => void;
  minPrice?: string;
  maxPrice?: string;
}

/**
 * OrderPageFilters Component
 */
export function OrderPageFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories = [],
  onMoreFilters,
  minPrice,
  maxPrice
}: OrderPageFiltersProps): JSX.Element {
  const isLightTheme = useTheme();
  return (
    <m.div
      variants={fadeSlideUp}
      custom={0.22}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="glow-surface glow-subtle rounded-2xl border border-theme-subtle bg-[var(--bg-main)]/78 backdrop-blur-sm shadow-[0_24px_55px_-50px_rgba(5,5,9,0.6)] overflow-hidden"
    >
      {/* Main Filter Row */}
      <m.div
        className="flex flex-col lg:flex-row gap-3 p-4"
        variants={gridReveal}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Search - Takes most space */}
        <m.div className="relative flex-1" variants={batchFadeSlideUp}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search meals..."
            className="w-full rounded-lg border border-theme-subtle px-11 py-3 min-h-[44px] text-sm sm:text-base bg-[var(--bg-main)]/78 text-[var(--text-main)] placeholder:text-muted focus:bg-[var(--bg-main)]/90 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-[var(--text-main)] transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </m.div>

        {/* Category Dropdown */}
        <m.div variants={batchFadeSlideUp}>
          <CustomDropdown
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as string)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(cat => ({
                value: cat.id,
                label: cat.name
              }))
            ]}
            placeholder="Category"
            className="min-w-[160px]"
          />
        </m.div>

        {/* Sort Dropdown */}
        <m.div variants={batchFadeSlideUp}>
          <CustomDropdown
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as string)}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price-low', label: 'Price: Low-High' },
              { value: 'price-high', label: 'Price: High-Low' },
              { value: 'name-asc', label: 'Name: A-Z' }
            ]}
            placeholder="Sort By"
            className="min-w-[140px]"
          />
        </m.div>

        {/* More Filters Button */}
        <m.div variants={batchFadeSlideUp}>
          <m.button
            variants={batchFadeSlideUp}
            onClick={onMoreFilters}
            className="relative flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg border border-theme text-sm sm:text-base font-medium text-[var(--text-main)] hover:border-[var(--accent)]/30 transition-all whitespace-nowrap"
            style={{
              backgroundColor: isLightTheme 
                ? 'rgba(0, 0, 0, 0.03)' 
                : 'rgba(255, 255, 255, 0.04)',
              borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.06)' 
                : 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.03)' 
                : 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden sm:inline">More</span>
            {(minPrice || maxPrice) && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] sm:text-xs font-bold text-black">
                {(minPrice ? 1 : 0) + (maxPrice ? 1 : 0)}
              </span>
            )}
          </m.button>
        </m.div>
      </m.div>
    </m.div>
  );
}

