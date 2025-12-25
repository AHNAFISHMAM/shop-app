import toast from 'react-hot-toast'

/**
 * Toast Notification Utilities
 *
 * Based on UX best practices:
 * - Success: 3-4 seconds (quick confirmation)
 * - Error: 5-6 seconds (users need more time to read)
 * - Info: 4 seconds (informational)
 * - Warning: 4-5 seconds (important but not critical)
 */

const TOAST_DURATIONS = {
  success: 3000, // 3 seconds - quick confirmation
  error: 5000, // 5 seconds - users need time to read errors
  info: 4000, // 4 seconds - informational
  warning: 4500, // 4.5 seconds - important but not critical
} as const

/**
 * Show success toast with optimized duration
 */
export const showSuccessToast = (
  message: string,
  options?: Parameters<typeof toast.success>[1]
) => {
  return toast.success(message, {
    duration: TOAST_DURATIONS.success,
    position: 'top-center',
    ...options,
  })
}

/**
 * Show error toast with optimized duration
 */
export const showErrorToast = (message: string, options?: Parameters<typeof toast.error>[1]) => {
  return toast.error(message, {
    duration: TOAST_DURATIONS.error,
    position: 'top-center',
    ...options,
  })
}

/**
 * Show info toast with optimized duration
 */
export const showInfoToast = (message: string, options?: Parameters<typeof toast>[1]) => {
  return toast(message, {
    duration: TOAST_DURATIONS.info,
    position: 'top-center',
    ...options,
  })
}

/**
 * Show warning toast with optimized duration
 */
export const showWarningToast = (message: string, options?: Parameters<typeof toast>[1]) => {
  return toast(message, {
    duration: TOAST_DURATIONS.warning,
    position: 'top-center',
    icon: '⚠️',
    ...options,
  })
}

export { toast }
