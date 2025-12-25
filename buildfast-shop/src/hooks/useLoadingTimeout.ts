import { useEffect, useState } from 'react'

/**
 * useLoadingTimeout Hook
 *
 * Prevents infinite loading states by automatically timing out after a specified duration.
 * Returns false (not loading) if timeout is reached, even if loading is still true.
 *
 * @param loading - Current loading state
 * @param timeoutMs - Timeout duration in milliseconds (default: 10000 = 10 seconds)
 * @returns Adjusted loading state (false if timed out)
 *
 * @example
 * const loading = useLoadingTimeout(isLoading, 10000)
 * if (loading) return <LoadingSpinner />
 */
export function useLoadingTimeout(loading: boolean, timeoutMs = 10000): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (loading) {
      setTimedOut(false)
      const timer = setTimeout(() => {
        setTimedOut(true)
        if (import.meta.env.DEV) {
          console.warn('Loading timeout reached - showing content anyway to prevent infinite loading')
        }
      }, timeoutMs)
      return () => clearTimeout(timer)
    } else {
      setTimedOut(false)
    }
    return undefined // Explicit return for all code paths
  }, [loading, timeoutMs])

  // Return false if timed out, even if still loading
  return loading && !timedOut
}

