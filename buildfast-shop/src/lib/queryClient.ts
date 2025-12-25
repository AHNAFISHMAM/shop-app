/**
 * React Query Client Configuration
 * Centralized configuration for data fetching, caching, and synchronization
 *
 * React Query v5 API:
 * - gcTime: Garbage collection time (replaces cacheTime)
 * - staleTime: Time before data is considered stale
 * - refetchOnWindowFocus: Whether to refetch on window focus
 * - retry: Number of retry attempts or function
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Create and configure React Query client
 *
 * Default options:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 30 minutes - Unused data stays in cache for 30 minutes (v5 API)
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 * - retry: Smart retry - Don't retry 4xx errors, retry others up to 2 times
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimized caching: longer staleTime for better performance
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - unused data stays in cache for 30 minutes (v5 API)
      refetchOnWindowFocus: false, // Don't refetch on window focus - reduces unnecessary requests
      refetchOnReconnect: true, // Refetch when connection restored - ensures data is fresh
      refetchOnMount: false, // Don't refetch on mount if data is fresh - uses cache when possible
      networkMode: 'online', // Only fetch when online - prevents failed requests
      // Performance: Use cached data more aggressively
      structuralSharing: true, // Share object references between queries to reduce re-renders
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error) {
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
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
})
