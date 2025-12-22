/**
 * Error Handler Utility (Legacy)
 *
 * This file re-exports from the new TypeScript error-handler.ts
 * for backward compatibility. New code should import from '../lib/error-handler'
 *
 * @deprecated Use '../lib/error-handler' instead
 */

// Re-export from new TypeScript error handler
export {
  handleAsyncError,
  handleDatabaseError,
  handleApiError,
  createSafeAsync,
  extractErrorInfo,
  logError,
  getUserFriendlyError,
  isRetryableError,
} from '../lib/error-handler'
