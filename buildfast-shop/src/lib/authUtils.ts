import { supabase } from './supabase'
import { logger } from '../utils/logger'
import type { NavigateFunction } from 'react-router-dom'

/**
 * Auth error result
 */
export interface AuthErrorResult {
  success: boolean
  error?: Error
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  isValid: boolean
  error?: Error
}

/**
 * Clear invalid authentication tokens from localStorage
 *
 * This function forcefully clears Supabase auth data when refresh tokens
 * become invalid. This prevents continuous 400/409 errors from expired tokens.
 */
export async function clearInvalidAuthTokens(): Promise<AuthErrorResult> {
  try {
    // Sign out through Supabase (this clears the session)
    await supabase.auth.signOut()

    // Additionally clear all auth-related localStorage items
    const authKeys = Object.keys(localStorage).filter(
      key => key.includes('supabase') || key.includes('auth')
    )

    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (err) {
        logger.warn(`Failed to remove ${key}:`, err)
      }
    })

    logger.log('Cleared invalid auth tokens successfully')
    return { success: true }
  } catch (error) {
    logger.error('Error clearing auth tokens:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}

/**
 * Check if current session is valid
 * Returns true if session is valid, false otherwise
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      logger.warn('Session validation error:', error.message)
      return false
    }

    return !!session
  } catch (error) {
    logger.error('Error checking session validity:', error)
    return false
  }
}

/**
 * Handle auth errors by clearing invalid tokens and redirecting
 * Use this in error handlers when receiving 401, 409, or JWT errors
 */
export async function handleAuthError(
  error: Error | { code?: string; message?: string } | null | undefined,
  navigate?: NavigateFunction
): Promise<boolean> {
  if (!error) return false

  const errorMessage = error instanceof Error ? error.message : error.message || ''
  const errorCode = 'code' in error ? error.code : undefined

  const isAuthError =
    errorCode === '401' ||
    errorCode === '409' ||
    errorCode === 'PGRST301' ||
    errorMessage.includes('JWT') ||
    errorMessage.includes('refresh') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('Invalid Refresh Token')

  if (isAuthError) {
    logger.warn('Auth error detected, clearing tokens:', errorMessage)
    await clearInvalidAuthTokens()

    if (navigate) {
      navigate('/login', {
        state: { message: 'Your session has expired. Please log in again.' },
      })
    }

    return true
  }

  return false
}
