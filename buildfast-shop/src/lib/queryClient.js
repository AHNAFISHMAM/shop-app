/**
 * React Query Client Configuration
 * Centralized configuration for data fetching, caching, and synchronization
 *
 * React Query v5 API:
 * - gcTime: Garbage collection time (replaces cacheTime)
 * - staleTime: Time before data is considered stale
 * - refetchOnWindowFocus: Whether to refetch on window focus
 * - retry: Number of retry attempts
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Create and configure React Query client
 *
 * Default options:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - Unused data stays in cache for 10 minutes (v5 API)
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 * - retry: 1 - Retry failed requests once
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (v5 API - replaces cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})
