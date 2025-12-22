/**
 * Validation Utilities Tests
 * 
 * Unit tests for validation functions.
 */

import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validatePostalCode,
  validateAmount,
  validateRequired,
  validateLength,
} from './validation'

describe('validateEmail', () => {
  it('should return null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
    expect(validateEmail('user.name@domain.co.uk')).toBeNull()
  })

  it('should return error for invalid email', () => {
    expect(validateEmail('invalid')).toBe('Please enter a valid email address')
    expect(validateEmail('invalid@')).toBe('Please enter a valid email address')
    expect(validateEmail('@example.com')).toBe('Please enter a valid email address')
    expect(validateEmail('')).toBe('Please enter a valid email address')
  })
})

describe('validatePassword', () => {
  it('should return null for valid password (8+ chars)', () => {
    expect(validatePassword('password123')).toBeNull()
    expect(validatePassword('SecurePass!')).toBeNull()
  })

  it('should return error for short password', () => {
    expect(validatePassword('short')).toBe('Password must be at least 8 characters')
    expect(validatePassword('')).toBe('Password must be at least 8 characters')
  })
})

describe('validateName', () => {
  it('should return null for valid name', () => {
    expect(validateName('John Doe')).toBeNull()
    expect(validateName('Ahnaf Ishmam')).toBeNull()
  })

  it('should return error for invalid name', () => {
    expect(validateName('')).toBe('Name is required')
    expect(validateName('A')).toBe('Name must be at least 2 characters')
  })
})

describe('validatePhone', () => {
  it('should return null for valid phone', () => {
    expect(validatePhone('+1234567890')).toBeNull()
    expect(validatePhone('123-456-7890')).toBeNull()
  })

  it('should return error for invalid phone', () => {
    expect(validatePhone('123')).toBe('Please enter a valid phone number')
    expect(validatePhone('')).toBe('Please enter a valid phone number')
  })
})

describe('validatePostalCode', () => {
  it('should return null for valid postal code', () => {
    expect(validatePostalCode('12345')).toBeNull()
    expect(validatePostalCode('12345-6789')).toBeNull()
  })

  it('should return error for invalid postal code', () => {
    expect(validatePostalCode('123')).toBe('Please enter a valid postal code')
    expect(validatePostalCode('')).toBe('Please enter a valid postal code')
  })
})

describe('validateAmount', () => {
  it('should return null for valid amount', () => {
    expect(validateAmount(100)).toBeNull()
    expect(validateAmount(0.01)).toBeNull()
  })

  it('should return error for invalid amount', () => {
    expect(validateAmount(-1)).toBe('Amount must be greater than 0')
    expect(validateAmount(0)).toBe('Amount must be greater than 0')
  })
})

describe('validateRequired', () => {
  it('should return null for non-empty value', () => {
    expect(validateRequired('value')).toBeNull()
    expect(validateRequired(0)).toBeNull()
    expect(validateRequired(false)).toBeNull()
  })

  it('should return error for empty value', () => {
    expect(validateRequired('')).toBe('This field is required')
    expect(validateRequired(null)).toBe('This field is required')
    expect(validateRequired(undefined)).toBe('This field is required')
  })
})

describe('validateLength', () => {
  it('should return null for valid length', () => {
    expect(validateLength('test', 2, 10)).toBeNull()
    expect(validateLength('test', 4, 4)).toBeNull()
  })

  it('should return error for invalid length', () => {
    expect(validateLength('a', 2, 10)).toBe('Must be between 2 and 10 characters')
    expect(validateLength('toolongstring', 2, 10)).toBe('Must be between 2 and 10 characters')
  })
})

