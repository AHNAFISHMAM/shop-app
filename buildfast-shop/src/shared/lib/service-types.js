/**
 * Service Types and Interfaces
 * 
 * Type definitions and interfaces for service layer
 * (JSDoc types for JavaScript - can be converted to TypeScript later)
 */

/**
 * Standard service response format
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} data - Response data (null if error)
 * @property {string|null} error - Error message (null if success)
 * @property {string|null} code - Error code (null if success)
 * @property {Object|null} meta - Optional metadata (pagination, timestamps, etc.)
 */

/**
 * Pagination metadata
 * @typedef {Object} PaginationMeta
 * @property {number} page - Current page (1-based)
 * @property {number} pageSize - Items per page
 * @property {number} total - Total items
 * @property {number} totalPages - Total pages
 * @property {boolean} hasNext - Whether there is a next page
 * @property {boolean} hasPrev - Whether there is a previous page
 */

/**
 * Service response with pagination
 * @typedef {ServiceResponse & {meta: {pagination: PaginationMeta}}} PaginatedResponse
 */

/**
 * Query options for data fetching
 * @typedef {Object} QueryOptions
 * @property {number} page - Page number (1-based)
 * @property {number} pageSize - Items per page
 * @property {string} sortBy - Sort field
 * @property {string} sortOrder - Sort order ('asc' | 'desc')
 * @property {Object} filters - Filter criteria
 */

/**
 * Mutation options
 * @typedef {Object} MutationOptions
 * @property {boolean} optimistic - Whether to use optimistic updates
 * @property {Function} onSuccess - Success callback
 * @property {Function} onError - Error callback
 */

/**
 * Cache options for React Query
 * @typedef {Object} CacheOptions
 * @property {number} staleTime - Time in ms before data is considered stale
 * @property {number} cacheTime - Time in ms to keep unused data in cache
 * @property {boolean} refetchOnMount - Whether to refetch on mount
 * @property {boolean} refetchOnWindowFocus - Whether to refetch on window focus
 * @property {boolean} refetchOnReconnect - Whether to refetch on reconnect
 */

