/**
 * useToggle Hook
 *
 * Toggles between two values (typically true/false).
 * Useful for boolean state management.
 *
 * @example
 * ```tsx
 * const [isOpen, toggle, setOpen, setClosed] = useToggle(false)
 * ```
 */

import { useState, useCallback } from 'react'

/**
 * useToggle hook
 *
 * @param initialValue - Initial value (default: false)
 * @returns Tuple of [value, toggle, setTrue, setFalse]
 */
export function useToggle(initialValue = false): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue(prev => !prev)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  return [value, toggle, setTrue, setFalse]
}
