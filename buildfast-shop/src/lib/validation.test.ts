/**
 * Validation Utilities Tests
 * 
 * Unit tests for validation functions.
 */

import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateEmailField,
  validatePassword,
  validateName,
  validatePhone,
  validatePostalCode,
  validateAmount,
  validateRequired,
  validateLength,
} from './validation'

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co.uk')).toBe(true)
  })

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('validateEmailField', () => {
  it('should return null for valid email', () => {
    expect(validateEmailField('test@example.com')).toBeNull()
    expect(validateEmailField('user.name@domain.co.uk')).toBeNull()
  })

  it('should return error for invalid email', () => {
    expect(validateEmailField('invalid')).toBe('Please enter a valid email address')
    expect(validateEmailField('invalid@')).toBe('Please enter a valid email address')
    expect(validateEmailField('@example.com')).toBe('Please enter a valid email address')
    expect(validateEmailField('')).toBe('Email address is required')
  })
})

describe('validatePassword', () => {
  it('should return valid result for valid password (8+ chars)', () => {
    const result1 = validatePassword('password123')
    expect(result1.valid).toBe(true)
    expect(result1.errors).toEqual([])
    
    const result2 = validatePassword('SecurePass!')
    expect(result2.valid).toBe(true)
    expect(result2.errors).toEqual([])
  })

  it('should return error for short password', () => {
    const result1 = validatePassword('short')
    expect(result1.valid).toBe(false)
    expect(result1.errors).toContain('Password must be at least 8 characters')
    
    const result2 = validatePassword('')
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContain('Password is required')
  })
})

describe('validateName', () => {
  it('should return null for valid name', () => {
    expect(validateName('John Doe')).toBeNull()
    expect(validateName('Ahnaf Ishmam')).toBeNull()
  })

  it('should return error for invalid name', () => {
    expect(validateName('', 'Name')).toBe('Name is required')
    expect(validateName('A', 'Name')).toBe('Name must be at least 2 characters')
  })
})

describe('validatePhone', () => {
  it('should return null for valid phone', () => {
    expect(validatePhone('+1234567890')).toBeNull()
    expect(validatePhone('123-456-7890')).toBeNull()
  })

  it('should return error for invalid phone', () => {
    expect(validatePhone('123')).toBe('Please enter a valid phone number')
    expect(validatePhone('', true)).toBe('Phone number is required')
  })
})

describe('validatePostalCode', () => {
  it('should return null for valid postal code', () => {
    expect(validatePostalCode('12345')).toBeNull()
    expect(validatePostalCode('12345-6789')).toBeNull()
  })

  it('should return error for invalid postal code', () => {
    expect(validatePostalCode('123')).toBe('Please enter a valid postal code')
    expect(validatePostalCode('')).toBe('Postal code is required')
  })
})

describe('validateAmount', () => {
  it('should return valid result for valid amount', () => {
    const result1 = validateAmount(100)
    expect(result1.isValid).toBe(true)
    expect(result1.error).toBeUndefined()
    
    const result2 = validateAmount(0.01)
    expect(result2.isValid).toBe(true)
    expect(result2.error).toBeUndefined()
  })

  it('should return error for invalid amount', () => {
    const result1 = validateAmount(-1)
    expect(result1.isValid).toBe(false)
    expect(result1.error).toBe('Amount must be at least $0')
    
    const result2 = validateAmount(0)
    expect(result2.isValid).toBe(true) // 0 is valid (min defaults to 0)
  })
})

describe('validateRequired', () => {
  it('should return null for non-empty value', () => {
    expect(validateRequired('value', 'field')).toBeNull()
    expect(validateRequired(0, 'field')).toBeNull()
    expect(validateRequired(false, 'field')).toBeNull()
  })

  it('should return error for empty value', () => {
    expect(validateRequired('', 'This field')).toBe('This field is required')
    expect(validateRequired(null, 'This field')).toBe('This field is required')
    expect(validateRequired(undefined, 'This field')).toBe('This field is required')
  })
})

describe('validateLength', () => {
  it('should return null for valid length', () => {
    expect(validateLength('test', { min: 2, max: 10 })).toBeNull()
    expect(validateLength('test', { min: 4, max: 4 })).toBeNull()
  })

  it('should return error for invalid length', () => {
    expect(validateLength('a', { min: 2, max: 10, fieldName: 'Field' })).toBe('Field must be at least 2 characters')
    expect(validateLength('toolongstring', { min: 2, max: 10, fieldName: 'Field' })).toBe('Field must be 10 characters or less')
  })
})

