/**
 * ActiveFiltersChips Component
 * 
 * Displays active filter chips with remove functionality.
 */

import { m } from 'framer-motion';
import { fadeSlideDown } from '../../../components/animations/menuAnimations';
import PropTypes from 'prop-types';

/**
 * ActiveFiltersChips Component
 * 
 * @param {Object} props
 * @param {string} props.searchQuery - Search query
 * @param {string} props.selectedCategory - Selected category
 * @param {string} props.minPrice - Minimum price
 * @param {string} props.maxPrice - Maximum price
 * @param {Array} props.categories - Categories list
 * @param {Function} props.onClearSearch - Clear search callback
 * @param {Function} props.onClearCategory - Clear category callback
 * @param {Function} props.onClearPrice - Clear price callback
 * @param {Function} props.onClearAll - Clear all filters callback
 */
export function ActiveFiltersChips({
  searchQuery,
  selectedCategory,
  minPrice,
  maxPrice,
  categories = [],
  onClearSearch,
  onClearCategory,
  onClearPrice,
  onClearAll
}) {
  const hasActiveFilters = selectedCategory !== 'all' || searchQuery || minPrice || maxPrice;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <m.div
      variants={fadeSlideDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-2 border-t border-theme-subtle"
    >
      <span className="text-xs text-muted">Active:</span>

      {selectedCategory !== 'all' && (
        <button
          onClick={onClearCategory}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
        >
          <span>{categories.find(c => c.id === selectedCategory)?.name || 'Category'}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {searchQuery && (
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
        >
          <span>Search: &ldquo;{searchQuery.substring(0, 20)}{searchQuery.length > 20 ? '…' : ''}&rdquo;</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {(minPrice || maxPrice) && (
        <button
          onClick={onClearPrice}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
        >
          <span>৳{minPrice || '0'} - ৳{maxPrice || '∞'}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <button
        onClick={onClearAll}
        className="ml-auto text-xs text-muted hover:text-[var(--accent)] transition-colors font-medium"
      >
        Clear All
      </button>
    </m.div>
  );
}

ActiveFiltersChips.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  minPrice: PropTypes.string,
  maxPrice: PropTypes.string,
  categories: PropTypes.array,
  onClearSearch: PropTypes.func.isRequired,
  onClearCategory: PropTypes.func.isRequired,
  onClearPrice: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
};

