/**
 * useThrottle Hook
 *
 * Throttles a value, updating it at most once per specified interval.
 * Useful for scroll handlers, resize handlers, and frequent events.
 */

import { useState, useEffect, useRef } from 'react'

/**
 * useThrottle hook
 *
 * @param value - Value to throttle
 * @param limit - Time limit in milliseconds (default: 1000ms)
 * @returns Throttled value
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0)
 * const throttledScrollY = useThrottle(scrollY, 100)
 *
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY)
 *   window.addEventListener('scroll', handleScroll)
 *   return () => window.removeEventListener('scroll', handleScroll)
 * }, [])
 *
 * // Use throttledScrollY for expensive operations
 * ```
 */
export function useThrottle<T>(value: T, limit = 1000): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

