/**
 * Error Handler Utility
 *
 * Provides standardized error handling patterns for async operations,
 * user-friendly error messages, and consistent error response formatting.
 */

import { logger } from '../utils/logger'

/**
 * Error information interface
 */
export interface ErrorInfo {
  message: string
  code?: string
  status?: number
  userMessage: string
  retryable: boolean
}

/**
 * Error map for user-friendly messages
 */
const ERROR_MAP: Record<string, Omit<ErrorInfo, 'message' | 'code' | 'status'>> = {
  'Network request failed': {
    userMessage: 'Please check your internet connection and try again.',
    retryable: true,
  },
  'Failed to fetch': {
    userMessage: 'Unable to connect to the server. Please check your internet connection.',
    retryable: true,
  },
  '401': {
    userMessage: 'Your session has expired. Please log in again.',
    retryable: false,
  },
  '403': {
    userMessage: "You don't have permission to perform this action.",
    retryable: false,
  },
  '404': {
    userMessage: 'The requested resource was not found.',
    retryable: false,
  },
  '500': {
    userMessage: 'Server error. Please try again later.',
    retryable: true,
  },
  '42P01': {
    userMessage: 'Database table not found. Please contact support.',
    retryable: false,
  },
  PGRST116: {
    userMessage: 'Database relationship not found. Please contact support.',
    retryable: false,
  },
  '42501': {
    userMessage: 'Permission denied. Please ensure you are logged in.',
    retryable: false,
  },
}

/**
 * Extract error information from unknown error type
 *
 * @param error - The error object (unknown type)
 * @returns ErrorInfo with user-friendly message
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const message = error.message
    const code = (error as any).code || (error as any).statusCode
    const status = (error as any).status || (error as any).statusCode

    // Check error map for user-friendly messages
    for (const [key, info] of Object.entries(ERROR_MAP)) {
      if (message.includes(key) || code === key || status?.toString() === key) {
        return {
          message,
          code: code?.toString(),
          status: typeof status === 'number' ? status : undefined,
          userMessage: info.userMessage,
          retryable: info.retryable,
        }
      }
    }

    // Default error info
    return {
      message,
      code: code?.toString(),
      status: typeof status === 'number' ? status : undefined,
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
    }
  }

  // Unknown error type
  return {
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
  }
}

/**
 * Log error with context
 *
 * @param error - The error object
 * @param context - Context where error occurred (e.g., 'MenuPage.fetchMenu')
 */
export function logError(error: unknown, context?: string): void {
  const errorInfo = extractErrorInfo(error)
  const contextPrefix = context ? `[${context}]` : '[Error]'

  logger.error(`${contextPrefix}`, {
    message: errorInfo.message,
    code: errorInfo.code,
    status: errorInfo.status,
    userMessage: errorInfo.userMessage,
    retryable: errorInfo.retryable,
    error,
  })

  // In production, send to error tracking service (e.g., Sentry)
  if (import.meta.env.PROD) {
    // TODO: Integrate with error tracking service
    // Sentry.captureException(error, { tags: { context } })
  }
}

/**
 * Get user-friendly error message
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  return extractErrorInfo(error).userMessage
}

/**
 * Check if error is retryable
 *
 * @param error - The error object
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return extractErrorInfo(error).retryable
}

/**
 * Handle async errors with consistent logging and response format
 *
 * @param error - The error object
 * @param context - Context where error occurred
 * @param fallbackMessage - Fallback message if error.message is missing
 * @returns Standardized error response
 */
export function handleAsyncError(
  error: unknown,
  context: string,
  fallbackMessage = 'An unexpected error occurred'
): { success: false; error: string; code?: string | null; details?: unknown } {
  logError(error, context)

  const errorInfo = extractErrorInfo(error)

  return {
    success: false,
    error: errorInfo.userMessage || fallbackMessage,
    code: errorInfo.code || null,
    details: error,
  }
}

/**
 * Handle database errors with specific error code handling
 *
 * @param error - The error object
 * @param context - Context where error occurred
 * @param options - Additional options
 * @returns Standardized error response
 */
export function handleDatabaseError(
  error: unknown,
  context: string,
  options: {
    onTableNotFound?: (error: unknown) => { success: false; error: string; code?: string }
    onPermissionDenied?: (error: unknown) => { success: false; error: string; code?: string }
  } = {}
): { success: false; error: string; code?: string } {
  const { onTableNotFound, onPermissionDenied } = options

  logError(error, context)

  const errorInfo = extractErrorInfo(error)

  // Handle specific error codes
  if (errorInfo.code === '42P01' || errorInfo.code === 'PGRST116') {
    // Table does not exist
    if (onTableNotFound) {
      return onTableNotFound(error)
    }
    return {
      success: false,
      error: errorInfo.userMessage,
      code: errorInfo.code,
    }
  }

  if (errorInfo.code === '42501') {
    // Permission denied
    if (onPermissionDenied) {
      return onPermissionDenied(error)
    }
    return {
      success: false,
      error: errorInfo.userMessage,
      code: errorInfo.code,
    }
  }

  return {
    success: false,
    error: errorInfo.userMessage,
    code: errorInfo.code,
  }
}

/**
 * Handle API errors with HTTP status code handling
 *
 * @param error - The error or response object
 * @param context - Context where error occurred
 * @returns Standardized error response
 */
export async function handleApiError(
  error: unknown,
  context: string
): Promise<{ success: false; error: string; status?: number; data?: unknown }> {
  // If it's a Response object, try to extract error message
  if (error instanceof Response) {
    try {
      const errorData = await error.json().catch(() => ({}))
      logError(error, context)

      const errorInfo = extractErrorInfo(error)

      return {
        success: false,
        error: errorInfo.userMessage || `API request failed with status ${error.status}`,
        status: error.status,
        data: errorData,
      }
    } catch (parseError) {
      logError(parseError, `${context}.parseError`)
      return {
        success: false,
        error: `API request failed with status ${error.status}`,
        status: error.status,
      }
    }
  }

  return handleAsyncError(error, context, 'API request failed')
}

/**
 * Create a safe async wrapper that automatically handles errors
 *
 * @param asyncFn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function that returns { success, data/error }
 */
export function createSafeAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  context: string
): (
  ...args: Parameters<T>
) => Promise<
  | { success: true; data: Awaited<ReturnType<T>> }
  | { success: false; error: string; code?: string | null; details?: unknown }
> {
  return async (...args: Parameters<T>) => {
    try {
      const data = await asyncFn(...args)
      return { success: true, data }
    } catch (error) {
      return handleAsyncError(error, context, 'Operation failed')
    }
  }
}
