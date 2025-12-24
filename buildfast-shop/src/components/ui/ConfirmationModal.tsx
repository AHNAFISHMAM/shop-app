import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'framer-motion'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEffect, useRef } from 'react'
import { Button } from './button'
import * as React from 'react'

/**
 * ConfirmationModal - A reusable confirmation dialog component
 *
 * Fully accessible modal with keyboard navigation, focus management, and WCAG 2.2 AA compliance.
 * Supports danger and warning variants with proper color contrast.
 *
 * @example
 * ```tsx
 * <ConfirmationModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="danger"
 * />
 * ```
 */
export interface ConfirmationModalProps {
  /**
   * Whether modal is open
   */
  isOpen: boolean
  /**
   * Callback when modal is closed (cancel)
   */
  onClose: () => void
  /**
   * Callback when user confirms action
   */
  onConfirm: () => void
  /**
   * Modal title
   */
  title: string
  /**
   * Confirmation message
   */
  message: string
  /**
   * Text for confirm button (default: "Delete")
   */
  confirmText?: string
  /**
   * Text for cancel button (default: "Cancel")
   */
  cancelText?: string
  /**
   * Variant: "danger" (red) or "warning" (orange) (default: "danger")
   */
  variant?: 'danger' | 'warning'
  /**
   * Optional custom icon (React node)
   */
  icon?: React.ReactNode
}

// Extract constants outside component (performance best practice)
const VARIANT_STYLES = {
  danger: {
    iconBg: 'bg-[var(--status-error-bg)]',
    iconColor: 'text-[var(--destructive)]',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    iconBg: 'bg-[var(--status-warning-bg)]',
    iconColor: 'text-[var(--status-warning-border)]',
    buttonVariant: 'destructive' as const, // Using destructive for now, can add warning variant to Button later
  },
} as const

const defaultDangerIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  />
)

const defaultWarningIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  />
)

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
}: ConfirmationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock
  useBodyScrollLock(isOpen)

  // Keyboard handler (ESC to close, Enter to confirm)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        // Ctrl/Cmd + Enter to confirm
        onConfirm()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm])

  // Focus management - focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen])

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return undefined

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = [closeButtonRef.current, confirmButtonRef.current].filter(
        Boolean
      ) as HTMLElement[]

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement || focusableElements.length === 0) return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (typeof document === 'undefined') return null

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.danger
  const defaultIcon = variant === 'danger' ? defaultDangerIcon : defaultWarningIcon

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 z-[99998] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          aria-describedby="confirmation-modal-message"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'var(--modal-backdrop)',
          }}
        >
          <m.div
            className="relative flex w-full max-w-md flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-default)] bg-[var(--bg-main)] overflow-hidden z-[99999]"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              boxShadow: 'var(--modal-shadow)',
              maxHeight: 'calc(100vh - 2rem)',
            }}
          >
            {/* Fixed Header with Close Button - Mobile-First Design */}
            <div
              className="sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-main)]/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
              style={{
                position: 'sticky',
                top: 0,
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            >
              {/* Icon and Title */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-3">
                <div
                  className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
                >
                  {icon || (
                    <svg
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.iconColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {defaultIcon}
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    id="confirmation-modal-title"
                    className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-primary)] truncate"
                  >
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] hidden sm:block">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-sm border border-[var(--border-default)] hover:bg-[var(--bg-hover)] shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                style={{
                  position: 'relative',
                  zIndex: 101,
                  pointerEvents: 'auto',
                }}
                aria-label="Close confirmation dialog"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-8 py-4 sm:py-6"
              style={{
                WebkitOverflowScrolling: 'touch',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Mobile-only subtitle */}
              <p className="text-xs text-[var(--text-secondary)] mb-4 sm:hidden">
                This action cannot be undone
              </p>

              {/* Message */}
              <div className="mb-6">
                <p
                  id="confirmation-modal-message"
                  className="text-sm sm:text-base text-[var(--text-primary)] whitespace-pre-line"
                >
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button variant="outline" onClick={onClose} className="flex-1" size="default">
                  {cancelText}
                </Button>
                <Button
                  ref={confirmButtonRef}
                  variant={styles.buttonVariant}
                  onClick={handleConfirm}
                  className="flex-1"
                  size="default"
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
