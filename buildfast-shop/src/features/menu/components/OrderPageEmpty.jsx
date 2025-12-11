/**
 * OrderPageEmpty Component
 * 
 * Empty state component for OrderPage when no items are found.
 */

import { motion } from 'framer-motion';
import { fadeSlideUp } from '../../../components/animations/menuAnimations';
import PropTypes from 'prop-types';

/**
 * OrderPageEmpty Component
 * 
 * @param {Object} props
 * @param {Function} props.onClearFilters - Clear filters callback
 */
export function OrderPageEmpty({ onClearFilters }) {
  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="max-w-md">
        <svg
          className="mx-auto h-24 w-24 text-muted mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          No items found
        </h3>
        <p className="text-[var(--text-secondary)] mb-6">
          Try adjusting your filters or search query to find what you&apos;re looking for.
        </p>
        <button
          onClick={onClearFilters}
          className="btn-primary px-6 py-3"
        >
          Clear Filters
        </button>
      </div>
    </motion.div>
  );
}

OrderPageEmpty.propTypes = {
  onClearFilters: PropTypes.func.isRequired,
};

