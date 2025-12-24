/**
 * Validation Utilities
 *
 * Provides reusable validation functions for form fields.
 * All functions are pure (no side effects) and return consistent error formats.
 */

/**
 * Validates email format
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates email and returns error message
 *
 * @param email - Email address to validate
 * @param required - Whether email is required
 * @returns Error message or null if valid
 */
export function validateEmailField(email: string, required = true): string | null {
  if (!email || email.trim().length === 0) {
    return required ? 'Email address is required' : null
  }

  if (!validateEmail(email)) {
    return 'Please enter a valid email address'
  }

  return null
}

/**
 * Password strength validation result
 */
export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validates password strength
 *
 * @param password - Password to validate
 * @param options - Validation options
 * @returns Validation result with errors array
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumber?: boolean
    requireSpecialChar?: boolean
  } = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false,
  } = options

  const errors: string[] = []

  if (!password || password.length === 0) {
    errors.push('Password is required')
    return { valid: false, errors }
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates name (first name, last name, etc.)
 *
 * @param name - Name to validate
 * @param fieldName - Field name for error messages
 * @returns Error message or null if valid
 */
export function validateName(name: string, fieldName = 'name'): string | null {
  if (!name || name.trim().length === 0) {
    return fieldName === 'first_name'
      ? 'First name is required'
      : fieldName === 'last_name'
        ? 'Last name is required'
        : `${fieldName} is required`
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return fieldName === 'first_name'
      ? 'First name must be at least 2 characters'
      : fieldName === 'last_name'
        ? 'Last name must be at least 2 characters'
        : 'Name must be at least 2 characters'
  }

  if (trimmed.length > 50) {
    return fieldName === 'first_name'
      ? 'First name must be 50 characters or less'
      : fieldName === 'last_name'
        ? 'Last name must be 50 characters or less'
        : 'Name must be 50 characters or less'
  }

  const nameRegex = /^[A-Za-z]+(?:[\s'-][A-Za-z]+)*$/

  if (!nameRegex.test(trimmed)) {
    return 'Letters, spaces, hyphens, and apostrophes only. No numbers or special characters.'
  }

  return null
}

/**
 * Validates phone number
 *
 * @param phone - Phone number to validate
 * @param required - Whether phone is required
 * @returns Error message or null if valid
 */
export function validatePhone(phone: string, required = false): string | null {
  if (!phone || phone.trim().length === 0) {
    return required ? 'Phone number is required' : null
  }

  const phoneRegex = /^[\d\s\-+()]{8,20}$/

  if (!phoneRegex.test(phone.trim())) {
    return 'Please enter a valid phone number'
  }

  return null
}

/**
 * Validates postal/zip code
 *
 * @param postalCode - Postal code to validate
 * @param required - Whether postal code is required
 * @returns Error message or null if valid
 */
export function validatePostalCode(postalCode: string, required = true): string | null {
  if (!postalCode || postalCode.trim().length === 0) {
    return required ? 'Postal code is required' : null
  }

  const postalCodeRegex = /^[A-Z0-9\s-]{3,10}$/i

  if (!postalCodeRegex.test(postalCode.trim())) {
    return 'Please enter a valid postal code'
  }

  return null
}

/**
 * Validates monetary amount
 *
 * @param value - Amount to validate
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

/**
 * Validates required field
 *
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns Error message or null if valid
 */
export function validateRequired(
  value: string | number | null | undefined,
  fieldName: string
): string | null {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  ) {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validates string length
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message or null if valid
 */
export function validateLength(
  value: string,
  options: {
    min?: number
    max?: number
    fieldName?: string
    required?: boolean
  }
): string | null {
  const { min, max, fieldName = 'Field', required = false } = options

  if (required && (!value || value.trim().length === 0)) {
    return `${fieldName} is required`
  }

  if (value && min !== undefined && value.trim().length < min) {
    return `${fieldName} must be at least ${min} characters`
  }

  if (value && max !== undefined && value.trim().length > max) {
    return `${fieldName} must be ${max} characters or less`
  }

  return null
}

/**
 * Validates date
 *
 * @param date - Date string to validate
 * @param options - Validation options
 * @returns Error message or null if valid
 */
export function validateDate(
  date: string,
  options: {
    required?: boolean
    minDate?: string
    maxDate?: string
    fieldName?: string
  } = {}
): string | null {
  const { required = true, minDate, maxDate, fieldName = 'Date' } = options

  if (!date || date.trim().length === 0) {
    return required ? `${fieldName} is required` : null
  }

  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return `Please enter a valid ${fieldName.toLowerCase()}`
  }

  if (minDate) {
    const minDateObj = new Date(minDate)
    if (dateObj < minDateObj) {
      return `${fieldName} must be on or after ${minDate}`
    }
  }

  if (maxDate) {
    const maxDateObj = new Date(maxDate)
    if (dateObj > maxDateObj) {
      return `${fieldName} must be on or before ${maxDate}`
    }
  }

  return null
}

/**
 * Validates number range
 *
 * @param value - Number to validate
 * @param options - Validation options
 * @returns Error message or null if valid
 */
export function validateNumber(
  value: number | string,
  options: {
    min?: number
    max?: number
    required?: boolean
    fieldName?: string
  } = {}
): string | null {
  const { min, max, required = false, fieldName = 'Number' } = options

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (required && (numValue === undefined || numValue === null || isNaN(numValue))) {
    return `${fieldName} is required`
  }

  if (!isNaN(numValue)) {
    if (min !== undefined && numValue < min) {
      return `${fieldName} must be at least ${min}`
    }

    if (max !== undefined && numValue > max) {
      return `${fieldName} must be ${max} or less`
    }
  }

  return null
}
