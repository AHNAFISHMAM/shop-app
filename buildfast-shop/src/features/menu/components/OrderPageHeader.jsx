/**
 * OrderPageHeader Component
 * 
 * Header section for OrderPage with title, description, and action buttons.
 */

import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTheme } from '../../../shared/hooks';
import { fadeSlideUp } from '../../../components/animations/menuAnimations';
import PropTypes from 'prop-types';

/**
 * OrderPageHeader Component
 * 
 * @param {Object} props
 * @param {Object|null} props.user - Current user
 * @param {Function} props.onShowSignupModal - Show signup modal callback
 */
export function OrderPageHeader({ user, onShowSignupModal }) {
  const isLightTheme = useTheme();

  return (
    <m.div
      variants={fadeSlideUp}
      custom={0.1}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="glow-surface glow-subtle rounded-xl sm:rounded-2xl border border-theme-subtle bg-[var(--bg-main)]/82 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 shadow-[0_28px_60px_-55px_rgba(5,5,9,0.55)] backdrop-blur-sm"
    >
      <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted">Online Orders</p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Order Online</h1>
          <p className="text-[10px] sm:text-xs text-muted">
            Discover freshly prepared meals ready for takeaway or pickup
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link 
            to="/menu" 
            className="btn-primary whitespace-nowrap min-h-[44px] inline-flex items-center justify-center px-5 py-3"
          >
            View Full Menu
          </Link>
          {user ? (
            <Link
              to="/order-history"
              className="rounded-xl border border-theme px-5 py-3 text-sm sm:text-base font-semibold text-[var(--text-main)] transition hover:border-theme-medium whitespace-nowrap text-center min-h-[44px] inline-flex items-center justify-center"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.05)';
              }}
            >
              Order History
            </Link>
          ) : (
            <button
              type="button"
              onClick={onShowSignupModal}
              className="rounded-xl border border-theme px-5 py-3 text-sm sm:text-base font-semibold text-[var(--text-main)] transition hover:border-theme-medium whitespace-nowrap text-center min-h-[44px]"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.05)';
              }}
            >
              Order History
            </button>
          )}
        </div>
      </div>
    </m.div>
  );
}

OrderPageHeader.propTypes = {
  user: PropTypes.object,
  onShowSignupModal: PropTypes.func.isRequired,
};

