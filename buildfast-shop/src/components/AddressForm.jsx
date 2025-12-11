import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * AddressForm Component
 *
 * Reusable form for adding/editing shipping addresses
 *
 * @param {Object} initialAddress - Initial address data (for edit mode)
 * @param {Function} onSubmit - Callback when form is submitted
 * @param {Function} onCancel - Callback when form is cancelled
 * @param {boolean} loading - Whether form is submitting
 */
function AddressForm({ initialAddress = null, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    isDefault: false
  })

  const [errors, setErrors] = useState({})

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

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

  // Populate form if editing
  useEffect(() => {
    if (initialAddress) {
      setFormData({
        label: initialAddress.label || 'Home',
        fullName: initialAddress.fullName || '',
        addressLine1: initialAddress.addressLine1 || '',
        addressLine2: initialAddress.addressLine2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        postalCode: initialAddress.postalCode || '',
        country: initialAddress.country || 'United States',
        phone: initialAddress.phone || '',
        isDefault: initialAddress.isDefault || false
      })
    }
  }, [initialAddress])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    // Address validation
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required'
    } else if (formData.addressLine1.trim().length < 5) {
      newErrors.addressLine1 = 'Address must be at least 5 characters'
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters'
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State/Province is required'
    } else if (formData.state.trim().length < 2) {
      newErrors.state = 'State/Province must be at least 2 characters'
    }

    // Postal code validation
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required'
    } else {
      const postalCodeRegex = /^[A-Z0-9\s-]{3,10}$/i
      if (!postalCodeRegex.test(formData.postalCode.trim())) {
        newErrors.postalCode = 'Please enter a valid postal code'
      }
    }

    // Country validation
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-+()]{8,20}$/
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Label Selection */}
      <div>
        <label htmlFor="label" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Address Label <span className="text-red-500">*</span>
        </label>
        <select
          id="label"
          name="label"
          value={formData.label}
          onChange={handleChange}
          disabled={loading}
          className="w-full min-h-[44px] px-4 py-3 border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 cursor-pointer"
        >
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Office">Office</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          disabled={loading}
          className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
            errors.fullName ? 'border-red-500' : 'border-theme'
          }`}
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm sm:text-base text-red-600">{errors.fullName}</p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Address Line 1 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="addressLine1"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
          disabled={loading}
          className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
            errors.addressLine1 ? 'border-red-500' : 'border-theme'
          }`}
          placeholder="123 Main Street"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm sm:text-base text-red-600">{errors.addressLine1}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="addressLine2" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Address Line 2 <span className="text-[var(--text-muted)] text-[10px] sm:text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          id="addressLine2"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={handleChange}
          disabled={loading}
          className="w-full min-h-[44px] px-4 py-3 border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30"
          placeholder="Apt 4B, Suite 200, etc."
        />
      </div>

      {/* City and State Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
              errors.city ? 'border-red-500' : 'border-theme'
            }`}
            placeholder="New York"
          />
          {errors.city && (
            <p className="mt-1 text-sm sm:text-base text-red-600">{errors.city}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            State/Province <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
              errors.state ? 'border-red-500' : 'border-theme'
            }`}
            placeholder="NY"
          />
          {errors.state && (
            <p className="mt-1 text-sm sm:text-base text-red-600">{errors.state}</p>
          )}
        </div>
      </div>

      {/* Postal Code and Country Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
              errors.postalCode ? 'border-red-500' : 'border-theme'
            }`}
            placeholder="10001"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm sm:text-base text-red-600">{errors.postalCode}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 cursor-pointer ${
              errors.country ? 'border-red-500' : 'border-theme'
            }`}
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Other">Other</option>
          </select>
          {errors.country && (
            <p className="mt-1 text-sm sm:text-base text-red-600">{errors.country}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Phone Number <span className="text-[var(--text-muted)] text-[10px] sm:text-xs">(Optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={loading}
          className={`w-full min-h-[44px] px-4 py-3 border bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
            errors.phone ? 'border-red-500' : 'border-theme'
          }`}
          placeholder="+1 (555) 123-4567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm sm:text-base text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Set as Default Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          disabled={loading}
          className="w-4 h-4 text-blue-600 border-theme rounded focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="isDefault" className="ml-2 text-sm sm:text-base text-[var(--text-main)]">
          Set as default shipping address
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 sm:gap-4 md:gap-6 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[44px] px-4 sm:px-6 md:px-10 py-3 bg-blue-600 text-black rounded-xl sm:rounded-2xl hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Saving...' : initialAddress ? 'Update Address' : 'Add Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-[44px] px-4 sm:px-6 md:px-10 py-3 bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl transition font-medium disabled:opacity-50 cursor-pointer"
          style={{
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.08)' 
                : 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(0, 0, 0, 0.04)' 
              : '';
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default AddressForm

AddressForm.propTypes = {
  initialAddress: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    fullName: PropTypes.string,
    addressLine1: PropTypes.string,
    addressLine2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string,
    phone: PropTypes.string,
    isDefault: PropTypes.bool
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
}
