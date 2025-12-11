/**
 * React Query Configuration
 * 
 * Default query and mutation configurations for React Query.
 * Provides consistent caching and retry strategies across the application.
 */

/**
 * Default query configuration
 */
export const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true,
  retry: 1,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Default mutation configuration
 */
export const defaultMutationConfig = {
  retry: 1,
  retryDelay: 1000,
};

/**
 * Long-lived query configuration (for data that changes infrequently)
 */
export const longLivedQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 60 minutes
};

/**
 * Short-lived query configuration (for data that changes frequently)
 */
export const shortLivedQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 2 * 60 * 1000, // 2 minutes
  refetchOnWindowFocus: true,
};

/**
 * Real-time query configuration (for data that needs to be always fresh)
 */
export const realTimeQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 0, // Always consider stale
  gcTime: 1 * 60 * 1000, // 1 minute
  refetchInterval: 30 * 1000, // Refetch every 30 seconds
  refetchOnWindowFocus: true,
};

/**
 * Create optimistic mutation configuration
 * 
 * @param {Object} queryClient - React Query client instance
 * @returns {Object} Optimistic mutation configuration
 * 
 * @example
 * import { queryClient } from '../../lib/queryClient';
 * const config = createOptimisticMutationConfig(queryClient);
 */
export function createOptimisticMutationConfig(queryClient) {
  return {
    ...defaultMutationConfig,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: variables.queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(variables.queryKey);
      
      // Optimistically update
      queryClient.setQueryData(variables.queryKey, variables.optimisticUpdate);
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(variables.queryKey, context.previousData);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: variables.queryKey });
    },
  };
}

