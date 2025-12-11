/**
 * Base Service Class
 * 
 * Provides standardized service layer with consistent error handling,
 * response formatting, and logging.
 * 
 * All services should extend this base class or follow its patterns.
 */

import { logger } from '../../utils/logger';
import { handleAsyncError, handleDatabaseError } from '../../utils/errorHandler';

/**
 * Standard service response format
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} data - Response data (null if error)
 * @property {string|null} error - Error message (null if success)
 * @property {Object|null} meta - Optional metadata (pagination, timestamps, etc.)
 */

/**
 * Base Service Class
 * 
 * Provides common functionality for all services:
 * - Standardized error handling
 * - Consistent response format
 * - Logging
 * - Request/response transformation
 */
export class BaseService {
  /**
   * Service name for logging
   * @type {string}
   */
  serviceName = 'BaseService';

  /**
   * Create standardized success response
   * 
   * @param {*} data - Response data
   * @param {Object|null} meta - Optional metadata
   * @returns {ServiceResponse}
   */
  successResponse(data, meta = null) {
    return {
      success: true,
      data,
      error: null,
      meta: meta || null
    };
  }

  /**
   * Create standardized error response
   * 
   * @param {string} error - Error message
   * @param {Error|null} errorDetails - Original error object
   * @param {string|null} code - Error code
   * @returns {ServiceResponse}
   */
  errorResponse(error, errorDetails = null, code = null) {
    if (errorDetails) {
      logger.error(`[${this.serviceName}]`, errorDetails);
    }

    return {
      success: false,
      data: null,
      error: error || 'An unexpected error occurred',
      code: code || errorDetails?.code || null,
      meta: {
        errorDetails: errorDetails ? {
          message: errorDetails.message,
          stack: errorDetails.stack
        } : null
      }
    };
  }

  /**
   * Wrap async operation with error handling
   * 
   * @param {Function} asyncFn - Async function to execute
   * @param {string} context - Context for error logging
   * @param {string} fallbackError - Fallback error message
   * @returns {Promise<ServiceResponse>}
   */
  async wrapAsync(asyncFn, context, fallbackError = 'Operation failed') {
    try {
      const data = await asyncFn();
      return this.successResponse(data);
    } catch (error) {
      const result = handleAsyncError(error, `${this.serviceName}.${context}`, fallbackError);
      return this.errorResponse(result.error, error, result.code);
    }
  }

  /**
   * Wrap database operation with error handling
   * 
   * @param {Function} dbFn - Database function to execute
   * @param {string} context - Context for error logging
   * @param {Object} options - Error handling options
   * @returns {Promise<ServiceResponse>}
   */
  async wrapDatabase(dbFn, context, options = {}) {
    try {
      const data = await dbFn();
      return this.successResponse(data);
    } catch (error) {
      const result = handleDatabaseError(error, `${this.serviceName}.${context}`, options);
      return this.errorResponse(result.error, error, result.code);
    }
  }

  /**
   * Validate required fields
   * 
   * @param {Object} data - Data to validate
   * @param {Array<string>} requiredFields - Required field names
   * @returns {Object|null} Validation error response or null if valid
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return this.errorResponse(
        `Missing required fields: ${missing.join(', ')}`,
        null,
        'VALIDATION_ERROR'
      );
    }

    return null;
  }

  /**
   * Create paginated response
   * 
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination info
   * @param {number} pagination.page - Current page
   * @param {number} pagination.pageSize - Page size
   * @param {number} pagination.total - Total items
   * @returns {ServiceResponse}
   */
  paginatedResponse(data, pagination) {
    const { page, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);

    return this.successResponse(data, {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  }
}

/**
 * Create service response helper functions
 * (For services that don't extend BaseService)
 */

/**
 * Create success response
 * @param {*} data - Response data
 * @param {Object|null} meta - Optional metadata
 * @returns {ServiceResponse}
 */
export function createSuccessResponse(data, meta = null) {
  return {
    success: true,
    data,
    error: null,
    meta: meta || null
  };
}

/**
 * Create error response
 * @param {string} error - Error message
 * @param {Error|null} errorDetails - Original error object
 * @param {string|null} code - Error code
 * @returns {ServiceResponse}
 */
export function createErrorResponse(error, errorDetails = null, code = null) {
  return {
    success: false,
    data: null,
    error: error || 'An unexpected error occurred',
    code: code || errorDetails?.code || null,
    meta: {
      errorDetails: errorDetails ? {
        message: errorDetails.message,
        stack: errorDetails.stack
      } : null
    }
  };
}

