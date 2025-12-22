# 📝 MASTER FORM HANDLING & VALIDATION PROMPT
## Production-Grade Form Implementation with Real-time Validation

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to building forms with real-time validation, error handling, accessibility, and integration with React Query mutations for the **Star Café** application. It covers single-step forms, multi-step forms, field-level validation, form state management, file uploads, and conditional fields based on actual codebase implementations.

**Applicable to:**
- Single-step forms (Login, Signup, Settings, Address)
- Multi-step forms (Wizards, Profile Setup, Onboarding)
- Complex forms with conditional fields (Reservation, Checkout)
- Forms with real-time validation (debounced)
- Forms with file uploads (Review images, Background uploads)
- Forms with nested data structures
- Forms with date/time pickers
- Forms with dropdowns and custom selects

---

## 🎯 CORE PRINCIPLES

### 1. **Validation Strategy**
- **Real-time Validation**: Validate fields as user types (with debouncing - 300ms default)
- **On-Blur Validation**: Validate when user leaves field (immediate feedback)
- **On-Submit Validation**: Final validation before submission (catch all errors)
- **Field-Level Errors**: Show errors next to specific fields
- **Form-Level Errors**: Show general form errors (API errors, submission errors)
- **Progressive Validation**: Don't overwhelm users - validate progressively

### 2. **User Experience**
- **Immediate Feedback**: Show validation errors as soon as possible (after touch)
- **Clear Error Messages**: User-friendly, actionable error messages
- **Loading States**: Show loading indicators during submission
- **Success Feedback**: Confirm successful submission (toast, navigation)
- **Accessibility**: Full keyboard navigation and screen reader support (WCAG 2.2 AA)
- **Mobile-First**: 44px minimum touch targets, responsive layouts

### 3. **State Management**
- **Controlled Components**: Use controlled inputs for form state
- **Touched State**: Track which fields have been interacted with
- **Error State**: Track validation errors per field
- **Form State**: Track overall form validity
- **Dirty State**: Track if form has been modified (optional)

### 4. **Integration**
- **React Query Mutations**: Integrate with mutations for data submission
- **Error Handling**: Transform API errors to user-friendly messages
- **Optimistic Updates**: Update UI optimistically when appropriate
- **Cache Invalidation**: Invalidate related queries on success

### 5. **Accessibility (WCAG 2.2 AA)**
- **Labels**: All inputs have associated labels
- **ARIA Attributes**: `aria-required`, `aria-invalid`, `aria-describedby`
- **Error Announcements**: `role="alert"` for error messages
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper semantic HTML and ARIA

---

## 🔍 PHASE 1: FORM DESIGN & PLANNING

### Step 1.1: Understand Requirements

**Questions to Answer:**
```
1. Identify all form fields and their types
2. Determine validation rules for each field
3. Identify required vs optional fields
4. Plan conditional field logic (if field A, then show field B)
5. Determine submission flow
6. Plan error handling strategy
7. Identify file upload requirements
8. Plan accessibility features
```

### Step 1.2: Validation Rules Planning

**For each field, determine:**
```
1. Required or optional?
2. Minimum/maximum length?
3. Format requirements (email, phone, postal code, etc.)?
4. Custom validation rules?
5. Dependent validation (field depends on another)?
6. Real-time vs on-blur vs on-submit validation?
7. Error message text?
```

### Step 1.3: Form Structure Planning

**Form Types:**
- **Simple Form**: Login, Signup, Contact
- **Complex Form**: Address, Reservation, Checkout
- **Multi-Step Form**: Profile Setup, Onboarding
- **Form with Uploads**: Review with images, Background uploader

---

## 🛠️ PHASE 2: VALIDATION UTILITIES

### Step 2.1: Validation Functions

**Email Validation:**
```typescript
// src/lib/validation.ts

/**
 * Validates email format
 * 
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates email with user-friendly error message
 * 
 * @param email - Email string to validate
 * @returns Error message or null if valid
 */
export function validateEmailWithMessage(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'Email is required'
  }
  if (!validateEmail(email)) {
    return 'Please enter a valid email address'
  }
  return null
}
```

**Password Validation:**
```typescript
/**
 * Validates password strength
 * 
 * @param password - Password string to validate
 * @returns Validation result with errors array
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Name Validation:**
```typescript
/**
 * Validates name (first name, last name, full name)
 * 
 * @param name - Name string to validate
 * @param fieldName - Field name for error messages (default: 'name')
 * @returns Error message or null if valid
 */
export function validateName(name: string, fieldName: string = 'name'): string | null {
  if (!name || name.trim().length === 0) {
    return fieldName === 'first_name' ? 'First name is required' : 
           fieldName === 'last_name' ? 'Last name is required' : 
           fieldName === 'fullName' ? 'Full name is required' :
           `${fieldName} is required`
  }

  const trimmed = name.trim()
  
  if (trimmed.length < 2) {
    return `${fieldName === 'first_name' ? 'First' : fieldName === 'last_name' ? 'Last' : 'Name'} must be at least 2 characters`
  }

  if (trimmed.length > 50) {
    return `${fieldName === 'first_name' ? 'First' : fieldName === 'last_name' ? 'Last' : 'Name'} must be 50 characters or less`
  }

  const nameRegex = /^[A-Za-z]+(?:[\s'-][A-Za-z]+)*$/
  
  if (!nameRegex.test(trimmed)) {
    return 'Letters, spaces, hyphens, and apostrophes only. No numbers or special characters.'
  }

  return null
}
```

**Phone Validation:**
```typescript
/**
 * Validates phone number format
 * 
 * @param phone - Phone string to validate
 * @param required - Whether phone is required (default: false)
 * @returns Error message or null if valid
 */
export function validatePhone(phone: string, required: boolean = false): string | null {
  if (!phone || phone.trim().length === 0) {
    return required ? 'Phone number is required' : null
  }

  const phoneRegex = /^[\d\s\-+()]{8,20}$/
  if (!phoneRegex.test(phone.trim())) {
    return 'Please enter a valid phone number'
  }

  return null
}
```

**Postal Code Validation:**
```typescript
/**
 * Validates postal/ZIP code format
 * 
 * @param postalCode - Postal code string to validate
 * @returns Error message or null if valid
 */
export function validatePostalCode(postalCode: string): string | null {
  if (!postalCode || postalCode.trim().length === 0) {
    return 'Postal code is required'
  }

  const postalCodeRegex = /^[A-Z0-9\s-]{3,10}$/i
  if (!postalCodeRegex.test(postalCode.trim())) {
    return 'Please enter a valid postal code'
  }

  return null
}
```

**Address Validation:**
```typescript
/**
 * Validates address line
 * 
 * @param address - Address string to validate
 * @param fieldName - Field name for error messages (default: 'Address')
 * @returns Error message or null if valid
 */
export function validateAddress(address: string, fieldName: string = 'Address'): string | null {
  if (!address || address.trim().length === 0) {
    return `${fieldName} is required`
  }

  const trimmed = address.trim()
  
  if (trimmed.length < 5) {
    return `${fieldName} must be at least 5 characters`
  }

  if (trimmed.length > 200) {
    return `${fieldName} must be 200 characters or less`
  }

  return null
}
```

**Monetary Amount Validation:**
```typescript
/**
 * Validates monetary amount
 * 
 * @param value - Amount value (number or string)
 * @param options - Validation options
 * @returns Validation result
 */
export function validateAmount(
  value: number | string,
  options?: {
    min?: number
    max?: number
    required?: boolean
    fieldName?: string
  }
): { isValid: boolean; error?: string } {
  const { min = 0, max = 1000000000, required = false, fieldName = 'Amount' } = options || {}
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (required && (numValue === undefined || numValue === null || isNaN(numValue))) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (isNaN(numValue) || numValue < min) {
    return { isValid: false, error: `${fieldName} must be at least $${min.toLocaleString()}` }
  }

  if (numValue > max) {
    return { isValid: false, error: `${fieldName} cannot exceed $${max.toLocaleString()}` }
  }

  return { isValid: true }
}
```

### Step 2.2: Validation Checklist

- [ ] Validation functions are pure (no side effects)
- [ ] Return consistent error format (string | null)
- [ ] Handle edge cases (null, undefined, empty strings)
- [ ] User-friendly error messages
- [ ] Type-safe validation functions
- [ ] Reusable across forms

---

## 📝 PHASE 3: SINGLE-STEP FORM IMPLEMENTATION

### Step 3.1: Basic Form Pattern

**Complete Address Form Example (Real from Codebase):**
```typescript
// src/components/AddressForm.tsx

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import CustomDropdown from './ui/CustomDropdown'

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

export interface AddressFormProps {
  initialAddress?: Address | null
  onSubmit: (data: AddressFormData) => void
  onCancel: () => void
  loading?: boolean
}

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
    // Clear error for this field when user starts typing
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
          <p id="fullName-error" className="mt-1 text-sm sm:text-base text-[var(--color-red)]" role="alert" aria-live="polite">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Other fields... */}

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
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default AddressForm
```

### Step 3.2: Form with Real-time Validation

**Form with Debounced Validation:**
```typescript
import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'

function FormWithRealTimeValidation() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Debounce values for validation
  const debouncedEmail = useDebounce(formData.email, 300)
  const debouncedName = useDebounce(formData.name, 300)

  // Real-time validation (debounced)
  useEffect(() => {
    if (touched.email && debouncedEmail) {
      const error = validateEmailWithMessage(debouncedEmail)
      setErrors(prev => ({
        ...prev,
        email: error || '',
      }))
    }
  }, [debouncedEmail, touched.email])

  useEffect(() => {
    if (touched.name && debouncedName) {
      const error = validateName(debouncedName, 'name')
      setErrors(prev => ({
        ...prev,
        name: error || '',
      }))
    }
  }, [debouncedName, touched.name])

  const handleChange = useCallback((fieldName: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }, [errors])

  const handleBlur = useCallback((fieldName: string) => () => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    // Immediate validation on blur
    if (fieldName === 'email') {
      const error = validateEmailWithMessage(formData.email)
      setErrors(prev => ({ ...prev, email: error || '' }))
    } else if (fieldName === 'name') {
      const error = validateName(formData.name, 'name')
      setErrors(prev => ({ ...prev, name: error || '' }))
    }
  }, [formData])

  // ... rest of form
}
```

### Step 3.3: Form with React Query Mutation

**Form Integrated with React Query:**
```typescript
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAddress } from '../lib/addressService'
import { getUserFriendlyError } from '../lib/error-handler'
import toast from 'react-hot-toast'

function AddressFormWithMutation({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<AddressFormData>({
    // ... initial values
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (data) => {
      toast.success('Address saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      onSuccess?.()
    },
    onError: (error) => {
      const message = getUserFriendlyError(error)
      toast.error(message)
      
      // Map API errors to form fields if applicable
      if (error instanceof Error && error.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: 'This email is already in use' }))
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    createMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Saving...' : 'Save Address'}
      </button>
    </form>
  )
}
```

### Step 3.4: Single-Step Form Checklist

- [ ] Form state managed with useState
- [ ] Error state tracked per field
- [ ] Touched state tracked per field
- [ ] Real-time validation with debouncing (300ms)
- [ ] On-blur validation (immediate)
- [ ] On-submit validation (final check)
- [ ] Error messages displayed next to fields
- [ ] Loading state during submission
- [ ] Success/error feedback (toast)
- [ ] Accessibility (labels, ARIA attributes)
- [ ] 44px minimum touch targets
- [ ] React Query mutation integration

---

## 🔄 PHASE 4: MULTI-STEP FORM IMPLEMENTATION

### Step 4.1: Multi-Step Form Pattern

**Reservation Form Example (Real from Codebase):**
```typescript
// src/components/ReservationForm.tsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getReservationSettings, generateTimeSlotsFromSettings } from '../lib/reservationSettingsService'

export interface ReservationFormData {
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  requests?: string
  occasion?: string
  preference?: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  date?: string
  time?: string
  guests?: string
}

function ReservationForm({ onSubmit, disabled = false }: ReservationFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ReservationFormData>({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    requests: '',
    occasion: '',
    preference: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState<ReservationSettings | null>(null)

  // Load reservation settings
  useEffect(() => {
    getReservationSettings()
      .then(setSettings)
      .catch((error) => {
        // ✅ CORRECT - Use logger utility instead of console.error
        logger.error('Failed to load reservation settings:', error)
        // Optionally set default settings on error
        setSettings(DEFAULT_SETTINGS)
      })
  }, [])

  // Generate time slots based on selected date and settings
  const timeSlots = useMemo(() => {
    if (!formData.date || !settings) return []
    return generateTimeSlotsFromSettings(formData.date, settings)
  }, [formData.date, settings])

  // Validate single field
  // ✅ CORRECT - Use proper type instead of 'any'
  const validateField = useCallback((
    fieldName: keyof ReservationFormData, 
    value: string | number | undefined
  ): string | null => {
    if (fieldName === 'name') {
      if (!value || value.trim().length === 0) {
        return 'Name is required'
      }
      if (value.trim().length < 2) {
        return 'Name must be at least 2 characters'
      }
    }

    if (fieldName === 'email') {
      if (!value || value.trim().length === 0) {
        return 'Email is required'
      }
      if (!validateEmail(value)) {
        return 'Please enter a valid email address'
      }
    }

    if (fieldName === 'phone') {
      if (!value || value.trim().length === 0) {
        return 'Phone number is required'
      }
      const phoneRegex = /^[\d\s\-+()]{8,20}$/
      if (!phoneRegex.test(value.trim())) {
        return 'Please enter a valid phone number'
      }
    }

    if (fieldName === 'date') {
      if (!value) {
        return 'Date is required'
      }
      // Additional date validation (not in past, within booking window, etc.)
    }

    if (fieldName === 'time') {
      if (!value) {
        return 'Time is required'
      }
    }

    if (fieldName === 'guests') {
      if (!value || value < 1) {
        return 'Number of guests must be at least 1'
      }
      if (value > (settings?.max_party_size || 20)) {
        return `Maximum party size is ${settings?.max_party_size || 20}`
      }
    }

    return null
  }, [settings])

  // Real-time validation with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (touched.name && formData.name) {
        const error = validateField('name', formData.name)
        setErrors(prev => ({ ...prev, name: error || undefined }))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [formData.name, touched.name, validateField])

  // Similar effects for other fields...

  const handleChange = useCallback((fieldName: keyof ReservationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' 
      ? parseInt(e.target.value, 10) 
      : e.target.value
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }, [errors])

  const handleBlur = useCallback((fieldName: keyof ReservationFormData) => () => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    const error = validateField(fieldName, formData[fieldName])
    setErrors(prev => ({ ...prev, [fieldName]: error || undefined }))
  }, [formData, validateField])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof ReservationFormData
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        newErrors[fieldName] = error
      }
    })

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      date: true,
      time: true,
      guests: true,
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    await onSubmit?.(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-main)] mb-2">
          Full Name <span className="text-[var(--color-red)]" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          disabled={disabled}
          className={`w-full min-h-[44px] px-4 py-3 border bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent ${
            errors.name ? 'border-[var(--status-error-border)]' : 'border-[var(--border-default)]'
          }`}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-[var(--color-red)]" role="alert" aria-live="polite">
            {errors.name}
          </p>
        )}
      </div>

      {/* Other fields... */}

      <button
        type="submit"
        disabled={disabled}
        className="w-full min-h-[44px] px-6 py-3 bg-[var(--accent)] text-black rounded-xl font-medium disabled:opacity-50"
      >
        Book Reservation
      </button>
    </form>
  )
}
```

### Step 4.2: Multi-Step Form Checklist

- [ ] Step state management
- [ ] Step validation (validate current step before proceeding)
- [ ] Navigation between steps
- [ ] Progress indicator
- [ ] Data persistence across steps
- [ ] Final submission validation
- [ ] Step-specific error handling

---

## 📤 PHASE 5: FORMS WITH FILE UPLOADS

### Step 5.1: File Upload Form Pattern

**Review Form with Image Upload (Real from Codebase):**
```typescript
// src/components/ReviewForm.tsx

import { useState, useEffect, useCallback } from 'react'
import { createReview, uploadReviewImage } from '../lib/reviewsApi'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState<string>('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const MAX_IMAGES = 5
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_REVIEW_LENGTH = 1000

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)

    // Validate number of images
    if (images.length + files.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images`)
      return
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE)
    if (invalidFiles.length > 0) {
      setError('Each image must be less than 5MB')
      return
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const invalidTypes = files.filter(file => !validTypes.includes(file.type))
    if (invalidTypes.length > 0) {
      setError('Invalid file type. Please upload a JPG, PNG, or WebP image.')
      return
    }

    try {
      // Create previews
      const newPreviews = await Promise.all(
        files.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result)
              } else {
                reject(new Error(`Failed to read ${file.name}`))
              }
            }
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
            reader.readAsDataURL(file)
          })
        })
      )

      setImages([...images, ...files])
      setImagePreviews([...imagePreviews, ...newPreviews])
      setError('')
    } catch (error) {
      logger.error('Error reading image files:', error)
      setError('Failed to read one or more image files. Please try again.')
    }
  }, [images])

  const removeImage = useCallback((index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }, [images, imagePreviews])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }

    if (reviewText.trim().length > MAX_REVIEW_LENGTH) {
      setError(`Review text must be ${MAX_REVIEW_LENGTH} characters or less`)
      return
    }

    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to submit a review')
        return
      }

      // Upload images first
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const url = await uploadReviewImage(image, productId)
          imageUrls.push(url)
        } catch (uploadError) {
          logger.error('Error uploading image:', uploadError)
          // Continue with other images even if one fails
        }
      }

      // Create review with image URLs
      const reviewData = {
        productId,
        rating,
        reviewText: reviewText.trim(),
        images: imageUrls,
      }

      await createReview(reviewData)
      onSuccess?.()
    } catch (err) {
      logger.error('Error submitting review:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [rating, reviewText, images, productId, onSuccess])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Rating <span className="text-red-400">*</span>
        </label>
        <StarRating rating={rating} onRatingChange={setRating} />
        {error && rating === 0 && (
          <p className="mt-1 text-sm text-red-500" role="alert">{error}</p>
        )}
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium mb-2">
          Review <span className="text-[var(--text-muted)] text-sm">(Optional)</span>
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={MAX_REVIEW_LENGTH}
          rows={5}
          className="w-full min-h-[44px] px-4 py-3 border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
          aria-describedby="reviewText-helper"
        />
        <p id="reviewText-helper" className="mt-1 text-sm text-[var(--text-muted)]">
          {reviewText.length}/{MAX_REVIEW_LENGTH} characters
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label htmlFor="images" className="block text-sm font-medium mb-2">
          Images <span className="text-[var(--text-muted)] text-sm">(Optional, max {MAX_IMAGES})</span>
        </label>
        <input
          type="file"
          id="images"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleImageSelect}
          disabled={loading || images.length >= MAX_IMAGES}
          className="w-full min-h-[44px] px-4 py-3 border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
        />
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800" role="alert">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full min-h-[44px] px-6 py-3 bg-[var(--accent)] text-black rounded-xl font-medium disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
```

### Step 5.2: File Upload Validation

**File Upload Validation Pattern:**
```typescript
/**
 * Validates file upload
 * 
 * @param file - File to validate
 * @param options - Validation options
 * @returns Error message or null if valid
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    maxFiles?: number
  } = {}
): string | null {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxFiles = 5 } = options

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
    return `File size must be less than ${maxSizeMB}MB`
  }

  return null
}
```

### Step 5.3: File Upload Checklist

- [ ] File type validation
- [ ] File size validation
- [ ] Maximum number of files
- [ ] Image preview generation
- [ ] Upload progress indication
- [ ] Error handling for upload failures
- [ ] Remove file functionality
- [ ] Accessibility (labels, ARIA)

---

## 🎨 PHASE 6: ACCESSIBILITY PATTERNS

### Step 6.1: Accessible Input Component

**Input Component with Full Accessibility (Real from Codebase):**
```typescript
// src/components/ui/Input.tsx

import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string
  helperText?: string
  error?: string
  success?: boolean
  size?: "sm" | "default" | "lg"
  wrapperClassName?: string
}

const SIZE_CLASSES = {
  sm: "min-h-[44px] h-11 px-3 py-2.5 text-sm",
  default: "min-h-[44px] h-11 px-4 py-2.5 text-sm",
  lg: "min-h-[44px] h-12 px-4 py-3 text-base",
} as const

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      helperText,
      error,
      success = false,
      size = "default",
      id,
      type = "text",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided (for label association)
    const inputId = React.useId()
    const finalId = id || inputId
    const hasError = Boolean(error)
    const showHelperText = Boolean(helperText || error)

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={finalId}
            className={cn(
              "block text-sm font-medium text-[var(--text-primary)]",
              hasError && "text-[var(--color-red)]",
              success && "text-green-600"
            )}
          >
            {label}
            {required && (
              <span className="text-[var(--color-red)] ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input */}
        <input
          type={type}
          id={finalId}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={
            showHelperText
              ? `${finalId}-${hasError ? "error" : "helper"}`
              : undefined
          }
          className={cn(
            SIZE_CLASSES[size],
            "w-full rounded-lg border bg-[var(--bg-elevated)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-[var(--status-error-border)] focus-visible:ring-red-500"
              : success
              ? "border-green-500 focus-visible:ring-green-500"
              : "border-[var(--border-default)]",
            className
          )}
          {...props}
        />

        {/* Helper Text or Error */}
        {showHelperText && (
          <p
            id={`${finalId}-${hasError ? "error" : "helper"}`}
            className={cn(
              "text-sm",
              hasError
                ? "text-[var(--color-red)]"
                : success
                ? "text-green-600"
                : "text-[var(--text-muted)]"
            )}
            role={hasError ? "alert" : undefined}
            aria-live={hasError ? "polite" : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
```

### Step 6.2: Accessibility Checklist

- [ ] All inputs have associated labels (`htmlFor`/`id`)
- [ ] Required fields marked with `aria-required="true"`
- [ ] Error states marked with `aria-invalid="true"`
- [ ] Error messages linked with `aria-describedby`
- [ ] Error messages have `role="alert"` and `aria-live="polite"`
- [ ] 44px minimum touch targets
- [ ] Keyboard navigation support
- [ ] Focus visible indicators
- [ ] Screen reader announcements

---

## 🔄 PHASE 7: INTEGRATION WITH REACT QUERY

### Step 7.1: Form with Mutation

**Complete Form with React Query Integration:**
```typescript
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAddress } from '../lib/addressService'
import { getUserFriendlyError } from '../lib/error-handler'
import toast from 'react-hot-toast'

function AddressFormWithMutation({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<AddressFormData>({
    // ... initial values
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (data) => {
      toast.success('Address saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      onSuccess?.()
    },
    onError: (error) => {
      const message = getUserFriendlyError(error)
      toast.error(message)
      
      // Map API errors to form fields if applicable
      if (error instanceof Error) {
        // Check for field-specific errors
        if (error.message.includes('email')) {
          setErrors(prev => ({ ...prev, email: 'This email is already in use' }))
        }
        if (error.message.includes('phone')) {
          setErrors(prev => ({ ...prev, phone: 'This phone number is already in use' }))
        }
      }
    },
  })

  const validate = (): boolean => {
    // Validation logic
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    createMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={createMutation.isPending}
        aria-label={createMutation.isPending ? 'Saving address' : 'Save address'}
      >
        {createMutation.isPending ? 'Saving...' : 'Save Address'}
      </button>
    </form>
  )
}
```

### Step 7.2: Integration Checklist

- [ ] Mutation integrated with form submission
- [ ] Loading state from mutation (`isPending`)
- [ ] Error handling from mutation (`onError`)
- [ ] Success handling (toast, navigation, etc.)
- [ ] Form reset on success (if needed)
- [ ] API errors mapped to form errors
- [ ] Cache invalidation on success
- [ ] Optimistic updates (if applicable)

---

## 📱 PHASE 8: MOBILE-FIRST FORM PATTERNS

### Step 8.1: Mobile Form Considerations

**Mobile Form Best Practices:**
```typescript
// Mobile-first form styling
const mobileFormStyles = {
  // 44px minimum touch targets
  input: "min-h-[44px]",
  button: "min-h-[44px] min-w-[44px]",
  
  // Responsive spacing
  container: "space-y-4 sm:space-y-6",
  
  // Responsive grid
  grid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  
  // Mobile-friendly inputs
  inputSize: "text-base sm:text-sm", // Prevent zoom on iOS
}
```

### Step 8.2: Mobile Checklist

- [ ] 44px minimum touch targets
- [ ] Responsive layouts (single column on mobile)
- [ ] Text input size 16px+ to prevent iOS zoom
- [ ] Mobile-friendly date/time pickers
- [ ] Full-width buttons on mobile
- [ ] Proper keyboard types (`type="email"`, `type="tel"`, etc.)

---

## 🎯 SUCCESS CRITERIA

A form implementation is complete when:

1. ✅ **Validation**: All fields validated correctly (real-time, on-blur, on-submit)
2. ✅ **Real-time**: Real-time validation with debouncing (300ms)
3. ✅ **Error Handling**: Errors displayed clearly next to fields
4. ✅ **Accessibility**: Full keyboard and screen reader support (WCAG 2.2 AA)
5. ✅ **Integration**: Integrated with React Query mutations
6. ✅ **UX**: Loading states and success feedback
7. ✅ **Type Safety**: Full TypeScript coverage
8. ✅ **Mobile**: Mobile-first design with 44px touch targets
9. ✅ **File Uploads**: File validation and preview (if applicable)
10. ✅ **Conditional Fields**: Conditional logic works correctly (if applicable)

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- Validate on every keystroke (use debouncing)
- Show errors before user interacts with field
- Ignore API errors
- Skip accessibility features
- Forget loading states
- Skip form validation on submit
- Use `any` types
- Forget to clear errors on input change
- Skip mobile considerations
- Forget file size/type validation

### ✅ Do:

- Debounce real-time validation (300ms)
- Show errors only after field is touched
- Handle API errors gracefully
- Include ARIA attributes
- Show loading states
- Validate entire form on submit
- Use TypeScript types
- Clear errors when user starts typing
- Design mobile-first
- Validate file uploads

---

## 📚 REFERENCE

### Files in Codebase

- **Address Form**: `src/components/AddressForm.tsx` - Complete address form example
- **Reservation Form**: `src/components/ReservationForm.tsx` - Complex form with date/time
- **Review Form**: `src/components/ReviewForm.tsx` - Form with file uploads
- **Shipping Address Form**: `src/pages/Checkout/components/ShippingAddressForm.tsx` - Checkout form
- **Input Component**: `src/components/ui/Input.tsx` - Accessible input component
- **Form Hook**: `src/hooks/useForm.ts` - Reusable form hook

### Validation Utilities

- **Validation Functions**: `src/lib/validation.ts` - Reusable validation functions
- **Type Guards**: `src/lib/type-guards.ts` - Runtime type checking

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This master prompt should be followed for ALL form handling and validation work in the Star Café application.**
