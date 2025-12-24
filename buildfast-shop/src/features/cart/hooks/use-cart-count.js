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
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import { defaultQueryConfig } from '../../../shared/lib/query-config'

/**
 * Fetch cart count for authenticated user
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Cart count
 */
async function fetchUserCartCount(userId) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId)

    if (error) {
      logger.error('Error fetching cart count:', error)
      throw error
    }

    return data.reduce((sum, item) => sum + item.quantity, 0)
  } catch (error) {
    logger.error('Error in fetchUserCartCount:', error)
    throw error
  }
}

/**
 * Get guest cart count from localStorage
 *
 * @returns {number} Cart count
 */
function getGuestCartCount() {
  if (typeof window === 'undefined') return 0

  try {
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]')
    return guestCart.reduce((sum, item) => sum + (item.quantity || 0), 0)
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
 * @param {Object} options - Hook options
 * @param {Object|null} options.user - Current user
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Cart count and loading state
 */
export function useCartCount(options = {}) {
  const { user, enabled = true } = options
  const [guestCount, setGuestCount] = useState(() => (!user ? getGuestCartCount() : 0))

  // Fetch cart count for authenticated users
  const {
    data: userCartCount = 0,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.cart.summary(user?.id),
    queryFn: () => fetchUserCartCount(user.id),
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
