import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import AddressForm from './AddressForm'

/**
 * AddressModal Component
 *
 * Modal wrapper for AddressForm component
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {Object} address - Address data (for edit mode)
 * @param {Function} onSave - Callback when address is saved
 * @param {boolean} loading - Whether form is submitting
 */
function AddressModal({ isOpen, onClose, address = null, onSave, loading = false }) {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-overlay-scroll>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center px-4 sm:px-6 md:px-10">
        <div 
          className="relative rounded-xl sm:rounded-2xl max-w-2xl w-full px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(5, 5, 9, 0.95)',
            boxShadow: isLightTheme 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">
              {address ? 'Edit Address' : 'Add New Address'}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

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
}

export default AddressModal

AddressModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  address: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fullName: PropTypes.string,
    phone: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool
}
