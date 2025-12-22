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
export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: Error | null }>
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
      }

      // Only trust persisted TRUE status on exception (don't trust false - might be stale)
      const persistedStatus = getPersistedAdminStatus(userId)
      if (persistedStatus === true) {
        setIsAdmin(true)
        adminStatusCache.current = { userId, isAdmin: true, fetched: true }
      } else {
        // Default to false but allow retry
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
        // If it's a refresh token error, clear all auth data
        if (error instanceof Error && (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token'))) {
          await clearInvalidAuthTokens()
        }
        setUser(null)
        setSession(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for changes on auth state (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        logger.warn('Token refresh failed, clearing all auth data')
        await clearInvalidAuthTokens()
        setUser(null)
        setSession(null)
        setIsAdmin(false)
        return
      }

      // Skip admin status refetch on token refresh if user hasn't changed
      if (event === 'TOKEN_REFRESHED' && session?.user?.id === adminStatusCache.current.userId) {
        // CRITICAL FIX: Don't update any state during token refresh
        // This prevents re-renders that interfere with HMR
        // User state is already set correctly from initial login
        return // Early exit without ANY state updates
      }

      // Set loading to true during auth state changes to show loading state
      setLoading(true)

      try {
        const newUserId = session?.user?.id ?? null
        const previousUserId = adminStatusCache.current.userId

        setUser(session?.user ?? null)
        setSession(session)

        if (event === 'SIGNED_OUT') {
          // Clear cache and persisted status on logout
          if (previousUserId) {
            clearPersistedAdminStatus(previousUserId)
          }
          setIsAdmin(false)
          adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
        } else if (newUserId) {
          // User logged in or session updated
          if (newUserId !== previousUserId) {
            // User changed - clear old persisted status
            if (previousUserId) {
              clearPersistedAdminStatus(previousUserId)
            }
            // Fetch admin status for new user
            await fetchAdminStatus(newUserId)
          } else if (!adminStatusCache.current.fetched) {
            // Same user but not cached - fetch or restore from persisted
            const persistedStatus = getPersistedAdminStatus(newUserId)
            if (persistedStatus === true) {
              setIsAdmin(true)
              adminStatusCache.current = { userId: newUserId, isAdmin: true, fetched: true }
            } else {
              await fetchAdminStatus(newUserId)
            }
          } else {
            // Use cached value if user hasn't changed and already fetched
            setIsAdmin(adminStatusCache.current.isAdmin)
          }
        } else {
          setIsAdmin(false)
          adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
        }
      } catch (error) {
        logError(error, 'AuthContext.onAuthStateChange')
        // Handle refresh token errors
        if (error instanceof Error && (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token'))) {
          await supabase.auth.signOut()
        }
        setIsAdmin(false)
        adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
      } finally {
        // Always set loading to false to prevent infinite loading
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchAdminStatus, getPersistedAdminStatus, clearPersistedAdminStatus])

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ data: any; error: Error | null }> => {
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
          logError(error, 'AuthContext.signUp')
          return { data: null, error: new Error(getUserFriendlyError(error)) }
        }

        // If signup is successful, the user will be automatically logged in
        return { data, error: null }
      } catch (error) {
        logError(error, 'AuthContext.signUp.exception')
        return { data: null, error: error instanceof Error ? error : new Error('Sign up failed') }
      }
    },
    []
  )

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ data: any; error: Error | null }> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          logError(error, 'AuthContext.signIn')
          return { data: null, error: new Error(getUserFriendlyError(error)) }
        }

        // Fetch admin status before returning to ensure it's available for redirect logic
        if (data?.user?.id) {
          await fetchAdminStatus(data.user.id, true) // Force refresh to get latest status
        }

        return { data, error: null }
      } catch (error) {
        logError(error, 'AuthContext.signIn.exception')
        return { data: null, error: error instanceof Error ? error : new Error('Sign in failed') }
      }
    },
    [fetchAdminStatus]
  )

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const currentUserId = adminStatusCache.current.userId
      // Clear persisted admin status
      if (currentUserId) {
        clearPersistedAdminStatus(currentUserId)
      }
      // Clear admin status cache immediately
      setIsAdmin(false)
      adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
      // Clear recently viewed products
      clearRecentlyViewed()
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        logError(error, 'AuthContext.signOut')
        throw error
      }
      // State will be updated by onAuthStateChange listener as well
    } catch (error) {
      logError(error, 'AuthContext.signOut.exception')
    }
  }, [clearPersistedAdminStatus])

  /**
   * Refresh admin status (useful for retrying after fixing database issues)
   */
  const refreshAdminStatus = useCallback(async (): Promise<void> => {
    if (user?.id) {
      // Clear cache to force fresh fetch
      adminStatusCache.current = { userId: null, isAdmin: false, fetched: false }
      clearPersistedAdminStatus(user.id)
      await fetchAdminStatus(user.id, true)
    }
  }, [user?.id, clearPersistedAdminStatus, fetchAdminStatus])

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

