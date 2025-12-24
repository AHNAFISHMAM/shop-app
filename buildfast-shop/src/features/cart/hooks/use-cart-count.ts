/**
 * useCartCount Hook
 *
 * Custom hook for fetching cart count (both authenticated and guest users).
 *
 * @returns {Object} Cart count and loading state
 *
 * @example
 * const { cartCount, loading } = useCartCount();
 */

import { useState, useEffect } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import { logError } from '../../../lib/error-handler'
import { defaultQueryConfig } from '../../../shared/lib/query-config'
import type { User } from '@supabase/supabase-js'

interface UseCartCountOptions {
  user: User | null
  enabled?: boolean
}

interface UseCartCountReturn {
  cartCount: number
  loading: boolean
}

/**
 * Fetch cart count for authenticated user
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Cart count
 */
async function fetchUserCartCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId)

    if (error) {
      // Table might not exist - return 0 instead of throwing
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.warn('cart_items table does not exist - returning 0')
        return 0
      }
      logError(error, 'fetchUserCartCount')
      throw error
    }

    return (data || []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)
  } catch (error: unknown) {
    // If table doesn't exist, return 0 (user can still use guest cart)
    if (
      (error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === '42P01') ||
      (error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string' &&
        (error as { message: string }).message.includes('does not exist'))
    ) {
      logger.warn('cart_items table does not exist - returning 0')
      return 0
    }
    logError(error, 'fetchUserCartCount')
    throw error
  }
}

/**
 * Get guest cart count from localStorage
 *
 * @returns {number} Cart count
 */
function getGuestCartCount(): number {
  if (typeof window === 'undefined') return 0

  try {
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]')
    return (guestCart as Array<{ quantity?: number }>).reduce(
      (sum: number, item: { quantity?: number }) => sum + (item.quantity || 0),
      0
    )
  } catch (error) {
    logger.error('Error reading guest cart:', error)
    return 0
  }
}

/**
 * useCartCount Hook
 *
 * Fetches and manages cart count with React Query for authenticated users,
 * or reads from localStorage for guest users.
 *
 * @param {UseCartCountOptions} options - Hook options
 * @param {User|null} options.user - Current user
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {UseCartCountReturn} Cart count and loading state
 */
export function useCartCount(options: UseCartCountOptions): UseCartCountReturn {
  const { user, enabled = true } = options
  const [guestCount, setGuestCount] = useState<number>(() => (!user ? getGuestCartCount() : 0))

  // Fetch cart count for authenticated users
  const {
    data: userCartCount = 0,
    isLoading,
    refetch,
  }: UseQueryResult<number, Error> = useQuery({
    queryKey: queryKeys.cart.summary(user?.id || null),
    queryFn: () => fetchUserCartCount(user!.id),
    enabled: enabled && !!user,
    ...defaultQueryConfig,
  })

  // Listen for guest cart changes
  useEffect(() => {
    if (user) return // Skip for authenticated users

    const updateGuestCount = () => {
      setGuestCount(getGuestCartCount())
    }

    // Initial count
    updateGuestCount()

    // Custom event listener for same-tab updates
    const handleCartUpdate = () => {
      updateGuestCount()
    }

    // Listen for custom cart update events (fired when cart changes in same tab)
    window.addEventListener('cart:updated', handleCartUpdate)

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', updateGuestCount)

    // Poll for changes as fallback (less frequent now that we have event)
    const interval = setInterval(updateGuestCount, 2000)

    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate)
      window.removeEventListener('storage', updateGuestCount)
      clearInterval(interval)
    }
  }, [user])

  // Real-time subscription for authenticated users
  useEffect(() => {
    if (!user || !enabled) return

    const channel = supabase
      .channel('cart-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, enabled, refetch])

  return {
    cartCount: user ? userCartCount : guestCount,
    loading: user ? isLoading : false,
  }
}
