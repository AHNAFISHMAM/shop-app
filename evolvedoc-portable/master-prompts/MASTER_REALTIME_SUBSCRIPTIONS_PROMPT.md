# 🔴 MASTER REAL-TIME SUBSCRIPTIONS PROMPT
## Production-Grade Real-time Data Synchronization

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing real-time subscriptions with Supabase Realtime for the **Star Café** application. It covers database setup, channel management, reusable hook patterns, multi-channel subscriptions, cache invalidation, performance optimization, error handling, and real-world examples from the codebase.

**Applicable to:**
- Real-time data synchronization (cart, orders, menu items)
- Live updates for collaborative features
- Real-time notifications and alerts
- Cache invalidation patterns with React Query
- Multi-channel subscriptions (checkout flow)
- Product availability updates
- Order status changes
- Address updates

---

## 🎯 CORE PRINCIPLES

### 1. **Channel Management**
- **Single Channel per Hook**: One channel per hook instance to avoid conflicts
- **Proper Cleanup**: Always clean up channels on unmount to prevent memory leaks
- **Automatic Reconnection**: Built-in reconnection with exponential backoff (1s → 30s max, 5 attempts)
- **Health Checks**: Periodic health monitoring every 30 minutes to prevent timeouts
- **Reconnection Handling**: Handle connection errors gracefully with automatic retry logic
- **Debounced Updates**: Debounce cache invalidations to prevent rapid, unnecessary updates
- **Channel Naming**: Use descriptive, unique channel names

### 2. **Performance Optimization**
- **Debounced Invalidation**: Prevent rapid cache invalidations (300ms default)
- **Mounted Checks**: Prevent updates after component unmounts using refs
- **Selective Filtering**: Filter events to user's data only (security + performance)
- **Pause on Background**: Pause subscriptions when app is backgrounded (optional)
- **Event Filtering**: Only subscribe to relevant events (INSERT, UPDATE, DELETE)

### 3. **Error Handling**
- **Connection Errors**: Handle connection failures gracefully
- **Silent Failures**: Don't show errors for background reconnections
- **Retry Logic**: Implement retry logic for failed connections
- **Table Existence**: Handle cases where tables don't exist or realtime isn't enabled
- **Graceful Degradation**: App should work even if realtime fails

### 4. **Security**
- **RLS Filtering**: Always filter by user_id or other RLS constraints
- **No Public Subscriptions**: Never subscribe to all data without filters
- **Validate Payloads**: Validate realtime payloads before processing
- **User Context**: Only subscribe when user is authenticated (when applicable)

---

## 🔍 PHASE 1: DATABASE SETUP

### Step 1.1: Enable Realtime on Table

**SQL Migration:**
```sql
-- Enable realtime for a table
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- Set replica identity (REQUIRED for UPDATE/DELETE events)
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;

-- Enable realtime for multiple tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
ALTER TABLE public.cart_items REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.addresses;
ALTER TABLE public.addresses REPLICA IDENTITY FULL;
```

**Why REPLICA IDENTITY FULL?**
- Required for UPDATE and DELETE events to include full row data
- Without it, UPDATE/DELETE events won't fire properly
- INSERT events work without it, but best practice is to set it

### Step 1.2: Verify Realtime Setup

**Check if Realtime is Enabled:**
```sql
-- Check publication membership
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Check replica identity
SELECT 
  tablename,
  relreplident
FROM pg_class
WHERE relname IN ('menu_items', 'orders', 'cart_items', 'addresses');
-- 'f' = FULL, 'd' = DEFAULT, 'n' = NOTHING, 'i' = INDEX
```

### Step 1.3: Database Setup Checklist

- [ ] Realtime enabled on table via `ALTER PUBLICATION`
- [ ] Replica identity set to FULL for UPDATE/DELETE events
- [ ] Table has proper indexes for performance
- [ ] RLS policies allow realtime access (if applicable)
- [ ] Migration committed to version control

---

## 🛠️ PHASE 2: REUSABLE HOOK PATTERN

### Step 2.1: useRealtimeChannel Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useRealtimeChannel.ts

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
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
  // ✅ CORRECT - Use generic type parameter for payload data
  // Note: Supabase's RealtimePostgresChangesPayload uses generic for row type
  // If you know the table structure, specify it: RealtimePostgresChangesPayload<TableRow>
  onPayload?: <T = Record<string, unknown>>(payload: RealtimePostgresChangesPayload<T>) => void
  /** Schema name (default: 'public') */
  schema?: string
}

/**
 * useRealtimeChannel hook
 *
 * Sets up a Supabase real-time subscription with automatic cleanup,
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
  const isMountedRef = useRef(true)

  // Debounced cache invalidation
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        // Invalidate all specified query keys
        queryKeys.forEach((queryKey) => {
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
    if (!enabled || !supabase) return

    // Cleanup any existing channel
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (error) {
        // Silently handle cleanup errors
        logError(error, 'useRealtimeChannel.cleanup')
      }
      channelRef.current = null
    }

    // Generate channel name if not provided
    const finalChannelName =
      channelName || `realtime-${table}-${filter || 'all'}-${Date.now()}`

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

    const channel = supabase
      .channel(finalChannelName)
      .on('postgres_changes', subscriptionConfig, (payload) => {
        if (!isMountedRef.current) return

        // Call custom payload handler if provided
        if (onPayload) {
          try {
            onPayload(payload)
          } catch (error) {
            logError(error, 'useRealtimeChannel.onPayload')
          }
        }

        // Debounced cache invalidation
        debouncedInvalidate()
      })
      .subscribe((status) => {
        if (!isMountedRef.current) return

        if (process.env.NODE_ENV === 'development') {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${table}`, { filter, channelName: finalChannelName })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn(`[Realtime] Channel status: ${status} for ${table}`, {
              filter,
              channelName: finalChannelName,
            })
          }
        }

        // Log errors in production
        if (status === 'CHANNEL_ERROR') {
          logError(new Error(`Realtime channel error for ${table}`), 'useRealtimeChannel.subscribe')
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
    }
  }, [enabled, table, event, filter, schema, channelName, queryKeys, debouncedInvalidate, onPayload])
}
```

### Step 2.2: Usage Examples

**Simple Single-Table Subscription:**
```typescript
// Subscribe to user's cart items
function CartPage() {
  const { user } = useAuth()
  
  useRealtimeChannel({
    table: 'cart_items',
    filter: `user_id=eq.${user?.id}`,
    queryKeys: [['cart', 'items', user?.id]],
    enabled: !!user?.id,
  })

  // Component implementation
}
```

**Multiple Query Keys:**
```typescript
// Invalidate multiple related queries
function OrderHistory() {
  const { user } = useAuth()
  
  useRealtimeChannel({
    table: 'orders',
    filter: `user_id=eq.${user?.id}`,
    queryKeys: [
      ['orders', 'list', user?.id],
      ['orders', 'summary', user?.id],
      ['orders', 'stats', user?.id]
    ],
    enabled: !!user?.id,
  })
}
```

**Custom Payload Handler:**
```typescript
// Handle payloads with custom logic
function MenuPage() {
  useRealtimeChannel({
    table: 'menu_items',
    event: 'UPDATE',
    queryKeys: [['menu', 'items']],
    onPayload: (payload) => {
      if (payload.new?.is_available === false) {
        toast.error('A menu item is no longer available')
      }
    },
  })
}
```

### Step 2.3: Reusable Hook Checklist

- [ ] Channel cleanup on unmount
- [ ] Debounced invalidation (300ms default)
- [ ] Mounted ref to prevent updates after unmount
- [ ] Filter to user's data only (when applicable)
- [ ] Error handling for connection issues
- [ ] Multiple related queries invalidated
- [ ] Custom payload handler support
- [ ] Debug logging (development only)
- [ ] Enabled flag for conditional subscriptions

---

## 🔄 PHASE 3: MULTI-CHANNEL SUBSCRIPTIONS

### Step 3.1: Complex Multi-Table Subscription

**Real Example: useCheckoutRealtime (from Codebase):**
```typescript
// src/pages/Checkout/hooks/useCheckoutRealtime.ts

import { useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  menu_item_id?: string
  product_id?: string
  resolvedProduct?: { id?: string } | null
  resolvedProductType?: 'menu_item' | 'dish' | 'legacy' | null
}

interface UseCheckoutRealtimeOptions {
  cartItems: CartItem[]
  user: { id: string } | null
  showPayment: boolean
  showSuccessModal: boolean
  placingOrder: boolean
  refetchCart?: () => void
  refetchAddresses?: () => void
  onProductUpdate?: (payload: unknown) => void
}

/**
 * Hook for managing real-time subscriptions in checkout
 * 
 * Subscribes to:
 * - menu_items updates (price, availability)
 * - dishes updates (price, stock)
 * - products updates (legacy)
 * - addresses updates (user's saved addresses)
 */
export function useCheckoutRealtime({
  cartItems,
  user,
  showPayment,
  showSuccessModal,
  placingOrder,
  refetchCart,
  refetchAddresses,
  onProductUpdate,
}: UseCheckoutRealtimeOptions) {
  const channelsRef = useRef<Array<ReturnType<typeof supabase.channel>>>([])

  // Subscribe to product updates (menu_items, dishes, products)
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return
    if (showPayment || showSuccessModal || placingOrder) return

    // Extract unique IDs for each product type
    const menuItemIds = [...new Set(cartItems
      .filter(item => item.menu_item_id || item.resolvedProductType === 'menu_item')
      .map(item => item.menu_item_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )]

    const dishIds = [...new Set(cartItems
      .filter(item => item.product_id || item.resolvedProductType === 'dish')
      .map(item => item.product_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )]

    const productIds = [...new Set(cartItems
      .filter(item => item.product_id || item.resolvedProductType === 'legacy')
      .map(item => item.product_id || item.resolvedProduct?.id)
      .filter(Boolean)
    )]

    const channels: Array<ReturnType<typeof supabase.channel>> = []

    // Subscribe to menu_items updates
    if (menuItemIds.length > 0) {
      try {
        const menuItemsSet = new Set(menuItemIds.map(id => String(id)))
        const menuItemsChannel = supabase
          .channel('checkout-menu-items-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'menu_items'
            },
            async (payload) => {
              const itemId = String(payload.new?.id || payload.old?.id)
              if (!menuItemsSet.has(itemId)) return
              
              logger.log('Menu item updated in checkout:', payload)
              
              // Check for price changes
              const oldPrice = payload.old?.price
              const newPrice = payload.new?.price
              
              if (oldPrice !== newPrice) {
                toast('Price updated for an item in your cart', {
                  icon: '💰',
                  duration: 4000
                })
              }
              
              // Check for availability changes
              if (payload.new?.is_available === false) {
                toast.error('An item in your cart is no longer available', {
                  icon: '⚠️',
                  duration: 5000
                })
              }
              
              // Refetch cart after delay
              if (refetchCart) {
                setTimeout(() => {
                  refetchCart()
                }, 500)
              }

              if (onProductUpdate) {
                onProductUpdate(payload)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.log('Real-time subscription active for menu_items in checkout')
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn('Real-time subscription error for menu_items (table might not exist or real-time not enabled)')
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for menu_items - retrying...')
              setTimeout(() => {
                try {
                  menuItemsChannel.subscribe()
                } catch (retryErr) {
                  logger.warn('Failed to retry menu_items subscription:', retryErr)
                }
              }, 2000)
            }
          })
        
        channels.push(menuItemsChannel)
      } catch (err) {
        // Handle table doesn't exist error
        if (err && typeof err === 'object' && 'code' in err && 
            (err.code === '42P01' || 
             (('message' in err && err.message && String(err.message).includes('does not exist'))))) {
          logger.warn('menu_items table does not exist or real-time not enabled - skipping subscription')
        } else {
          logger.warn('Failed to subscribe to menu_items updates:', err)
        }
      }
    }

    // Similar subscriptions for dishes and products...
    // (See full implementation in codebase)

    channelsRef.current = channels

    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel)
        } catch (err) {
          logger.warn('Error removing real-time channel:', err)
        }
      })
    }
  }, [cartItems, showPayment, showSuccessModal, placingOrder, refetchCart, onProductUpdate])

  // Subscribe to addresses updates (separate effect)
  useEffect(() => {
    if (!user) return
    if (showPayment || showSuccessModal || placingOrder) return
    
    try {
      const addressesChannel = supabase
        .channel('checkout-addresses-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'addresses',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            logger.log('Address updated in real-time:', payload)
            
            if (refetchAddresses) {
              setTimeout(() => {
                refetchAddresses()
              }, 500)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.log('Real-time subscription active for addresses in checkout')
          } else if (status === 'CHANNEL_ERROR') {
            logger.warn('Real-time subscription error for addresses')
          } else if (status === 'TIMED_OUT') {
            logger.warn('Real-time subscription timed out for addresses - retrying...')
            setTimeout(() => {
              try {
                addressesChannel.subscribe()
              } catch (retryErr) {
                logger.warn('Failed to retry addresses subscription:', retryErr)
              }
            }, 2000)
          }
        })
      
      return () => {
        try {
          supabase.removeChannel(addressesChannel)
        } catch (err) {
          logger.warn('Error removing addresses channel:', err)
        }
      }
    } catch (err) {
      // Handle errors gracefully
      logger.warn('Failed to subscribe to addresses updates:', err)
      return undefined
    }
  }, [user, showPayment, showSuccessModal, placingOrder, refetchAddresses])
}
```

### Step 3.2: Multi-Channel Patterns

**Pattern 1: Multiple Tables, Single Hook**
```typescript
// Subscribe to multiple related tables
function useOrderRealtime(orderId: string) {
  const queryClient = useQueryClient()
  
  // Subscribe to order updates
  useRealtimeChannel({
    table: 'orders',
    filter: `id=eq.${orderId}`,
    queryKeys: [['order', orderId]],
  })
  
  // Subscribe to order items updates
  useRealtimeChannel({
    table: 'order_items',
    filter: `order_id=eq.${orderId}`,
    queryKeys: [['order', orderId], ['order', orderId, 'items']],
  })
}
```

**Pattern 2: Conditional Subscriptions**
```typescript
// Only subscribe when certain conditions are met
function useCartRealtime() {
  const { user } = useAuth()
  const { showPayment } = useCheckoutState()
  
  useRealtimeChannel({
    table: 'cart_items',
    filter: `user_id=eq.${user?.id}`,
    queryKeys: [['cart', 'items', user?.id]],
    enabled: !!user?.id && !showPayment, // Don't subscribe during payment
  })
}
```

### Step 3.3: Multi-Channel Checklist

- [ ] Multiple channels managed in array
- [ ] Each channel has unique name
- [ ] Proper cleanup for all channels
- [ ] Error handling for each channel
- [ ] Conditional subscriptions when needed
- [ ] Separate effects for different concerns

---

## 🎯 PHASE 4: EVENT HANDLING PATTERNS

### Step 4.1: Event Type Handling

**Handle Specific Events:**
```typescript
// Only listen to UPDATE events
useRealtimeChannel({
  table: 'menu_items',
  event: 'UPDATE',
  queryKeys: [['menu', 'items']],
  onPayload: (payload) => {
    if (payload.eventType === 'UPDATE') {
      // Handle update
      console.log('Updated:', payload.new)
      console.log('Previous:', payload.old)
    }
  },
})

// Listen to INSERT and DELETE
useRealtimeChannel({
  table: 'cart_items',
  event: '*', // All events
  queryKeys: [['cart', 'items']],
  onPayload: (payload) => {
    switch (payload.eventType) {
      case 'INSERT':
        console.log('New item added:', payload.new)
        break
      case 'UPDATE':
        console.log('Item updated:', payload.new)
        break
      case 'DELETE':
        console.log('Item removed:', payload.old)
        break
    }
  },
})
```

### Step 4.2: Payload Validation

**Validate Payload Data:**
```typescript
// Validate payload before processing
useRealtimeChannel({
  table: 'orders',
  queryKeys: [['orders']],
  onPayload: (payload) => {
    // Validate payload structure
    if (!payload.new && !payload.old) {
      logger.warn('Invalid payload: missing new/old', payload)
      return
    }
    
    // Validate specific fields
    if (payload.new && !payload.new.id) {
      logger.warn('Invalid payload: missing id', payload)
      return
    }
    
    // Process valid payload
    handleOrderUpdate(payload)
  },
})
```

### Step 4.3: Event Handling Checklist

- [ ] Handle all relevant event types (INSERT, UPDATE, DELETE)
- [ ] Validate payload structure
- [ ] Check payload fields before use
- [ ] Handle missing data gracefully
- [ ] Log invalid payloads for debugging

---

## ⚡ PHASE 5: PERFORMANCE OPTIMIZATION

### Step 5.1: Debouncing Strategies

**Default Debounce (300ms):**
```typescript
// Standard debounce for most cases
useRealtimeChannel({
  table: 'cart_items',
  queryKeys: [['cart', 'items']],
  debounceMs: 300, // Default
})
```

**Faster Updates (100ms):**
```typescript
// For time-sensitive updates
useRealtimeChannel({
  table: 'orders',
  queryKeys: [['orders']],
  debounceMs: 100, // Faster updates
})
```

**Slower Updates (1000ms):**
```typescript
// For non-critical updates
useRealtimeChannel({
  table: 'analytics',
  queryKeys: [['analytics']],
  debounceMs: 1000, // Slower updates
})
```

### Step 5.2: Selective Filtering

**Filter by User:**
```typescript
// Only subscribe to user's data
useRealtimeChannel({
  table: 'orders',
  filter: `user_id=eq.${user.id}`, // Critical for security
  queryKeys: [['orders', user.id]],
})
```

**Filter by Status:**
```typescript
// Only subscribe to pending orders
useRealtimeChannel({
  table: 'orders',
  filter: `status=eq.pending`,
  queryKeys: [['orders', 'pending']],
})
```

**Filter by Multiple Conditions:**
```typescript
// Complex filter
useRealtimeChannel({
  table: 'orders',
  filter: `user_id=eq.${user.id}.and.status=in.(pending,confirmed)`,
  queryKeys: [['orders', user.id]],
})
```

### Step 5.3: Conditional Subscriptions

**Enable/Disable Based on State:**
```typescript
// Only subscribe when needed
function CheckoutPage() {
  const [showPayment, setShowPayment] = useState(false)
  
  useRealtimeChannel({
    table: 'cart_items',
    queryKeys: [['cart', 'items']],
    enabled: !showPayment, // Disable during payment
  })
}
```

**Pause on Background:**
```typescript
// Pause when tab is hidden
function useVisibilityAwareRealtime(options: UseRealtimeChannelOptions) {
  const [isVisible, setIsVisible] = useState(!document.hidden)
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  useRealtimeChannel({
    ...options,
    enabled: options.enabled && isVisible,
  })
}
```

### Step 5.4: Performance Checklist

- [ ] Debounce set appropriately (300ms default)
- [ ] Filter to user's data only
- [ ] Conditional subscriptions when possible
- [ ] Pause on background (optional)
- [ ] Only subscribe to needed events
- [ ] Clean up channels properly

---

## 🚨 PHASE 6: ERROR HANDLING

### Step 6.1: Connection Error Handling

**Automatic Reconnection (Built-in):**
The `useRealtimeChannel` hook now includes automatic reconnection:

```typescript
// Automatic reconnection is handled internally
// No manual retry logic needed in components

useRealtimeChannel({
  table: 'orders',
  filter: `user_id=eq.${user.id}`,
  queryKeys: [['orders', user.id]],
  enabled: !!user?.id,
})

// Hook automatically:
// - Detects TIMED_OUT, CLOSED, CHANNEL_ERROR
// - Reconnects with exponential backoff (1s → 30s)
// - Performs health checks every 30 minutes
// - Cleans up on unmount
```

**Manual Retry (Legacy/Reference):**
For reference, here's how manual retry was done before automatic reconnection:

```typescript
// ⚠️ NOTE: useRealtimeChannel now handles this automatically
// This is for reference only or custom implementations

.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    logger.log('Real-time subscription active')
  } else if (status === 'CHANNEL_ERROR') {
    logger.warn('Real-time subscription error (table might not exist or real-time not enabled)')
    // useRealtimeChannel handles reconnection automatically
  } else if (status === 'TIMED_OUT') {
    logger.warn('Real-time subscription timed out')
    // useRealtimeChannel handles reconnection automatically
  } else if (status === 'CLOSED') {
    logger.warn('Real-time subscription closed')
    // useRealtimeChannel handles reconnection automatically
  }
})
```

**Note:** The main `useRealtimeChannel` hook now handles all reconnection automatically. Components using this hook don't need manual retry logic.

### Step 6.2: Table Existence Handling

**Handle Missing Tables:**
```typescript
// Check if table exists before subscribing
try {
  const channel = supabase
    .channel('table-updates')
    .on('postgres_changes', { /* ... */ })
    .subscribe()
} catch (err) {
  // Handle table doesn't exist
  if (err && typeof err === 'object' && 'code' in err && 
      (err.code === '42P01' || 
       (('message' in err && err.message && String(err.message).includes('does not exist'))))) {
    logger.warn('Table does not exist or real-time not enabled - skipping subscription')
    // App continues to work without realtime
  } else {
    logger.warn('Failed to subscribe:', err)
  }
}
```

### Step 6.3: Retry Logic

**Automatic Retry (Built-in):**
The `useRealtimeChannel` hook implements automatic retry with exponential backoff:

```typescript
// ✅ RECOMMENDED - Use useRealtimeChannel (automatic retry)
useRealtimeChannel({
  table: 'orders',
  filter: `user_id=eq.${user.id}`,
  queryKeys: [['orders', user.id]],
  enabled: !!user?.id,
})

// Automatic features:
// - Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s max
// - Maximum 5 reconnection attempts
// - Health checks every 30 minutes
// - Proper cleanup on unmount
```

**Configuration:**
```typescript
// Reconnection settings (in useRealtimeChannel.ts)
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const HEALTH_CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
```

**Manual Retry (Only if needed for custom implementations):**
```typescript
// ⚠️ Only use if not using useRealtimeChannel hook
// For custom channel management outside the hook

.subscribe((status) => {
  if (status === 'TIMED_OUT') {
    const retryDelay = 2000 // 2 seconds
    setTimeout(() => {
      try {
        channel.subscribe()
      } catch (retryErr) {
        logger.warn('Retry failed:', retryErr)
        // Implement exponential backoff for production
      }
    }, retryDelay)
  }
})
```

### Step 6.4: Error Handling Checklist

- [x] Handle CHANNEL_ERROR status (automatic in useRealtimeChannel)
- [x] Handle TIMED_OUT status with retry (automatic with exponential backoff)
- [x] Handle CLOSED status (automatic reconnection)
- [x] Health checks to prevent timeouts (every 30 minutes)
- [ ] Check for table existence errors (manual validation if needed)
- [ ] Graceful degradation (app works without realtime)
- [x] Log errors for debugging (via error handler)
- [x] Don't show errors to users for background failures (silent reconnection)

---

## 🔒 PHASE 7: SECURITY PATTERNS

### Step 7.1: RLS Filtering

**Always Filter by User:**
```typescript
// ✅ CORRECT - Filter by user_id
useRealtimeChannel({
  table: 'orders',
  filter: `user_id=eq.${user.id}`, // Critical security filter
  queryKeys: [['orders', user.id]],
})

// ❌ WRONG - No filter (security risk)
useRealtimeChannel({
  table: 'orders',
  // Missing filter - could receive all orders!
  queryKeys: [['orders']],
})
```

### Step 7.2: Payload Validation

**Validate Payload Ownership:**
```typescript
// Validate payload belongs to user
onPayload: (payload) => {
  if (payload.new && payload.new.user_id !== user.id) {
    logger.warn('Received payload for different user - ignoring')
    return
  }
  
  // Process payload
  handleUpdate(payload)
}
```

### Step 7.3: Security Checklist

- [ ] Always filter by user_id (when applicable)
- [ ] Validate payload ownership
- [ ] Never subscribe to all data without filters
- [ ] Use RLS policies in database
- [ ] Validate payload structure
- [ ] Don't trust client-side data

---

## 📊 PHASE 8: REAL-WORLD EXAMPLES

### Example 1: Cart Items Realtime

**Subscribe to Cart Updates:**
```typescript
function CartPage() {
  const { user } = useAuth()
  
  useRealtimeChannel({
    table: 'cart_items',
    filter: `user_id=eq.${user?.id}`,
    queryKeys: [['cart', 'items', user?.id]],
    enabled: !!user?.id,
    onPayload: (payload) => {
      if (payload.eventType === 'DELETE') {
        toast('Item removed from cart')
      }
    },
  })
  
  // Component implementation
}
```

### Example 2: Order Status Updates

**Subscribe to Order Status:**
```typescript
function OrderPage({ orderId }: { orderId: string }) {
  useRealtimeChannel({
    table: 'orders',
    filter: `id=eq.${orderId}`,
    queryKeys: [['order', orderId]],
    event: 'UPDATE',
    onPayload: (payload) => {
      if (payload.new?.status === 'delivered') {
        toast.success('Your order has been delivered!')
      }
    },
  })
}
```

### Example 3: Menu Availability

**Subscribe to Menu Item Availability:**
```typescript
function MenuPage() {
  useRealtimeChannel({
    table: 'menu_items',
    event: 'UPDATE',
    queryKeys: [['menu', 'items']],
    onPayload: (payload) => {
      if (payload.new?.is_available === false) {
        toast.error(`${payload.new.name} is no longer available`)
      }
    },
  })
}
```

---

## 🎯 SUCCESS CRITERIA

A real-time subscription is complete when:

1. ✅ **Database Setup**: Realtime enabled, replica identity set
2. ✅ **Subscription**: Channel subscribed correctly
3. ✅ **Cleanup**: Channel cleaned up on unmount
4. ✅ **Performance**: Debounced invalidations (300ms default)
5. ✅ **Error Handling**: Connection errors handled gracefully
6. ✅ **Security**: Events filtered to user's data only
7. ✅ **Cache**: Related queries invalidated
8. ✅ **Logging**: Debug logging in development
9. ✅ **Retry**: Retry logic for timeouts
10. ✅ **Validation**: Payload validation when needed

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- Forget to clean up channels (memory leaks)
- Skip debouncing (performance issues)
- Update after unmount (React warnings)
- Subscribe to all data without filters (security risk)
- Ignore connection errors (poor UX)
- Use same channel name for multiple subscriptions (conflicts)
- Forget to set REPLICA IDENTITY FULL (UPDATE/DELETE won't work)
- Show errors to users for background failures (annoying)

### ✅ Do:

- Always clean up channels on unmount
- Debounce invalidations (300ms default)
- Check mounted state before updates
- Filter to user's data only
- Handle errors gracefully
- Use unique channel names
- Set REPLICA IDENTITY FULL
- Log errors for debugging, not user display

---

## 📚 REFERENCE

### Files in Codebase

- **Reusable Hook**: `src/hooks/useRealtimeChannel.ts` - Generic realtime hook
- **Checkout Realtime**: `src/pages/Checkout/hooks/useCheckoutRealtime.ts` - Multi-channel example
- **Supabase Client**: `src/lib/supabase.ts` - Typed Supabase client

### SQL Commands

```sql
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_name;
ALTER TABLE public.table_name REPLICA IDENTITY FULL;

-- Check realtime status
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### React Query Integration

```typescript
// Invalidate queries on realtime updates
queryClient.invalidateQueries({ queryKey: ['resource', id] })

// Invalidate multiple queries
queryKeys.forEach((queryKey) => {
  queryClient.invalidateQueries({ queryKey })
})
```

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This master prompt should be followed for ALL real-time subscription work in the Star Café application.**
