import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import ReservationForm from './ReservationForm';
import PropTypes from 'prop-types';

// Modal animation variants
const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
};

const modalContentVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.05
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { 
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

const ReservationModal = ({
  isOpen,
  onClose,
  onSubmit,
  submitting
}) => {
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
  }, []);
  
  const closeButtonRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Get current scroll position and store in ref
    scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
    
    // Store original styles
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    // Lock body scroll and preserve scroll position
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    
    // Add class for additional styling if needed
    document.body.classList.add('modal-open');

    return () => {
      // Restore original styles
      document.body.style.position = originalStyle.position || '';
      document.body.style.top = originalStyle.top || '';
      document.body.style.width = originalStyle.width || '';
      document.body.style.overflow = originalStyle.overflow || '';
      document.body.classList.remove('modal-open');
      
      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [isOpen]);

  // Fix mobile viewport height issues
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  // Ensure we can render at body level (SSR safety)
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reservation-guidelines-title"
          aria-describedby="reservation-guidelines-description"
          onClick={onClose}
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            zIndex: 99998,
            minHeight: '100%',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <m.div
            className="relative flex w-full max-w-5xl flex-col rounded-3xl border border-theme overflow-hidden my-auto"
            style={{ 
              backgroundColor: isLightTheme 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(5, 5, 9, 0.95)',
              zIndex: 99999,
              maxHeight: 'calc(var(--vh, 1vh) * 100 - 2rem)',
              maxWidth: 'calc(100vw - 2rem)',
              width: '100%',
              margin: '1rem auto',
              boxShadow: isLightTheme 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(event) => event.stopPropagation()}
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              type="button"
              onClick={onClose}
              ref={closeButtonRef}
              className="absolute right-6 top-6 z-10 rounded-full p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted hover:text-[var(--text-main)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]"
              aria-label="Close reservation information"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div
              data-overlay-scroll
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-8 py-4 sm:py-6"
              style={{
                maxHeight: 'calc(var(--vh, 1vh) * 100 - 8rem)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="mx-auto w-full max-w-4xl space-y-6 pb-1">
                <div
                  className="space-y-2 text-center"
                  data-animate="fade-scale"
                  data-animate-active="false"
                >
                  <h2 id="reservation-guidelines-title" className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
                    Reserve Your Table
                  </h2>
                  <p id="reservation-guidelines-description" className="text-xs text-muted/80">
                    Complete your reservation in one step
                  </p>
                </div>

                <div className="w-full">
                  <ReservationForm
                    onSubmit={onSubmit}
                    disabled={submitting}
                    className="!bg-transparent !border-0 !shadow-none p-0"
                  />
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body);
};

ReservationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool
};

export default ReservationModal;

