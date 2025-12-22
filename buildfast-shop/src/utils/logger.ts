/**
 * Logger Utility
 * Environment-aware logging that only logs in development mode
 * Prevents console statements from appearing in production builds
 */

const isDevelopment = import.meta.env.DEV ?? false

/**
 * Logger interface for type-safe logging
 */
export interface Logger {
  log: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  table: (...args: unknown[]) => void
  group: (label: string, fn: () => void) => void
}

/**
 * Log utility that only logs in development
 */
export const logger: Logger = {
  /**
   * Log informational messages (development only)
   * @param args - Arguments to log
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log error messages (always logs, but can be extended for error tracking)
   * @param args - Arguments to log
   */
  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args)
    }
    // In production, could send to error tracking service
    // if (import.meta.env.PROD) {
    //   errorTrackingService.captureException(...args);
    // }
  },

  /**
   * Log warning messages (development only)
   * @param args - Arguments to log
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log info messages (development only)
   * @param args - Arguments to log
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Log debug messages (development only)
   * @param args - Arguments to log
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log table data (development only)
   * @param args - Arguments to log
   */
  table: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.table(...args)
    }
  },

  /**
   * Log grouped messages (development only)
   * @param label - Group label
   * @param fn - Function to execute within group
   */
  group: (label: string, fn: () => void): void => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },
}

