import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Clear invalid authentication tokens from localStorage
 *
 * This function forcefully clears Supabase auth data when refresh tokens
 * become invalid. This prevents continuous 400/409 errors from expired tokens.
 */
export async function clearInvalidAuthTokens() {
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
    return { success: false, error }
  }
}

/**
 * Check if current session is valid
 * Returns true if session is valid, false otherwise
 */
export async function isSessionValid() {
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
export async function handleAuthError(error, navigate) {
  const isAuthError =
    error?.code === '401' ||
    error?.code === '409' ||
    error?.code === 'PGRST301' ||
    error?.message?.includes('JWT') ||
    error?.message?.includes('refresh') ||
    error?.message?.includes('expired') ||
    error?.message?.includes('Invalid Refresh Token')

  if (isAuthError) {
    logger.warn('Auth error detected, clearing tokens:', error.message)
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
