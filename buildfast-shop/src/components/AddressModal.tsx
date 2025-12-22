import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import AddressForm, { Address, AddressFormData } from './AddressForm'
import { Button } from './ui/button'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

/**
 * AddressModalProps interface
 */
export interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  address?: Address | null
  onSave: (data: AddressFormData) => void
  loading?: boolean
}

/**
 * AddressModal Component
 *
 * Modal wrapper for AddressForm component
 *
 * @param {AddressModalProps} props - Component props
 */
function AddressModal({ isOpen, onClose, address = null, onSave, loading = false }: AddressModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Body scroll lock
  useBodyScrollLock(isOpen);
  
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
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

  // Keyboard handler (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Ensure we can render at body level (SSR safety)
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99998] flex items-center justify-center backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      onClick={onClose}
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <div 
        className="relative flex w-full max-w-2xl flex-col rounded-xl sm:rounded-2xl border border-[var(--border-default)] overflow-hidden"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)',
          boxShadow: isLightTheme 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
          maxHeight: 'calc(100vh - 2rem)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Close Button - Mobile-First Design */}
        <div 
          className="sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-main)]/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
          style={{
            position: 'sticky',
            top: 0,
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          {/* Title */}
          <div className="flex-1 min-w-0 pr-3">
            <h2 
              id="address-modal-title" 
              className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)] tracking-tight truncate"
            >
              {address ? 'Edit Address' : 'Add New Address'}
            </h2>
          </div>

          {/* Close Button - Always visible and accessible */}
          <Button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-sm border border-[var(--border-default)] hover:bg-[var(--bg-hover)] shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50"
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 101
            }}
            disabled={loading}
            aria-label="Close address modal"
          >
            <svg 
              className="w-5 h-5 text-[var(--text-main)]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Scrollable Content - Below header */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-10 py-4 sm:py-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Form */}
          <AddressForm
            initialAddress={address}
            onSubmit={onSave}
            onCancel={onClose}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body)
}

export default AddressModal

