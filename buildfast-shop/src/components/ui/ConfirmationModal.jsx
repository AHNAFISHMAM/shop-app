import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEffect } from 'react';

/**
 * ConfirmationModal - A reusable confirmation dialog component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal is closed (cancel)
 * @param {Function} props.onConfirm - Callback when user confirms action
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Text for confirm button (default: "Delete")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} props.variant - Variant: "danger" (red) or "warning" (orange) (default: "danger")
 * @param {string} props.icon - Optional custom icon (SVG path or component)
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  icon
}) {
  // Body scroll lock
  useBodyScrollLock(isOpen);

  // Keyboard handler (ESC to close)
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

  if (typeof document === 'undefined') return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-500',
      borderColor: 'border-theme',
      shadow: '0 40px 90px -65px rgba(0, 0, 0, 0.4)'
    },
    warning: {
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      buttonBg: 'bg-orange-600 hover:bg-orange-500',
      borderColor: 'border-theme',
      shadow: '0 40px 90px -65px rgba(0, 0, 0, 0.4)'
    }
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  const defaultIcon = variant === 'danger' ? (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  ) : (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 z-[99998] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <m.div
            className={`relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-theme bg-[var(--bg-main)] p-6 sm:p-8 z-[99999]`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              boxShadow: styles.shadow
            }}
          >

            {/* Icon and Title */}
            <div className="mb-6 flex items-center gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}>
                {icon || (
                  <svg className={`h-6 w-6 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {defaultIcon}
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 id="confirmation-modal-title" className="text-xl sm:text-2xl font-semibold text-[var(--text-main)] mb-1">
                  {title}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm sm:text-base text-[var(--text-main)] whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 min-h-[44px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] text-[var(--text-main)] font-semibold rounded-lg hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(197,157,95,0.4)] transition-all duration-300 text-sm sm:text-base"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-6 py-3 min-h-[44px] ${styles.buttonBg} text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base`}
              >
                {confirmText}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

