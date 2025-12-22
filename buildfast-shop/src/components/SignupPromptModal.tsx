import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback } from 'react';

/**
 * SignupPromptModal component props
 */
interface SignupPromptModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Professional Signup Prompt Modal
 *
 * Renders via Portal at body level to overlay everything.
 * Perfectly centered in viewport.
 * Features:
 * - Portal-based rendering
 * - Body scroll lock when open
 * - Keyboard navigation (Escape key)
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks, reduced motion support)
 */
const SignupPromptModal = ({ isOpen, onClose }: SignupPromptModalProps) => {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

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

  // Watch for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Memoized hover handlers
  const getHoverBackgroundColor = useCallback((isHover: boolean) => {
    if (!isHover) return 'rgba(255, 255, 255, 0.05)';
    return isLightTheme
      ? 'rgba(var(--bg-dark-rgb), 0.08)'
      : 'rgba(var(--text-main-rgb), 0.1)';
  }, [isLightTheme]);

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
        className="fixed inset-0 backdrop-blur-sm"
        style={{
          zIndex: 99998,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isLightTheme
            ? 'rgba(var(--bg-dark-rgb), 0.45)'
            : 'rgba(var(--bg-dark-rgb), 0.5)',
          animation: prefersReducedMotion ? 'none' : 'fade-in 0.2s ease-out'
        }}
        onClick={onClose}
        aria-hidden="true"
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
        aria-describedby="signup-modal-description"
      >
        <div
          className="w-full max-w-md border border-[var(--border-default)] rounded-xl sm:rounded-2xl my-auto"
          style={{
            backgroundColor: isLightTheme
              ? 'rgba(var(--text-main-rgb), 0.95)'
              : 'rgba(var(--bg-dark-rgb), 0.95)',
            position: 'relative',
            boxShadow: isLightTheme
              ? '0 25px 50px -12px rgba(var(--bg-dark-rgb), 0.3), 0 0 0 1px rgba(var(--bg-dark-rgb), 0.1)'
              : '0 25px 50px -12px rgba(var(--bg-dark-rgb), 0.5)',
            animation: prefersReducedMotion ? 'none' : 'scale-in 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header with Close Button - Mobile-First Design */}
          <div 
            className="sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-main)]/95 backdrop-blur-sm px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex-shrink-0"
            style={{
              position: 'sticky',
              top: 0,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-1 min-w-0 pr-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)]"
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
              <div className="flex-1 min-w-0">
                <h2 id="signup-modal-title" className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-main)] truncate">Save Your Favorites</h2>
                <p id="signup-modal-description" className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 hidden sm:block">Unlock this feature with an account</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-full bg-[var(--bg-main)]/90 backdrop-blur-sm border border-[var(--border-default)] hover:bg-[var(--bg-hover)] shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              style={{
                position: 'relative',
                zIndex: 101,
                pointerEvents: 'auto'
              }}
              aria-label="Close signup prompt modal"
            >
              <svg 
                className="w-5 h-5 text-[var(--text-main)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-10 py-4 sm:py-6"
            style={{
              WebkitOverflowScrolling: 'touch',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Mobile-only description */}
            <p className="text-sm text-[var(--text-muted)] mb-4 sm:hidden">
              Unlock this feature with an account
            </p>
            <p className="text-sm sm:text-base text-[var(--text-main)] leading-relaxed mb-6">
              Create a free account to save your favorite dishes and quickly reorder your go-to meals.
              It only takes a minute to get started!
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6 gap-3 sm:gap-4 md:gap-6" role="list">
              <div className="flex items-start gap-3 sm:gap-4 md:gap-6" role="listitem">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[var(--text-main)]">Save Favorite Dishes</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">Keep track of meals you love</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-6" role="listitem">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[var(--text-main)]">Quick Reordering</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">Order your favorites in seconds</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 md:gap-6" role="listitem">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[var(--text-main)]">Order History</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">View all your past orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 pt-0 flex flex-col gap-3 sm:gap-4 md:gap-6">
            <Link
              to="/signup"
              onClick={onClose}
              className="w-full px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl bg-[var(--accent)] text-black font-semibold text-sm sm:text-base text-center hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Create a free account"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              onClick={onClose}
              className="w-full px-6 py-3 min-h-[44px] rounded-xl sm:rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-main)] font-medium text-sm sm:text-base text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Log in to existing account"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getHoverBackgroundColor(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              I Already Have an Account
            </Link>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 min-h-[44px] text-sm sm:text-base text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Close modal and continue without signing up"
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

export default SignupPromptModal;

