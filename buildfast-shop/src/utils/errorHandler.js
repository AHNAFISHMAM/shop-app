/**
 * Error Handler Utility
 * 
 * Provides standardized error handling patterns for async operations
 * and consistent error response formatting
 */

import { logger } from './logger';

/**
 * Handle async errors with consistent logging and response format
 * 
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'MenuPage.fetchMenu')
 * @param {string} fallbackMessage - Fallback message if error.message is missing
 * @returns {Object} Standardized error response { success: false, error: string }
 * 
 * @example
 * try {
 *   const result = await someAsyncOperation();
 *   return { success: true, data: result };
 * } catch (err) {
 *   return handleAsyncError(err, 'ComponentName.operation', 'Operation failed');
 * }
 */
export const handleAsyncError = (error, context, fallbackMessage = 'An unexpected error occurred') => {
  logger.error(`[${context}]`, error);
  
  return {
    success: false,
    error: error?.message || fallbackMessage,
    code: error?.code || null,
    details: error
  };
};

/**
 * Handle database errors with specific error code handling
 * 
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {Object} options - Additional options
 * @param {Function} options.onTableNotFound - Callback for table not found errors
 * @param {Function} options.onPermissionDenied - Callback for permission errors
 * @returns {Object} Standardized error response
 */
export const handleDatabaseError = (error, context, options = {}) => {
  const { onTableNotFound, onPermissionDenied } = options;
  
  logger.error(`[${context}] Database error:`, error);
  
  // Handle specific error codes
  if (error?.code === '42P01' || error?.code === 'PGRST116') {
    // Table does not exist
    if (onTableNotFound) {
      return onTableNotFound(error);
    }
    return {
      success: false,
      error: 'Database table not found. Please run the migration first.',
      code: error.code
    };
  }
  
  if (error?.code === '42501') {
    // Permission denied
    if (onPermissionDenied) {
      return onPermissionDenied(error);
    }
    return {
      success: false,
      error: 'Permission denied. Please ensure you are logged in.',
      code: error.code
    };
  }
  
  return handleAsyncError(error, context, 'Database operation failed');
};

/**
 * Handle API errors with HTTP status code handling
 * 
 * @param {Error|Response} error - The error or response object
 * @param {string} context - Context where error occurred
 * @returns {Object} Standardized error response
 */
export const handleApiError = async (error, context) => {
  // If it's a Response object, try to extract error message
  if (error instanceof Response) {
    try {
      const errorData = await error.json().catch(() => ({}));
      logger.error(`[${context}] API error (${error.status}):`, errorData);
      
      return {
        success: false,
        error: errorData.message || `API request failed with status ${error.status}`,
        status: error.status,
        data: errorData
      };
    } catch (parseError) {
      logger.error(`[${context}] Failed to parse API error:`, parseError);
      return {
        success: false,
        error: `API request failed with status ${error.status}`,
        status: error.status
      };
    }
  }
  
  return handleAsyncError(error, context, 'API request failed');
};

/**
 * Create a safe async wrapper that automatically handles errors
 * 
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function that returns { success, data/error }
 * 
 * @example
 * const safeFetch = createSafeAsync(fetchMenu, 'MenuPage.fetchMenu');
 * const result = await safeFetch();
 * if (result.success) {
 *   setMenu(result.data);
 * }
 */
export const createSafeAsync = (asyncFn, context) => {
  return async (...args) => {
    try {
      const data = await asyncFn(...args);
      return { success: true, data };
    } catch (error) {
      return handleAsyncError(error, context, 'Operation failed');
    }
  };
};

