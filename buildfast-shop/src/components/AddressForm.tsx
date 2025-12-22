import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import CustomDropdown from './ui/CustomDropdown'

/**
 * AddressFormData interface
 */
export interface AddressFormData {
  label: string
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

/**
 * Address interface
 */
export interface Address {
  id?: string | number
  label?: string
  fullName?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
  isDefault?: boolean
}

/**
 * AddressFormProps interface
 */
export interface AddressFormProps {
  initialAddress?: Address | null
  onSubmit: (data: AddressFormData) => void
  onCancel: () => void
  loading?: boolean
}

/**
 * AddressForm Component
 *
 * Reusable form for adding/editing shipping addresses
 *
 * @param {AddressFormProps} props - Component props
 */
function AddressForm({ initialAddress = null, onSubmit, onCancel, loading = false }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
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

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
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

  const handleChange = (e: ChangeEvent<HTMLInputElement> | { target: { value: string | number; name?: string } }) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label={initialAddress ? 'Edit address form' : 'Add address form'}>
      {/* Label Selection */}
      <div>
        <label htmlFor="label" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Address Label <span className="text-[var(--color-red)]" aria-label="required">*</span>
        </label>
        <CustomDropdown
          id="label"
          name="label"
          options={[
            { value: 'Home', label: 'Home' },
            { value: 'Work', label: 'Work' },
            { value: 'Office', label: 'Office' },
            { value: 'Other', label: 'Other' }
          ]}
          value={formData.label}
          onChange={handleChange}
          placeholder="Select label"
          disabled={loading}
          required
          maxVisibleItems={5}
        />
        {errors.label && (
          <p className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.label}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Full Name <span className="text-[var(--color-red)]" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          disabled={loading}
          className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
            errors.fullName ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
          }`}
          placeholder="John Doe"
          aria-required="true"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.fullName}</p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Address Line 1 <span className="text-[var(--color-red)]" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="addressLine1"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
          disabled={loading}
          className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
            errors.addressLine1 ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
          }`}
          placeholder="123 Main Street"
          aria-required="true"
          aria-invalid={!!errors.addressLine1}
          aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
        />
        {errors.addressLine1 && (
          <p id="addressLine1-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.addressLine1}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="addressLine2" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Address Line 2 <span className="text-[var(--text-muted)] text-sm">(Optional)</span>
        </label>
        <input
          type="text"
          id="addressLine2"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={handleChange}
          disabled={loading}
          className="w-full min-h-[44px] px-4 py-3 border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30"
          placeholder="Apt 4B, Suite 200, etc."
        />
      </div>

      {/* City and State Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            City <span className="text-[var(--color-red)]" aria-label="required">*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
              errors.city ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
            }`}
            placeholder="New York"
            aria-required="true"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.city}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            State/Province <span className="text-[var(--color-red)]" aria-label="required">*</span>
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
              errors.state ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
            }`}
            placeholder="NY"
            aria-required="true"
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? 'state-error' : undefined}
          />
          {errors.state && (
            <p id="state-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.state}</p>
          )}
        </div>
      </div>

      {/* Postal Code and Country Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            Postal Code <span className="text-[var(--color-red)]" aria-label="required">*</span>
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            disabled={loading}
            className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
              errors.postalCode ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
            }`}
            placeholder="10001"
            aria-required="true"
            aria-invalid={!!errors.postalCode}
            aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
          />
          {errors.postalCode && (
            <p id="postalCode-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.postalCode}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
            Country <span className="text-[var(--color-red)]" aria-label="required">*</span>
          </label>
          <CustomDropdown
            id="country"
            name="country"
            options={[
              { value: 'United States', label: 'United States' },
              { value: 'Canada', label: 'Canada' },
              { value: 'United Kingdom', label: 'United Kingdom' },
              { value: 'Australia', label: 'Australia' },
              { value: 'Germany', label: 'Germany' },
              { value: 'France', label: 'France' },
              { value: 'Other', label: 'Other' }
            ]}
            value={formData.country}
            onChange={handleChange}
            placeholder="Select country"
            disabled={loading}
            required
            className={errors.country ? 'border-[var(--status-error-border)]' : ''}
            maxVisibleItems={5}
          />
          {errors.country && (
            <p className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.country}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Phone Number <span className="text-[var(--text-muted)] text-sm">(Optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={loading}
          className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:bg-[var(--bg-main)]/30 ${
            errors.phone ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
          }`}
          placeholder="+1 (555) 123-4567"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">{errors.phone}</p>
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
          className="w-4 h-4 min-w-[16px] min-h-[16px] text-[var(--accent)] border-[var(--border-default)] rounded focus:ring-[var(--accent)] cursor-pointer"
          aria-label="Set as default shipping address"
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
          className="flex-1 min-h-[44px] px-4 sm:px-6 md:px-10 py-3 bg-[var(--accent)] text-black rounded-xl sm:rounded-2xl hover:bg-[var(--accent)]/90 transition font-medium disabled:bg-[var(--text-muted)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label={loading ? 'Saving address' : initialAddress ? 'Update address' : 'Add address'}
        >
          {loading ? 'Saving...' : initialAddress ? 'Update Address' : 'Add Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-[44px] px-4 sm:px-6 md:px-10 py-3 bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl transition font-medium disabled:opacity-50 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          style={{
            backgroundColor: isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.04)' : undefined
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(var(--bg-dark-rgb), 0.08)' 
                : 'rgba(var(--text-main-rgb), 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(var(--bg-dark-rgb), 0.04)' 
              : '';
          }}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default AddressForm

