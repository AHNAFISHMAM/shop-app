import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Professional Signup Prompt Modal
 * Renders via Portal at body level to overlay everything
 * Perfectly centered in viewport
 */
const SignupPromptModal = ({ isOpen, onClose }) => {
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
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Ensure we can render at body level
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  const modalContent = (
    <>
      {/* Backdrop - Click to close */}
      <div
        className="fixed inset-0 backdrop-blur-sm animate-fade-in"
        style={{
          zIndex: 99998,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
      />

      {/* Modal Container - Perfectly Centered */}
      <div
        className="fixed inset-0 flex items-center justify-center px-4 sm:px-6 md:px-10"
        style={{
          zIndex: 99999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div
          className="w-full max-w-md border border-theme rounded-xl sm:rounded-2xl animate-scale-in my-auto"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(5, 5, 9, 0.95)',
            position: 'relative',
            boxShadow: isLightTheme 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 pb-4 border-b border-theme">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 min-h-[44px] flex items-center justify-center rounded-full bg-white/5 transition-colors"
              aria-label="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--accent)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">Save Your Favorites</h2>
                <p className="text-[10px] sm:text-xs text-muted mt-0.5">Unlock this feature with an account</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
            <p className="text-sm sm:text-base text-[var(--text-main)] leading-relaxed mb-6">
              Create a free account to save your favorite dishes and quickly reorder your go-to meals.
              It only takes a minute to get started!
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6 gap-3 sm:gap-4 md:gap-6">
              <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[var(--text-main)]">Save Favorite Dishes</p>
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5">Keep track of meals you love</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[var(--text-main)]">Quick Reordering</p>
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5">Order your favorites in seconds</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[var(--text-main)]">Order History</p>
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5">View all your past orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 pt-0 flex flex-col gap-3 sm:gap-4 md:gap-6">
            <Link
              to="/signup"
              onClick={onClose}
              className="w-full px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl bg-[var(--accent)] text-black font-semibold text-sm sm:text-base text-center hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              onClick={onClose}
              className="w-full px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated text-[var(--text-main)] font-medium text-sm sm:text-base text-center transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              I Already Have an Account
            </Link>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 min-h-[44px] text-sm sm:text-base text-muted hover:text-[var(--text-main)] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body);
};

SignupPromptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SignupPromptModal;
