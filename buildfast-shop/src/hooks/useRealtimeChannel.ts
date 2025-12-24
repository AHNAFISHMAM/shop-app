/**
 * useRealtimeChannel Hook
 *
 * Reusable hook for Supabase real-time subscriptions with proper cleanup,
 * debounced cache invalidation, and error handling.
 *
 * @example
 * ```tsx
 * useRealtimeChannel({
 *   table: 'orders',
 *   filter: `user_id=eq.${user.id}`,
 *   queryKeys: [['orders', user.id], ['order-summary', user.id]],
 *   enabled: !!user?.id,
 * })
 * ```
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { logError } from '../lib/error-handler'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Real-time subscription options
 */
export interface UseRealtimeChannelOptions {
  /** Table name to subscribe to */
  table: string
  /** Event types to listen for (default: '*') */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  /** Filter string (e.g., 'user_id=eq.123') */
  filter?: string
  /** React Query keys to invalidate on changes */
  queryKeys: (string | number)[][]
  /** Whether subscription is enabled */
  enabled?: boolean
  /** Channel name (auto-generated if not provided) */
  channelName?: string
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number
  /** Custom callback for handling payloads */
  onPayload?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  /** Schema name (default: 'public') */
  schema?: string
}

/**
 * useRealtimeChannel hook
 *
 * Sets up a Supabase real-time subscription with automatic cleanup,
 * debounced cache invalidation, error handling, and automatic reconnection.
 *
 * Features:
 * - Automatic reconnection on timeout/close with exponential backoff
 * - Maximum 5 reconnection attempts
 * - Proper cleanup of channels and timers
 * - Connection state monitoring
 */
export function useRealtimeChannel(options: UseRealtimeChannelOptions): void {
  const {
    table,
    event = '*',
    filter,
    queryKeys,
    enabled = true,
    channelName,
    debounceMs = 300,
    onPayload,
    schema = 'public',
  } = options

  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isMountedRef = useRef(true)
  const [reconnectTrigger, setReconnectTrigger] = useState(0)

  // Reconnection configuration
  const MAX_RECONNECT_ATTEMPTS = 5
  const INITIAL_RECONNECT_DELAY = 1000 // 1 second
  const MAX_RECONNECT_DELAY = 30000 // 30 seconds
  const HEALTH_CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes - check before typical timeout

  // Debounced cache invalidation
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        // Invalidate all specified query keys
        queryKeys.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      }
    }, debounceMs)
  }, [queryClient, queryKeys, debounceMs])

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !supabase) {
      // Clean up if disabled
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          logError(error, 'useRealtimeChannel.cleanup')
        }
        channelRef.current = null
      }
      // Clear reconnect attempts when disabled
      reconnectAttemptsRef.current = 0
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      return
    }

    // Cleanup any existing channel before creating new one
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (error) {
        // Silently handle cleanup errors
        logError(error, 'useRealtimeChannel.cleanup')
      }
      channelRef.current = null
    }

    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Generate channel name if not provided
    const finalChannelName = channelName || `realtime-${table}-${filter || 'all'}-${Date.now()}`

    // Build subscription config
    const subscriptionConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema,
      table,
    }

    if (filter) {
      subscriptionConfig.filter = filter
    }

    const channelConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: string
      table: string
      filter?: string
    } = {
      event: subscriptionConfig.event,
      schema: subscriptionConfig.schema,
      table: subscriptionConfig.table,
    }
    if (subscriptionConfig.filter) {
      channelConfig.filter = subscriptionConfig.filter
    }

    const postgresConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: string
      table: string
      filter?: string
    } = {
      event: channelConfig.event,
      schema: channelConfig.schema,
      table: channelConfig.table,
    }
    if (channelConfig.filter) {
      postgresConfig.filter = channelConfig.filter
    }

    const channel = supabase
      .channel(finalChannelName)
      .on(
        'postgres_changes' as const,
        postgresConfig as any,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (!isMountedRef.current) return

          // Call custom payload handler if provided
          if (onPayload) {
            try {
              onPayload(payload as RealtimePostgresChangesPayload<Record<string, unknown>>)
            } catch (error) {
              logError(error, 'useRealtimeChannel.onPayload')
            }
          }

          // Debounced cache invalidation
          debouncedInvalidate()
        }
      )
      .subscribe(status => {
        if (!isMountedRef.current) return

        if (status === 'SUBSCRIBED') {
          // Reset reconnect attempts on successful subscription
          reconnectAttemptsRef.current = 0
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }

          // Set up periodic health check to prevent timeouts
          if (healthCheckIntervalRef.current) {
            clearInterval(healthCheckIntervalRef.current)
          }

          healthCheckIntervalRef.current = setInterval(() => {
            if (!isMountedRef.current || !enabled) {
              if (healthCheckIntervalRef.current) {
                clearInterval(healthCheckIntervalRef.current)
                healthCheckIntervalRef.current = null
              }
              return
            }

            // Check if channel is still active
            if (channelRef.current) {
              const channelState = channelRef.current.state
              if (channelState !== 'joined' && channelState !== 'joining') {
                // Channel is not active, trigger reconnection
                logger.warn(
                  `[Realtime] Health check failed for ${table}, channel state: ${channelState}`
                )
                if (channelRef.current) {
                  try {
                    supabase.removeChannel(channelRef.current)
                  } catch (error) {
                    logError(error, 'useRealtimeChannel.healthCheck.cleanup')
                  }
                  channelRef.current = null
                }
                setReconnectTrigger(prev => prev + 1)
              }
            }
          }, HEALTH_CHECK_INTERVAL)

          // HEALTH_CHECK_INTERVAL is a constant, doesn't need to be in deps

          if (import.meta.env.DEV) {
            logger.log(`[Realtime] Subscribed to ${table}`, {
              filter,
              channelName: finalChannelName,
            })
          }
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          // Automatic reconnection with exponential backoff
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && enabled) {
            const delay = Math.min(
              INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
              MAX_RECONNECT_DELAY
            )
            reconnectAttemptsRef.current++

            logger.warn(
              `[Realtime] Channel ${status} for ${table}, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`,
              { filter, channelName: finalChannelName }
            )

            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && enabled) {
                // Clean up current channel
                if (channelRef.current) {
                  try {
                    supabase.removeChannel(channelRef.current)
                  } catch (error) {
                    logError(error, 'useRealtimeChannel.reconnect.cleanup')
                  }
                  channelRef.current = null
                }
                // Trigger reconnection by updating state
                setReconnectTrigger(prev => prev + 1)
              }
            }, delay)
          } else {
            // Max reconnect attempts reached
            logError(
              new Error(
                `Realtime channel ${status} for ${table} after ${MAX_RECONNECT_ATTEMPTS} reconnection attempts`
              ),
              'useRealtimeChannel.maxRetries'
            )
            reconnectAttemptsRef.current = 0
          }
        } else if (status === 'CHANNEL_ERROR') {
          // Log channel errors
          logError(new Error(`Realtime channel error for ${table}`), 'useRealtimeChannel.subscribe')

          // Attempt reconnection on channel errors too
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && enabled) {
            const delay = Math.min(
              INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
              MAX_RECONNECT_DELAY
            )
            reconnectAttemptsRef.current++

            logger.warn(
              `[Realtime] Channel error for ${table}, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
            )

            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && enabled) {
                if (channelRef.current) {
                  try {
                    supabase.removeChannel(channelRef.current)
                  } catch (error) {
                    logError(error, 'useRealtimeChannel.reconnect.cleanup')
                  }
                  channelRef.current = null
                }
                setReconnectTrigger(prev => prev + 1)
              }
            }, delay)
          }
        }
      })

    channelRef.current = channel

    return () => {
      isMountedRef.current = false

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // Clear health check interval
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
        healthCheckIntervalRef.current = null
      }

      // Remove channel
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          // Silently handle cleanup errors
          logError(error, 'useRealtimeChannel.unmount')
        }
        channelRef.current = null
      }

      // Reset reconnect attempts on cleanup
      reconnectAttemptsRef.current = 0
    }
    // HEALTH_CHECK_INTERVAL is a constant, doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    table,
    event,
    filter,
    schema,
    channelName,
    queryKeys,
    debouncedInvalidate,
    onPayload,
    reconnectTrigger,
  ])
}
