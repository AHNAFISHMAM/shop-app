/**
 * useClickOutside Hook
 *
 * Detects clicks outside of a referenced element.
 * Useful for closing modals, dropdowns, and popovers.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null)
 * const [isOpen, setIsOpen] = useState(false)
 *
 * useClickOutside(ref, () => setIsOpen(false))
 * ```
 */

import { useEffect, useRef, type RefObject } from 'react'

/**
 * useClickOutside hook
 *
 * @param ref - Ref to the element to detect outside clicks for
 * @param handler - Callback function to execute on outside click
 * @param enabled - Whether the hook is enabled (default: true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true
): void {
  const handlerRef = useRef(handler)

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }

      handlerRef.current(event)
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, enabled])
}
