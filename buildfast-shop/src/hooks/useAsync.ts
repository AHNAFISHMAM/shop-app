/**
 * useAsync Hook
 *
 * Manages async operations with loading, error, and data states.
 * Useful for handling async functions outside of React Query.
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(async () => {
 *   const response = await fetch('/api/data')
 *   return response.json()
 * })
 *
 * useEffect(() => {
 *   execute()
 * }, [])
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { logError } from '../lib/error-handler'

/**
 * Async state
 */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * useAsync hook
 *
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute immediately (default: false)
 * @returns Async state and execute function
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = false
): AsyncState<T> & { execute: () => Promise<void>; reset: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(immediate)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await asyncFunction()
      if (mountedRef.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      logError(error, 'useAsync.execute')
      if (mountedRef.current) {
        setError(error)
        setData(null)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return { data, loading, error, execute, reset }
}
