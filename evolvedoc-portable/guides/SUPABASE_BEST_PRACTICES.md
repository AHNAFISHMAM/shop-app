# Supabase Best Practices Guide

## 📋 Overview

Best practices for using Supabase in production applications, based on real-world patterns from buildfast-shop.

---

## 🔐 Database Design

### Row Level Security (RLS)

**Always enable RLS on sensitive tables:**

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own orders
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Type-Safe Database Client

**Real Example from buildfast-shop:**

```typescript
// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

// Now all queries are type-safe
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
// data is automatically typed as Order[]
```

---

## 🔄 Real-time Subscriptions

### Reusable Real-time Hook

**Real Example from buildfast-shop:**

```typescript
// src/hooks/useRealtimeChannel.ts
export function useRealtimeChannel({
  table,
  event = '*',
  filter,
  queryKeys,
  enabled = true,
  debounceMs = 300,
}: UseRealtimeChannelOptions) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    if (!enabled) return
    
    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on('postgres_changes', {
        event,
        schema: 'public',
        table,
        ...(filter && { filter }),
      }, (payload: unknown) => {
        // Type-safe payload handling
        const typedPayload = payload as {
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }
        
        // Debounced cache invalidation
        setTimeout(() => {
          queryKeys.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey })
          })
        }, debounceMs)
      })
      .subscribe((status) => {
        // Handle connection status
        if (status === 'SUBSCRIBED') {
          logger.log(`Subscribed to ${table}`)
        } else if (status === 'TIMED_OUT') {
          logger.warn(`Subscription to ${table} timed out`)
        }
      })
    
    channelRef.current = channel
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, event, filter, enabled, queryKeys, queryClient, debounceMs])
}
```

**Key Features:**
- Automatic cleanup
- Debounced cache invalidation
- Type-safe payloads
- Connection status monitoring
- React Query integration

### Multiple Channel Management

**Real Example from buildfast-shop checkout:**

```typescript
// src/pages/Checkout/hooks/useCheckoutRealtime.ts
export function useCheckoutRealtime({
  cartItems,
  user,
  showPayment,
  placingOrder,
  refetchCart,
  refetchAddresses,
}: UseCheckoutRealtimeOptions) {
  const channelsRef = useRef<Array<ReturnType<typeof supabase.channel>>>([])
  
  useEffect(() => {
    if (!user || showPayment || placingOrder) return
    
    const channels: Array<ReturnType<typeof supabase.channel>> = []
    
    // Cart updates channel
    const cartChannel = supabase
      .channel('checkout-cart-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload: unknown) => {
        if (refetchCart) {
          setTimeout(() => refetchCart(), 500) // Debounced
        }
      })
      .subscribe()
    
    // Addresses updates channel
    const addressesChannel = supabase
      .channel('checkout-addresses-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'addresses',
        filter: `user_id=eq.${user.id}`,
      }, (payload: unknown) => {
        if (refetchAddresses) {
          setTimeout(() => refetchAddresses(), 500)
        }
      })
      .subscribe()
    
    channels.push(cartChannel, addressesChannel)
    channelsRef.current = channels
    
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [user, showPayment, placingOrder, refetchCart, refetchAddresses])
}
```

---

## 💾 Storage Patterns

### File Upload with Error Handling

```typescript
// Upload with progress and error handling
async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<{ url: string } | { error: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (error) {
      logger.error('Upload error:', error)
      return { error: error.message }
    }
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    return { url: urlData.publicUrl }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed'
    return { error: errorMessage }
  }
}
```

---

## 🔍 Query Patterns

### Type-Safe Queries

```typescript
// Always use Database types for type safety
import type { Database } from '@/lib/database.types'

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']

// Select with type safety
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

if (error) {
  logger.error('Failed to fetch orders:', error)
  return []
}

// orders is typed as Order[]
return orders || []
```

### Error Handling Pattern

```typescript
// Consistent error handling
async function fetchUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    logger.error('Failed to fetch orders:', {
      userId,
      error: error.message,
      code: error.code,
    })
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }
  
  return data || []
}
```

---

## 🎯 Best Practices Summary

1. **Always Enable RLS**: Protect sensitive data with row-level security
2. **Type Safety**: Use generated Database types for all queries
3. **Error Handling**: Always check for errors and log them
4. **Cleanup Subscriptions**: Remove channels on component unmount
5. **Debounce Updates**: Debounce cache invalidations to prevent spam
6. **Connection Monitoring**: Monitor subscription status and reconnect
7. **Environment Validation**: Validate environment variables on startup
8. **Storage Security**: Use signed URLs for private files
9. **Query Optimization**: Use select() to fetch only needed columns
10. **Pagination**: Implement pagination for large datasets

---

## 📚 Related Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- EvolveDoc: `master-prompts/MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`

---

**Last Updated:** 2025-01-27  
**Version:** 1.4.0  
**Based on:** buildfast-shop Supabase implementation

