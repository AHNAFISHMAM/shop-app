/**
 * Checkout Validation Utilities
 */

import type { ShippingAddress } from '../types'

interface ValidationResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

/**
 * Validate shipping address
 */
export function validateShippingAddress(
  address: ShippingAddress,
  requirePhone: boolean
): ValidationResult {
  const missing: string[] = []
  const errors: string[] = []

  // Full Name
  if (!address.fullName?.trim()) {
    missing.push('Full Name')
  } else if (address.fullName.trim().length < 2) {
    errors.push('Full Name must be at least 2 characters')
  }

  // Street Address
  if (!address.streetAddress?.trim()) {
    missing.push('Street Address')
  } else if (address.streetAddress.trim().length < 5) {
    errors.push('Street Address must be at least 5 characters')
  }

  // City
  if (!address.city?.trim()) {
    missing.push('City')
  } else if (address.city.trim().length < 2) {
    errors.push('City must be at least 2 characters')
  }

  // State/Province
  if (!address.stateProvince?.trim()) {
    missing.push('State/Province')
  } else if (address.stateProvince.trim().length < 2) {
    errors.push('State/Province must be at least 2 characters')
  }

  // Postal Code
  if (!address.postalCode?.trim()) {
    missing.push('Postal Code')
  } else if (address.postalCode.trim().length < 3) {
    errors.push('Postal Code must be at least 3 characters')
  }

  // Country
  if (!address.country?.trim()) {
    missing.push('Country')
  }

  // Phone validation
  if (requirePhone && !address.phoneNumber?.trim()) {
    missing.push('Phone Number')
  } else if (address.phoneNumber?.trim()) {
    const phoneRegex = /^[\d\s\-+()]{8,20}$/
    if (!phoneRegex.test(address.phoneNumber.trim())) {
      errors.push('Phone Number must be 8-20 digits (spaces, dashes, parentheses allowed)')
    }
  }

  const valid = missing.length === 0 && errors.length === 0

  return { valid, missing, errors }
}

/**
 * Check if address is valid (quick check)
 */
export function isAddressValid(
  address: ShippingAddress,
  requirePhone: boolean
): boolean {
  const baseValidation = (
    address.fullName?.trim() &&
    address.fullName.trim().length >= 2 &&
    address.streetAddress?.trim() &&
    address.streetAddress.trim().length >= 5 &&
    address.city?.trim() &&
    address.city.trim().length >= 2 &&
    address.stateProvince?.trim() &&
    address.stateProvince.trim().length >= 2 &&
    address.postalCode?.trim() &&
    address.postalCode.trim().length >= 3 &&
    address.country?.trim()
  )

  if (!baseValidation) return false

  // Phone is required for manual addresses, optional for saved addresses
  if (requirePhone) {
    const phone = address.phoneNumber?.trim()
    if (!phone) return false
    const phoneRegex = /^[\d\s\-+()]{8,20}$/
    if (!phoneRegex.test(phone)) return false
  } else if (address.phoneNumber?.trim()) {
    // If phone is provided (even if optional), validate format
    const phoneRegex = /^[\d\s\-+()]{8,20}$/
    if (!phoneRegex.test(address.phoneNumber.trim())) return false
  }

  return true
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email?.trim()) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

