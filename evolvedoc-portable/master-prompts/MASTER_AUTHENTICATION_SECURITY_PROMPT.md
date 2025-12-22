# 🔐 MASTER AUTHENTICATION & SECURITY PROMPT
## Production-Grade Authentication, Authorization, and Security Implementation

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing authentication, authorization, and security best practices in production applications for the **Star Café** application. It covers authentication flows, session management, password security, protected routes, admin authorization, token handling, and security hardening based on actual codebase implementations.

**Key Features:**
- Supabase Auth integration with PKCE flow
- Session persistence and auto-refresh
- Admin status caching and persistence
- Protected routes and admin-only routes
- Invalid token handling and cleanup
- User-friendly error messages
- Security best practices

**Applicable to:**
- Authentication flows (login, signup, logout)
- Session management and persistence
- Password security and validation
- Email verification flows
- Password reset flows
- Protected routes and authorization
- Admin access control
- Token refresh and expiration
- Security hardening

---

## 🎯 CORE PRINCIPLES

### 1. **Security First**
- **Never Trust Client**: All security checks must happen server-side
- **Principle of Least Privilege**: Users get minimum required permissions
- **Defense in Depth**: Multiple security layers (RLS + client-side validation)
- **Secure by Default**: Fail securely, don't expose sensitive information

### 2. **User Experience**
- **Seamless Authentication**: Smooth login/signup flows
- **Session Persistence**: Remember users across sessions
- **Clear Error Messages**: User-friendly error messages (without exposing security details)
- **Loading States**: Show loading indicators during auth operations
- **Fast Admin Checks**: Cache admin status for quick access

### 3. **Password Security**
- **Strong Validation**: Enforce password strength requirements
- **Secure Storage**: Passwords never stored in plain text (handled by Supabase)
- **Password Reset**: Secure password reset flow with email verification
- **Password Update**: Allow users to update passwords securely

---

## 🔍 PHASE 1: AUTHENTICATION SETUP

### Step 1.1: Supabase Client Configuration

**From `buildfast-shop/src/lib/supabase.ts`:**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Recommended for security
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase-auth-token', // Unique storage key
  },
  global: {
    headers: {
      'x-application-name': 'StarCafe',
    },
  },
})
```

**Key Points:**
- Uses PKCE flow for enhanced security
- Auto-refreshes tokens automatically
- Persists sessions in localStorage
- Detects session in URL (for OAuth callbacks)
- Type-safe with Database types

### Step 1.2: Authentication Context Setup

**From `buildfast-shop/src/contexts/AuthContext.tsx`:**

```typescript
/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Handles user sessions, admin status, and auth operations.
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { clearInvalidAuthTokens } from '../lib/authUtils'
import { clearRecentlyViewed } from '../lib/recentlyViewedUtils'
import { logger } from '../utils/logger'
import { logError, getUserFriendlyError } from '../lib/error-handler'

/**
 * Admin status cache interface
 */
interface AdminStatusCache {
  userId: string | null
  isAdmin: boolean
  fetched: boolean
}

/**
 * Auth context value interface
 */
/**
 * Sign up response type
 */
export interface SignUpResponse {
  data: { user: User; session: Session } | null
  error: Error | null
}

/**
 * Sign in response type
 */
export interface SignInResponse {
  data: { user: User; session: Session } | null
  error: Error | null
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResponse>
  signIn: (email: string, password: string) => Promise<SignInResponse>
  signOut: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
}

/**
 * Create auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * useAuth hook
 *
 * @throws {Error} If used outside AuthProvider
 * @returns AuthContextType
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * AuthProvider Component
 *
 * Provides authentication context to the application.
 * Manages user sessions, admin status, and auth operations.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  // Cache admin status per user ID to avoid refetching unnecessarily
  const adminStatusCache = useRef<AdminStatusCache>({ userId: null, isAdmin: false, fetched: false })

  /**
   * Get persisted admin status from sessionStorage
   */
  const getPersistedAdminStatus = useCallback((userId: string | null): boolean | null => {
    if (typeof window === 'undefined' || !userId) return null
    try {
      const stored = sessionStorage.getItem(`admin_status_${userId}`)
      return stored === 'true' ? true : stored === 'false' ? false : null
    } catch {
      return null
    }
  }, [])

  /**
   * Set persisted admin status in sessionStorage
   */
  const setPersistedAdminStatus = useCallback((userId: string, adminStatus: boolean): void => {
    if (typeof window === 'undefined' || !userId) return
    try {
      sessionStorage.setItem(`admin_status_${userId}`, String(adminStatus))
    } catch {
      // Ignore storage errors
    }
  }, [])

  /**
   * Clear persisted admin status from sessionStorage
   */
  const clearPersistedAdminStatus = useCallback((userId: string): void => {
    if (typeof window === 'undefined' || !userId) return
    try {
      sessionStorage.removeItem(`admin_status_${userId}`)
    } catch {
      // Ignore storage errors
    }
  }, [])

  /**
   * Fetch admin status from customers table (cached per user ID)
   */
  const fetchAdminStatus = useCallback(async (userId: string, forceRefresh = false): Promise<void> => {
    if (!userId) {
      setIsAdmin(false)
      adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
      return
    }

    // Check persisted status first (if available and same user)
    if (!forceRefresh && adminStatusCache.current.userId === userId) {
      const persistedStatus = getPersistedAdminStatus(userId)
      if (persistedStatus !== null && adminStatusCache.current.fetched) {
        setIsAdmin(persistedStatus)
        adminStatusCache.current = { userId, isAdmin: persistedStatus, fetched: true }
        return
      }
    }

    // Use cached value if available and same user (unless forcing refresh)
    if (
      !forceRefresh &&
      adminStatusCache.current.fetched &&
      adminStatusCache.current.userId === userId
    ) {
      setIsAdmin(adminStatusCache.current.isAdmin)
      setPersistedAdminStatus(userId, adminStatusCache.current.isAdmin)
      return
    }

    try {
      // Increased timeout for admin status check (critical for access control)
      // Using 10 seconds to handle slow connections and database latency
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Admin status fetch timeout after 10 seconds')), 10000)
      )

      const fetchPromise = supabase
        .from('customers')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle()

      const result = await Promise.race([fetchPromise, timeoutPromise])
      const { data, error } = result || { data: null, error: null }

      if (error) {
        logError(error, 'AuthContext.fetchAdminStatus')
        // Only trust persisted TRUE status on error (don't trust false - might be stale)
        const persistedStatus = getPersistedAdminStatus(userId)
        if (persistedStatus === true) {
          // Trust persisted true status
          setIsAdmin(true)
          adminStatusCache.current = { userId, isAdmin: true, fetched: true }
        } else {
          // On error with no persisted true status, default to false but mark as not fetched
          // This allows retry on next check
          logger.warn(
            'Admin status check failed - defaulting to false. Error may indicate missing customer record or RLS issue.'
          )
          setIsAdmin(false)
          adminStatusCache.current = { userId, isAdmin: false, fetched: false }
        }
        return
      }

      // Handle case where customer record doesn't exist (data is null)
      if (data === null) {
        logger.warn(`No customer record found for user ${userId}. User may need to be added to customers table.`)
        setIsAdmin(false)
        adminStatusCache.current = { userId, isAdmin: false, fetched: true }
        setPersistedAdminStatus(userId, false)
        return
      }

      const adminStatus = data?.is_admin ?? false

      logger.log('AuthContext: Admin status fetched', { userId, adminStatus, data })

      setIsAdmin(adminStatus)
      // Cache the result in memory and sessionStorage
      adminStatusCache.current = { userId, isAdmin: adminStatus, fetched: true }
      setPersistedAdminStatus(userId, adminStatus)
    } catch (error) {
      // Handle timeout or other errors
      // Only log error if it's not a timeout (timeouts are expected in some cases)
      if (!(error instanceof Error && error.message?.includes('timeout'))) {
        logError(error, 'AuthContext.fetchAdminStatus.exception')
      } else if (import.meta.env.DEV) {
        logger.warn('Admin status check timeout (this is normal if database is slow)')
      }
      // On timeout, trust persisted status if available
      const persistedStatus = getPersistedAdminStatus(userId)
      if (persistedStatus === true) {
        setIsAdmin(true)
        adminStatusCache.current = { userId, isAdmin: true, fetched: true }
      } else {
        setIsAdmin(false)
        adminStatusCache.current = { userId, isAdmin: false, fetched: false }
      }
    }
  }, [getPersistedAdminStatus, setPersistedAdminStatus])

  // Initialize auth state
  useEffect(() => {
    // Check active sessions and sets the user
    const initAuth = async (): Promise<void> => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Handle invalid refresh token errors
        if (
          error &&
          (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token'))
        ) {
          logger.warn('Invalid refresh token detected, clearing all auth data:', error.message)
          // Clear invalid tokens completely
          await clearInvalidAuthTokens()
          setUser(null)
          setSession(null)
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const userId = session?.user?.id ?? null
        setUser(session?.user ?? null)
        setSession(session)
        if (userId) {
          // Check persisted status first for faster initial load
          const persistedStatus = getPersistedAdminStatus(userId)
          if (persistedStatus === true) {
            setIsAdmin(true)
            adminStatusCache.current = { userId, isAdmin: true, fetched: true }
          }
          // Still fetch to ensure it's up to date, but don't wait for it to set status
          fetchAdminStatus(userId).catch(() => {
            // If fetch fails but we have persisted true status, keep it
            if (persistedStatus === true) {
              setIsAdmin(true)
            }
          })
        } else {
          setIsAdmin(false)
          adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
        }
      } catch (error) {
        logError(error, 'AuthContext.initAuth')
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('Auth state changed:', event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const userId = session.user.id
        // Clear old user's admin status
        if (adminStatusCache.current.userId && adminStatusCache.current.userId !== userId) {
          clearPersistedAdminStatus(adminStatusCache.current.userId)
        }
        // Fetch admin status for new user
        await fetchAdminStatus(userId)
      } else {
        // User signed out - clear admin status
        if (adminStatusCache.current.userId) {
          clearPersistedAdminStatus(adminStatusCache.current.userId)
        }
        setIsAdmin(false)
        adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
        // Clear recently viewed items on logout
        clearRecentlyViewed()
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchAdminStatus, getPersistedAdminStatus, clearPersistedAdminStatus])

  // Sign up handler
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { data: null, error: new Error(getUserFriendlyError(error)) }
      }

      return { data, error: null }
    } catch (error) {
      logError(error, 'AuthContext.signUp')
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') }
    }
  }, [])

  // Sign in handler
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { data: null, error: new Error(getUserFriendlyError(error)) }
      }

      return { data, error: null }
    } catch (error) {
      logError(error, 'AuthContext.signIn')
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') }
    }
  }, [])

  // Sign out handler
  const signOut = useCallback(async () => {
    try {
      // Clear admin status before signing out
      if (adminStatusCache.current.userId) {
        clearPersistedAdminStatus(adminStatusCache.current.userId)
      }
      adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setIsAdmin(false)
      // Clear recently viewed items on logout
      clearRecentlyViewed()
    } catch (error) {
      logError(error, 'AuthContext.signOut')
    }
  }, [clearPersistedAdminStatus])

  // Refresh admin status
  const refreshAdminStatus = useCallback(async () => {
    if (user?.id) {
      await fetchAdminStatus(user.id, true) // Force refresh
    }
  }, [user, fetchAdminStatus])

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    refreshAdminStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

**Key Points:**
- Caches admin status in memory and sessionStorage
- Handles invalid refresh tokens gracefully
- Uses timeout for admin status checks (10 seconds)
- Falls back to persisted status on errors
- Clears admin status on logout
- Provides refreshAdminStatus method for manual updates

### Step 1.3: Authentication Utilities

**From `buildfast-shop/src/lib/authUtils.ts`:**

```typescript
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
      (key) => key.includes('supabase') || key.includes('auth')
    )

    authKeys.forEach((key) => {
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
```

**Key Points:**
- Clears all auth-related localStorage items
- Validates session before operations
- Detects various auth error types
- Redirects to login on auth errors
- Logs errors for debugging

### Step 1.4: Authentication Checklist
- [ ] Supabase client configured with PKCE flow
- [ ] Auth context provides all necessary methods
- [ ] Session persistence enabled
- [ ] Auto token refresh enabled
- [ ] Auth state changes handled
- [ ] Admin status caching implemented
- [ ] Invalid token handling implemented
- [ ] Error handling implemented

---

## 🛠️ PHASE 2: AUTHENTICATION FLOWS

### Step 2.1: Login Flow

**From `buildfast-shop/src/pages/Login.tsx`:**

```typescript
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { logger } from '../utils/logger'

function Login(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false)

  const { signIn, user, loading: authLoading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // ✅ CORRECT - Define proper type for location state instead of 'as any'
  interface LocationState {
    from?: { pathname: string }
  }
  const from = (location.state as LocationState)?.from?.pathname || '/'

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && shouldRedirect) {
      const destination = isAdmin ? '/admin' : from
      logger.log('Redirecting after login:', destination)
      navigate(destination, { replace: true })
    }
  }, [user, authLoading, shouldRedirect, navigate, from, isAdmin])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    const { data, error: signInError } = await signIn(email, password)

    if (signInError) {
      // Handle common error messages
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    // Success - wait for auth state to update via useEffect
    if (data?.session) {
      setShouldRedirect(true)
    } else {
      // Fallback: if session exists but user not set yet, wait a bit
      setTimeout(() => {
        setLoading(false)
        const destination = isAdmin ? '/admin' : from
        navigate(destination, { replace: true })
      }, 200)
    }
  }, [email, password, signIn, isAdmin, from, navigate])

  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        disabled={loading}
      />

      {/* Password input with visibility toggle */}
      <div>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={loading}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>

      {/* Error message */}
      {error && <div role="alert">{error}</div>}

      {/* Submit button */}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

export default Login
```

**Key Points:**
- Validates email and password before submission
- Shows user-friendly error messages
- Handles redirect after successful login
- Redirects admins to /admin, regular users to intended page
- Shows loading state during sign-in
- Password visibility toggle for UX

### Step 2.2: Signup Flow

```typescript
// src/pages/Signup.tsx
import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { validateEmail, validatePassword } from '../lib/validation'
import { logger } from '../utils/logger'

export function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}
    
    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    const { data, error } = await signUp(email, password, fullName)

    if (error) {
      let errorMessage = 'Failed to create account'
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please login instead.'
      } else if (error.message.includes('password')) {
        errorMessage = 'Password does not meet requirements.'
      }
      setErrors({ general: errorMessage })
      setIsLoading(false)
      return
    }

    logger.log('Signup successful:', data)
    navigate('/login', { 
      state: { message: 'Account created! Please check your email to verify your account.' }
    })
  }, [email, password, confirmPassword, fullName, signUp, navigate])

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with validation */}
    </form>
  )
}
```

### Step 2.3: Password Reset Flow

```typescript
// src/pages/ForgotPassword.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateEmail } from '../lib/validation'
import { logger } from '../utils/logger'
import { getUserFriendlyError } from '../lib/error-handler'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setIsLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(getUserFriendlyError(resetError))
      setIsLoading(false)
      return
    }

    setIsSent(true)
    logger.log('Password reset email sent to:', email)
  }

  if (isSent) {
    return (
      <div>
        <h2>Check your email</h2>
        <p>We've sent a password reset link to {email}</p>
        <p>Please check your inbox and follow the instructions.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        disabled={isLoading}
      />
      {error && <div role="alert">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  )
}
```

### Step 2.4: Authentication Flow Checklist
- [ ] Login flow implemented with error handling
- [ ] Signup flow implemented with validation
- [ ] Password reset flow implemented
- [ ] Email verification handled
- [ ] User-friendly error messages
- [ ] Loading states shown
- [ ] Redirects handled correctly
- [ ] Admin redirect logic implemented

---

## 🔒 PHASE 3: PROTECTED ROUTES & AUTHORIZATION

### Step 3.1: Protected Route Component

**From `buildfast-shop/src/components/ProtectedRoute.tsx`:**

```typescript
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component props
 */
interface ProtectedRouteProps {
  /** Child components to render if authenticated */
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Route protection component that ensures only authenticated users can access protected routes.
 * Redirects to login page if user is not authenticated.
 *
 * Features:
 * - Loading state handling
 * - Automatic redirect to login
 * - Preserves intended destination for post-login redirect
 * - Accessibility compliant (loading indicator)
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-elevated)] to-[var(--bg-main)]" role="status" aria-live="polite" aria-label="Loading authentication">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 min-h-[44px] min-w-[44px] border-4 border-[var(--accent)] border-t-transparent" aria-hidden="true"></div>
          <p className="mt-4 text-[var(--text-muted)]">Securing your access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

### Step 3.2: Admin Route Component

**From `buildfast-shop/src/components/AdminRoute.tsx`:**

```typescript
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

/**
 * AdminRoute component props
 */
interface AdminRouteProps {
  /** Child components to render if admin */
  children: ReactNode;
}

/**
 * AdminRoute Component
 *
 * Wraps routes that require admin privileges. Checks both authentication
 * and admin status. Non-admin users are redirected to home page with an
 * error message.
 *
 * Usage:
 * ```tsx
 * <Route path="/admin" element={
 *   <AdminRoute>
 *     <AdminDashboard />
 *   </AdminRoute>
 * } />
 * ```
 *
 * Features:
 * - Admin status verification
 * - Helpful error messages for non-admin users
 * - Admin status refresh functionality
 * - Loading states
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 */
function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin, refreshAdminStatus } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Memoized refresh handler
  const handleRefreshAdminStatus = useMemo(() => {
    return async () => {
      setIsRefreshing(true);
      try {
        await refreshAdminStatus();
        // Small delay to allow state update
        setTimeout(() => setIsRefreshing(false), 500);
      } catch (error) {
        logger.error('Error refreshing admin status:', error);
        setIsRefreshing(false);
      }
    };
  }, [refreshAdminStatus]);

  // PRIORITY 1: If user is authenticated and confirmed as admin, allow access immediately
  // This ensures admin access persists even during background updates
  if (user && isAdmin) {
    return <>{children}</>;
  }

  // PRIORITY 2: If not authenticated (and done loading), redirect to login
  if (!loading && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // PRIORITY 3: If authenticated but not admin (and done loading), deny access with helpful message
  if (!loading && user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-elevated)] to-[var(--bg-main)] p-4" role="alert" aria-live="assertive">
        <div className="bg-[var(--bg-elevated)]/50 backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-md w-full border border-[var(--border-default)]">
          <div className="flex items-center mb-6">
            <div className="bg-[var(--status-error-bg)] p-3 rounded-lg border border-[var(--status-error-border)]" aria-hidden="true">
              <svg className="w-6 h-6 text-[var(--color-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">Access Denied</h2>
              <p className="text-sm text-[var(--text-muted)]">Admin privileges required</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-[var(--text-main)]/80 mb-4">
              You need administrator privileges to access this page.
            </p>

            <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-[var(--accent)] mb-2">To gain admin access:</h3>
              <ol className="text-sm text-[var(--text-muted)] list-decimal list-inside space-y-1">
                <li>Open Supabase SQL Editor</li>
                <li>Run the SQL from <code className="bg-[var(--accent)]/10 text-[var(--accent)] px-1 rounded">036_enforce_single_admin_user.sql</code></li>
                <li>Or manually set your user as admin:
                  <code className="block p-2 mt-1 rounded text-sm bg-[var(--bg-elevated)]">
                    UPDATE customers SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
                  </code>
                </li>
                <li>Click "Refresh Admin Status" button below after making changes</li>
                <li>Check browser console (F12) for detailed error messages</li>
              </ol>
            </div>

            <div className="text-sm text-[var(--text-muted)] rounded-lg p-3 border border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <p className="mb-2 text-[var(--text-main)]/80">Current status:</p>
              <ul className="space-y-1.5 ml-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--color-green)] rounded-full" aria-hidden="true"></span>
                  <span>Logged in as <span className="font-medium text-[var(--text-main)]">{user?.email}</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--color-red)] rounded-full" aria-hidden="true"></span>
                  <span>Admin status: <span className="font-medium text-[var(--color-red)]">Denied</span></span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRefreshAdminStatus}
              disabled={isRefreshing}
              className="w-full px-4 py-3 min-h-[44px] bg-[var(--color-blue)] text-white font-medium rounded-lg hover:bg-[var(--color-blue)]/90 disabled:bg-[var(--color-blue)]/50 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-[var(--color-blue)]/20 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2"
              aria-label={isRefreshing ? 'Refreshing admin status' : 'Refresh admin status'}
              aria-busy={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Admin Status</span>
                </>
              )}
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full px-4 py-3 min-h-[44px] bg-[var(--accent)] text-black font-medium rounded-lg hover:bg-[var(--accent)]/90 transition-all duration-200 shadow-lg shadow-[var(--accent)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Return to home page"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRIORITY 4: Still loading - show loading spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-elevated)] to-[var(--bg-main)]" role="status" aria-live="polite" aria-label="Checking admin access">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 min-h-[44px] min-w-[44px] border-4 border-[var(--accent)] border-t-transparent" aria-hidden="true"></div>
        <p className="mt-4 text-[var(--text-muted)]">Checking admin access...</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">This may take a few seconds</p>
      </div>
    </div>
  );
}

export default AdminRoute;
```

**Key Points:**
- Checks both authentication and admin status
- Provides helpful error message with instructions
- Allows manual refresh of admin status
- Shows current auth status
- Accessible with ARIA labels
- 44px touch targets for mobile

### Step 3.3: Route Configuration

```typescript
// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin-only route */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
    </Routes>
  )
}
```

### Step 3.4: Authorization Checklist
- [ ] Protected routes implemented
- [ ] Admin-only routes protected
- [ ] Loading states shown
- [ ] Redirects handled correctly
- [ ] Unauthorized access prevented
- [ ] Admin status refresh functionality
- [ ] Helpful error messages for non-admin users
- [ ] Accessibility compliant

---

## 🔐 PHASE 4: PASSWORD SECURITY

### Step 4.1: Password Validation

```typescript
// src/lib/validation.ts
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }

  return null
}

export function getPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong'
  score: number
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) score += 1
  else feedback.push('Use at least 8 characters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Add uppercase letters')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Add lowercase letters')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Add numbers')

  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else feedback.push('Add special characters')

  if (password.length >= 12) score += 1

  let strength: 'weak' | 'medium' | 'strong'
  if (score <= 2) strength = 'weak'
  else if (score <= 4) strength = 'medium'
  else strength = 'strong'

  return { strength, score, feedback }
}
```

### Step 4.2: Password Update Flow

```typescript
// src/pages/protected/Settings.tsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { validatePassword } from '../../lib/validation'
import { logger } from '../../utils/logger'
import { getUserFriendlyError } from '../../lib/error-handler'

export function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(getUserFriendlyError(updateError))
      setIsLoading(false)
      return
    }

    logger.log('Password updated successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setIsLoading(false)
    // Show success message
  }

  return (
    <form onSubmit={handleUpdatePassword}>
      {/* Form fields */}
    </form>
  )
}
```

### Step 4.3: Password Security Checklist
- [ ] Password validation implemented
- [ ] Password strength indicator (optional)
- [ ] Password update flow implemented
- [ ] Password reset flow implemented
- [ ] Passwords never logged or exposed
- [ ] Password requirements enforced
- [ ] Password confirmation required

---

## 🛡️ PHASE 5: SECURITY BEST PRACTICES

### Step 5.1: Security Headers

```typescript
// src/index.html (or server configuration)
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
```

### Step 5.2: Input Sanitization

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'dompurify'

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
```

### Step 5.3: Session Security

```typescript
// Ensure secure session handling
// - Use HTTPS in production
// - Set secure cookies (handled by Supabase)
// - Implement session timeout (optional)
// - Clear sensitive data on logout
// - Handle invalid tokens gracefully
```

### Step 5.4: Security Checklist
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Input sanitization implemented
- [ ] XSS prevention (DOMPurify)
- [ ] CSRF protection (handled by Supabase)
- [ ] Sensitive data not exposed in errors
- [ ] Session security configured
- [ ] Invalid token handling implemented
- [ ] Rate limiting considered (Supabase handles)
- [ ] Admin status verified server-side

---

## ✅ AUTHENTICATION CHECKLIST

### Setup
- [ ] Supabase client configured with PKCE flow
- [ ] Auth context provides all necessary methods
- [ ] Session persistence enabled
- [ ] Auto token refresh enabled
- [ ] Auth state changes handled
- [ ] Admin status caching implemented
- [ ] Invalid token handling implemented
- [ ] Error handling implemented

### Authentication Flows
- [ ] Login flow implemented with error handling
- [ ] Signup flow implemented with validation
- [ ] Password reset flow implemented
- [ ] Email verification handled
- [ ] User-friendly error messages
- [ ] Loading states shown
- [ ] Redirects handled correctly
- [ ] Admin redirect logic implemented

### Authorization
- [ ] Protected routes implemented
- [ ] Admin-only routes protected
- [ ] Loading states shown
- [ ] Redirects handled correctly
- [ ] Unauthorized access prevented
- [ ] Admin status refresh functionality
- [ ] Helpful error messages for non-admin users
- [ ] Accessibility compliant

### Security
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Input sanitization implemented
- [ ] XSS prevention (DOMPurify)
- [ ] CSRF protection (handled by Supabase)
- [ ] Sensitive data not exposed in errors
- [ ] Session security configured
- [ ] Invalid token handling implemented
- [ ] Rate limiting considered (Supabase handles)
- [ ] Admin status verified server-side

---

## 🎯 SUCCESS CRITERIA

Authentication implementation is complete when:

1. ✅ **Login Flow**: Users can login securely with proper error handling
2. ✅ **Signup Flow**: Users can create accounts with validation
3. ✅ **Session Management**: Sessions persist across page reloads
4. ✅ **Token Handling**: Invalid tokens are cleared automatically
5. ✅ **Protected Routes**: Unauthorized access prevented
6. ✅ **Admin Authorization**: Admin routes protected with status checks
7. ✅ **Password Security**: Strong passwords enforced
8. ✅ **Password Reset**: Secure password reset flow
9. ✅ **Error Handling**: User-friendly error messages
10. ✅ **Security**: All security best practices implemented

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

1. **Store passwords in plain text**
   ```typescript
   // ❌ WRONG: Never store passwords
   localStorage.setItem('password', password)
   ```

2. **Expose sensitive information in error messages**
   ```typescript
   // ❌ WRONG: Don't expose internal errors
   setError(`Database error: ${error.code} - ${error.message}`)
   ```

3. **Trust client-side validation alone**
   ```typescript
   // ❌ WRONG: Always validate server-side too
   if (isAdmin) { // Client-side check only
     // Allow admin access
   }
   ```

4. **Skip password strength validation**
   ```typescript
   // ❌ WRONG: Always validate password strength
   if (password.length > 0) {
     // Accept any password
   }
   ```

5. **Forget to handle session expiration**
   ```typescript
   // ❌ WRONG: Always handle expired sessions
   const session = await getSession()
   // Use session without checking expiration
   ```

6. **Expose user IDs or tokens in URLs**
   ```typescript
   // ❌ WRONG: Don't put sensitive data in URLs
   navigate(`/profile/${user.id}/${session.access_token}`)
   ```

7. **Skip email verification**
   ```typescript
   // ❌ WRONG: Always verify emails
   await signUp(email, password)
   // Allow access immediately without verification
   ```

8. **Ignore invalid token errors**
   ```typescript
   // ❌ WRONG: Always handle invalid tokens
   try {
     await fetchData()
   } catch (error) {
     // Ignore auth errors
   }
   ```

### ✅ Do:

1. **Use Supabase Auth (handles password hashing)**
   ```typescript
   // ✅ CORRECT: Supabase handles password hashing
   await supabase.auth.signUp({ email, password })
   ```

2. **Transform errors to user-friendly messages**
   ```typescript
   // ✅ CORRECT: Transform errors
   const errorMessage = getUserFriendlyError(error)
   setError(errorMessage)
   ```

3. **Validate on both client and server**
   ```typescript
   // ✅ CORRECT: Validate client-side, verify server-side
   if (validatePassword(password)) {
     // Client validation
   }
   // Server-side: RLS policies enforce access
   ```

4. **Enforce strong password requirements**
   ```typescript
   // ✅ CORRECT: Enforce strong passwords
   const passwordError = validatePassword(password)
   if (passwordError) {
     setError(passwordError)
     return
   }
   ```

5. **Handle session refresh automatically**
   ```typescript
   // ✅ CORRECT: Auto-refresh enabled in Supabase config
   auth: {
     autoRefreshToken: true,
     persistSession: true,
   }
   ```

6. **Use secure session storage**
   ```typescript
   // ✅ CORRECT: Supabase handles secure storage
   // No manual token storage needed
   ```

7. **Verify emails before full access**
   ```typescript
   // ✅ CORRECT: Check email confirmation
   if (user.email_confirmed_at) {
     // Allow full access
   }
   ```

8. **Handle invalid tokens gracefully**
   ```typescript
   // ✅ CORRECT: Clear invalid tokens
   if (error.message.includes('refresh_token')) {
     await clearInvalidAuthTokens()
     navigate('/login')
   }
   ```

9. **Cache admin status for performance**
   ```typescript
   // ✅ CORRECT: Cache admin status
   const persistedStatus = getPersistedAdminStatus(userId)
   if (persistedStatus !== null) {
     setIsAdmin(persistedStatus)
   }
   ```

10. **Provide refresh functionality for admin status**
    ```typescript
    // ✅ CORRECT: Allow manual refresh
    <button onClick={refreshAdminStatus}>
      Refresh Admin Status
    </button>
    ```

---

## 📚 REFERENCE

### Authentication Files
- **Auth Context:** `src/contexts/AuthContext.tsx`
- **Auth Utils:** `src/lib/authUtils.ts`
- **Supabase Client:** `src/lib/supabase.ts`
- **Protected Route:** `src/components/ProtectedRoute.tsx`
- **Admin Route:** `src/components/AdminRoute.tsx`
- **Login Page:** `src/pages/Login.tsx`
- **Signup Page:** `src/pages/Signup.tsx`

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Database Tables
- `auth.users` - Supabase Auth users (managed by Supabase)
- `customers` - Customer profiles with `is_admin` flag

---

## 🔗 RELATED MASTER PROMPTS

- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** - RLS policies for auth-protected data
- **⚠️ [MASTER_ERROR_HANDLING_LOGGING_PROMPT.md](./MASTER_ERROR_HANDLING_LOGGING_PROMPT.md)** - Error handling patterns
- **📝 [MASTER_FORM_HANDLING_VALIDATION_PROMPT.md](./MASTER_FORM_HANDLING_VALIDATION_PROMPT.md)** - Form validation patterns
- **🎣 [MASTER_CUSTOM_HOOKS_PROMPT.md](./MASTER_CUSTOM_HOOKS_PROMPT.md)** - Custom hooks for auth

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all authentication and security operations follow production-ready patterns with proper error handling, session management, and authorization.**
