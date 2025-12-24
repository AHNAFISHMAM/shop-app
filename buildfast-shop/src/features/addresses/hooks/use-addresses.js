/**
 * useAddresses Hook
 *
 * Custom hook for fetching user addresses.
 *
 * @returns {Object} Addresses, loading state, and error
 *
 * @example
 * const { addresses, loading, error, refetch } = useAddresses(user);
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { fetchUserAddresses } from '../../../lib/addressesApi'
import { longLivedQueryConfig } from '../../../shared/lib/query-config'

/**
 * useAddresses Hook
 *
 * Fetches and manages user addresses with React Query.
 *
 * @param {Object} options - Hook options
 * @param {Object|null} options.user - Current user
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Addresses, loading state, and error
 */
export function useAddresses(options = {}) {
  const { user, enabled = true } = options

  const {
    data: addressesResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.addresses.list(user?.id),
    queryFn: async () => {
      const result = await fetchUserAddresses(user.id)
      // Extract addresses from API response
      if (result.success && result.data) {
        return result.data
      }
      return []
    },
    enabled: enabled && !!user,
    ...longLivedQueryConfig, // Addresses change infrequently
  })

  return {
    addresses: addressesResult || [],
    loading: isLoading,
    error,
    refetch,
  }
}
