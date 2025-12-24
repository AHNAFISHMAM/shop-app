/**
 * Logger Utility
 * Environment-aware logging that only logs in development mode
 * Prevents console statements from appearing in production builds
 */

const isDevelopment = import.meta.env.DEV

/**
 * Log utility that only logs in development
 */
export const logger = {
  /**
   * Log informational messages (development only)
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log error messages (always logs, but can be extended for error tracking)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
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
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log info messages (development only)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Log debug messages (development only)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log table data (development only)
   * @param {...any} args - Arguments to log
   */
  table: (...args) => {
    if (isDevelopment) {
      console.table(...args)
    }
  },

  /**
   * Log grouped messages (development only)
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within group
   */
  group: (label, fn) => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },
}
