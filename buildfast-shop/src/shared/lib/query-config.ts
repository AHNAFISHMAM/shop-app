/**
 * React Query Configuration
 *
 * Default query and mutation configurations for React Query.
 * Provides consistent caching and retry strategies across the application.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Default query configuration
 */
export const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false, // Don't refetch on mount if data is fresh
  refetchOnReconnect: true,
  retry: (failureCount: number, error: Error) => {
    // Don't retry on 4xx errors (client errors)
    const errorMessage = error.message.toLowerCase()
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('404') ||
      errorMessage.includes('400') ||
      errorMessage.includes('4')
    ) {
      return false
    }
    // Retry up to 2 times for other errors
    return failureCount < 2
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  networkMode: 'online' as const,
} as const

/**
 * Default mutation configuration
 */
export const defaultMutationConfig = {
  retry: 1,
  retryDelay: 1000,
  networkMode: 'online' as const,
} as const

/**
 * Long-lived query configuration (for data that changes infrequently)
 */
export const longLivedQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 60 minutes
} as const

/**
 * Short-lived query configuration (for data that changes frequently)
 */
export const shortLivedQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 2 * 60 * 1000, // 2 minutes
  refetchOnWindowFocus: true,
} as const

/**
 * Real-time query configuration (for data that needs to be always fresh)
 */
export const realTimeQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 0, // Always consider stale
  gcTime: 1 * 60 * 1000, // 1 minute
  refetchInterval: 30 * 1000, // Refetch every 30 seconds
  refetchOnWindowFocus: true,
} as const

/**
 * Optimistic mutation variables
 */
export interface OptimisticMutationVariables<T> {
  queryKey: QueryKey
  optimisticUpdate: T
}

/**
 * Create optimistic mutation configuration
 *
 * @param queryClient - React Query client instance
 * @returns Optimistic mutation configuration
 *
 * @example
 * ```typescript
 * import { queryClient } from '../../lib/queryClient';
 * const config = createOptimisticMutationConfig(queryClient);
 * ```
 */
export function createOptimisticMutationConfig<T>(queryClient: QueryClient) {
  return {
    ...defaultMutationConfig,
    onMutate: async (variables: OptimisticMutationVariables<T>) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: variables.queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<T>(variables.queryKey)

      // Optimistically update
      queryClient.setQueryData<T>(variables.queryKey, variables.optimisticUpdate)

      return { previousData }
    },
    onError: (
      _err: Error,
      variables: OptimisticMutationVariables<T>,
      context: { previousData?: T } | undefined
    ) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData<T>(variables.queryKey, context.previousData)
      }
    },
    onSettled: (_data: T | undefined, _error: Error | null, variables: OptimisticMutationVariables<T>) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: variables.queryKey })
    },
  }
}

