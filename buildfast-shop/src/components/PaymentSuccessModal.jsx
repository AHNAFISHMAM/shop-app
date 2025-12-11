import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Payment Success Modal Component
 *
 * Professional modal showing payment confirmation with animations
 * Renders via Portal at body level to ensure it's above all other content
 */
function PaymentSuccessModal({ isOpen, orderId, orderTotal, currencySymbol = '৳', onClose }) {
  const [countdown, setCountdown] = useState(10); // Increased from 5 to 10 seconds
  const [mounted, setMounted] = useState(false);
  
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Ensure component is mounted (SSR safety)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
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

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('PaymentSuccessModal opened - resetting countdown to 10 seconds');
      setCountdown(10); // Reset to 10 seconds when modal opens
    } else {
      // Reset countdown when modal closes
      setCountdown(10);
    }
  }, [isOpen]);

  // Countdown timer - triggers onClose when it reaches 0
  useEffect(() => {
    if (!isOpen) {
      return; // Don't run countdown if modal is closed
    }
    
    if (countdown > 0) {
      // Continue countdown
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown reached 0 - trigger close after a brief delay
      console.log('PaymentSuccessModal countdown reached 0 - closing modal');
      const closeTimer = setTimeout(() => {
        onClose();
      }, 500); // Small delay to ensure smooth transition
      return () => clearTimeout(closeTimer);
    }
  }, [isOpen, countdown, onClose]);

  if (!isOpen || !mounted) {
    return null;
  }

  // Ensure we can render at body level
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
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

      {/* Modal */}
      <div 
        className="fixed inset-0 flex items-center justify-center px-4 sm:px-6 md:px-10 pointer-events-none"
        style={{
          zIndex: 99999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        <div
          className="pointer-events-auto w-full max-w-lg rounded-xl sm:rounded-2xl border border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur-lg animate-scale-in relative"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(5, 5, 9, 0.95)',
            boxShadow: isLightTheme 
              ? '0 35px 120px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
              : '0 35px 120px rgba(0, 0, 0, 0.55)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent halo */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-theme-subtle bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_70%)] opacity-60 pointer-events-none" />

          <div className="relative z-10">
            {/* Animated Checkmark */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-[rgba(197,157,95,0.12)] flex items-center justify-center animate-pulse-slow">
                  <div className="w-24 h-24 rounded-full bg-[var(--accent)] flex items-center justify-center animate-scale-in-delayed shadow-[0_0_25px_rgba(197,157,95,0.6)]">
                    <svg
                      className="w-12 h-12 text-black animate-check-draw"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                        style={{
                          strokeDasharray: '20',
                          strokeDashoffset: '20',
                          animation: 'checkDraw 0.6s ease-in-out 0.3s forwards'
                        }}
                      />
                    </svg>
                  </div>
                </div>

                <div className="absolute -top-2 -right-2 text-[var(--accent)]/90 animate-sparkle">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3l1.5 4.5L16 9l-4.5 1.5L10 15l-1.5-4.5L4 9l4.5-1.5L10 3z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -left-1 text-[var(--text-main)]/60 animate-sparkle-delayed">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3l1.5 4.5L16 9l-4.5 1.5L10 15l-1.5-4.5L4 9l4.5-1.5L10 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.45em] text-[var(--text-main)]/40 mb-3">Payment Confirmed</p>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold gradient-text mb-2">
                Thank You For Your Order
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-main)]/70 max-w-sm mx-auto">
                Your payment was processed successfully. We&apos;re preparing everything with care.
              </p>
              {orderId && (
                <div className="mt-6 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-left">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[var(--text-main)]/50">Order ID</p>
                  <p className="mt-1 font-mono text-sm sm:text-base text-[var(--text-main)]">
                    #{orderId?.slice(0, 8) || 'XXXXXXXX'}
                  </p>
                </div>
              )}
            </div>

            {/* Order Details */}
            {orderTotal !== undefined && orderTotal !== null && (
              <div className="mb-8 rounded-xl sm:rounded-2xl border border-theme bg-white/5 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
                <div className="flex items-center justify-between gap-3 sm:gap-4 md:gap-6">
                  <span className="text-sm sm:text-base text-[var(--text-main)]/60">Order Total</span>
                  <span className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--accent)]">
                    {currencySymbol}{Number(orderTotal).toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-3 sm:gap-4 md:gap-6 text-sm sm:text-base text-[var(--text-main)]/60">
                  <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>A confirmation email with your receipt has been sent. Keep an eye out for updates.</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 gap-3 sm:gap-4 md:gap-6">
              <button
                onClick={onClose}
                className="btn-primary w-full justify-center py-3 min-h-[44px] text-sm sm:text-base uppercase tracking-wide shadow-[0_12px_45px_rgba(197,157,95,0.45)] hover:shadow-[0_18px_55px_rgba(197,157,95,0.55)]"
              >
                Continue Exploring
              </button>
              <p className="text-center text-[10px] sm:text-xs text-[var(--text-main)]/50">
                Redirecting in {countdown} seconds...
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 min-h-[44px] text-[var(--text-main)]/50 transition-colors"
            style={{
              borderRadius: '0.5rem',
              padding: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.08)' 
                : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes checkDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scaleInDelayed {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        @keyframes sparkleDelayed {
          0%, 40% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          70% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }

        @keyframes pulseSlow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-scale-in-delayed {
          animation: scaleInDelayed 0.6s ease-out;
        }

        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out;
        }

        .animate-sparkle-delayed {
          animation: sparkleDelayed 2s ease-in-out 0.3s;
        }

        .animate-check-draw {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
        }
      `}</style>
    </>
  );

  // Render modal via Portal at body level to ensure it's above all other content
  return createPortal(modalContent, document.body);
}

PaymentSuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  orderId: PropTypes.string,
  orderTotal: PropTypes.number,
  currencySymbol: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

export default PaymentSuccessModal;
