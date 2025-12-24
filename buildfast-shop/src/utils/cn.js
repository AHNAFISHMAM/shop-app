/**
 * Utility function to merge classNames conditionally
 * Similar to clsx but simpler for our use case
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
