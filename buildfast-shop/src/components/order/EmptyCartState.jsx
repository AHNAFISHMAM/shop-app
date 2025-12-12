import PropTypes from 'prop-types';
import { m } from 'framer-motion';

/**
 * Enhanced Empty Cart State Component
 * Provides illustrated empty state with quick actions
 */
const EmptyCartState = ({ onBrowseMenu, onViewFavorites, hasFavorites = false }) => {
  return (
    <m.div
      className="cart-empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="cart-empty-icon-container"
      >
        <svg
          className="cart-empty-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </m.div>

      <m.h3
        className="cart-empty-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Your cart is empty
      </m.h3>

      <m.p
        className="cart-empty-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
      </m.p>

      <m.div
        className="cart-empty-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {onBrowseMenu && (
          <button
            onClick={onBrowseMenu}
            className="cart-btn-browse"
            aria-label="Browse menu"
          >
            Browse Menu
          </button>
        )}
        {hasFavorites && onViewFavorites && (
          <button
            onClick={onViewFavorites}
            className="cart-btn-secondary"
            aria-label="View favorites"
          >
            View Favorites
          </button>
        )}
      </m.div>
    </m.div>
  );
};

EmptyCartState.propTypes = {
  onBrowseMenu: PropTypes.func,
  onViewFavorites: PropTypes.func,
  hasFavorites: PropTypes.bool,
};

export default EmptyCartState;

