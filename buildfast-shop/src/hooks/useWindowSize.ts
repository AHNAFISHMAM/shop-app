/**
 * useWindowSize Hook
 *
 * Tracks window dimensions (width and height).
 * Useful for responsive layouts and conditional rendering.
 *
 * @example
 * ```tsx
 * const { width, height } = useWindowSize()
 * const isMobile = width < 768
 * ```
 */

import { useState, useEffect } from 'react'
import { useThrottle } from './useThrottle'

/**
 * Window size object
 */
export interface WindowSize {
  width: number
  height: number
}

/**
 * useWindowSize hook
 *
 * @param throttleMs - Throttle delay in milliseconds (default: 100ms)
 * @returns Window size object with width and height
 */
export function useWindowSize(throttleMs = 100): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 }
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  })

  const [throttledWidth, setThrottledWidth] = useState(windowSize.width)
  const [throttledHeight, setThrottledHeight] = useState(windowSize.height)

  // Throttle width and height separately
  const throttledW = useThrottle(windowSize.width, throttleMs)
  const throttledH = useThrottle(windowSize.height, throttleMs)

  useEffect(() => {
    setThrottledWidth(throttledW)
  }, [throttledW])

  useEffect(() => {
    setThrottledHeight(throttledH)
  }, [throttledH])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    width: throttledWidth,
    height: throttledHeight,
  }
}

