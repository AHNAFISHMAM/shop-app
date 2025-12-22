/**
 * usePrevious Hook
 *
 * Stores the previous value of a variable.
 * Useful for comparing previous and current values.
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0)
 * const prevCount = usePrevious(count)
 *
 * useEffect(() => {
 *   if (prevCount !== undefined && count > prevCount) {
 *     console.log('Count increased')
 *   }
 * }, [count, prevCount])
 * ```
 */

import { useRef, useEffect } from 'react'

/**
 * usePrevious hook
 *
 * @param value - Value to track
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

