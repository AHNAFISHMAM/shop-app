/**
 * Shared Library Index
 *
 * Central export point for all shared library utilities.
 */

// Base service
export { BaseService, createSuccessResponse, createErrorResponse } from './base-service'

// API client
export { ApiClient, apiClient, createApiClient } from './api-client'
export { edgeFunctionClient } from './api-client-edge'

// Service types
export * from './service-types'

// Query keys
export { queryKeys } from './query-keys'

// Query config
export {
  defaultQueryConfig,
  defaultMutationConfig,
  longLivedQueryConfig,
  shortLivedQueryConfig,
  realTimeQueryConfig,
  createOptimisticMutationConfig,
} from './query-config'
