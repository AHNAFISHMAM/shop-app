# Real-time Connection Troubleshooting Guide

## 📋 Overview

Common issues with real-time subscriptions (Supabase Realtime, WebSockets, etc.) and their solutions.

---

## 🔴 Common Issues

### Connection Not Establishing

**Symptoms:**
- Subscriptions not receiving updates
- Connection timeout errors
- Channel not subscribing

**Solutions:**

1. **Check Real-time Enabled:**
```sql
-- In Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

2. **Verify Channel Name:**
```typescript
// Use unique channel names
const channel = supabase.channel(`unique-channel-${Date.now()}`)
```

3. **Check Network:**
```typescript
// Add connection timeout
const channel = supabase
  .channel('my-channel')
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected')
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Connection error')
    }
  })
```

---

### Connection Drops Frequently

**Symptoms:**
- Intermittent disconnections
- Need to reconnect often
- Timeout errors

**Solutions:**

1. **Implement Reconnection Logic (Real Example from buildfast-shop):**

```typescript
// From useRealtimeChannel.ts
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const reconnectAttemptsRef = useRef(0)

const channel = supabase
  .channel(channelName)
  .on('postgres_changes', { /* ... */ })
  .subscribe((status) => {
    if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1),
          MAX_RECONNECT_DELAY
        )
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setReconnectTrigger(prev => prev + 1) // Trigger reconnection
          }
        }, delay)
      } else {
        logger.warn('Max reconnection attempts reached')
      }
    } else if (status === 'SUBSCRIBED') {
      reconnectAttemptsRef.current = 0 // Reset on successful connection
    }
  })
```

2. **Add Health Checks:**
```typescript
// Periodic health check
setInterval(() => {
  if (channel.state !== 'joined') {
    channel.subscribe()
  }
}, 30000) // Every 30 seconds
```

3. **Handle Network Changes:**
```typescript
window.addEventListener('online', () => {
  // Reconnect when network comes back
  channel.subscribe()
})
```

---

### Memory Leaks from Subscriptions

**Symptoms:**
- Multiple subscriptions active
- Performance degradation
- Browser memory usage increasing

**Solutions:**

1. **Always Clean Up (Real Example from buildfast-shop):**

```typescript
// From useCheckoutRealtime.ts
const channelsRef = useRef<Array<ReturnType<typeof supabase.channel>>>([])

useEffect(() => {
  if (!user || showPayment || placingOrder) return
  
  const channels: Array<ReturnType<typeof supabase.channel>> = []
  
  // Create multiple channels
  const cartChannel = supabase
    .channel('checkout-cart-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cart_items',
      filter: `user_id=eq.${user.id}`,
    }, (payload: unknown) => {
      // Handle cart updates
      if (refetchCart) {
        setTimeout(() => refetchCart(), 500) // Debounced
      }
    })
    .subscribe()
  
  channels.push(cartChannel)
  channelsRef.current = channels
  
  // Cleanup all channels
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current = []
  }
}, [user, showPayment, placingOrder, refetchCart])
```

**Key Points:**
- Track all channels in a ref
- Clean up all channels on unmount
- Check conditions before subscribing
- Debounce refetch calls

2. **Use Refs for Cleanup:**
```typescript
const channelRef = useRef<RealtimeChannel | null>(null)

useEffect(() => {
  channelRef.current = supabase.channel('my-channel')
    .subscribe()
  
  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
  }
}, [])
```

3. **Check for Duplicate Subscriptions:**
```typescript
// Prevent duplicate subscriptions
const isSubscribedRef = useRef(false)

useEffect(() => {
  if (isSubscribedRef.current) return
  
  isSubscribedRef.current = true
  const channel = supabase.channel('my-channel')
    .subscribe()
  
  return () => {
    isSubscribedRef.current = false
    supabase.removeChannel(channel)
  }
}, [])
```

---

### Windows-Specific Issues

**Symptoms:**
- File watching not working
- Connection issues on Windows
- Path resolution errors

**Solutions:**

1. **Use Polling for File Watching:**
```typescript
// Vite config
server: {
  watch: {
    usePolling: true,
    interval: 100,
  },
}
```

2. **Check Firewall:**
- Allow Node.js through Windows Firewall
- Check antivirus isn't blocking connections

3. **Path Resolution:**
```typescript
// Use path.resolve for cross-platform
import path from 'path'
const configPath = path.resolve(__dirname, 'config.json')
```

---

### Payload Type Errors

**Symptoms:**
- TypeScript errors with payload types
- Unknown type errors
- Type assertion issues

**Solutions:**

1. **Type Payload Properly (Real Example from buildfast-shop):**

```typescript
// From Checkout.tsx - addresses subscription
const addressesChannel = supabase
  .channel('checkout-addresses-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'addresses',
    filter: `user_id=eq.${user.id}`,
  }, async (payload: unknown) => {
    const typedPayload = payload as {
      new?: Record<string, unknown>
      old?: Record<string, unknown>
    }
    
    logger.log('Address updated in checkout:', typedPayload)
    
    // Refetch addresses (debounced)
    if (refetchAddresses) {
      setTimeout(() => {
        refetchAddresses()
      }, 500)
    }
    
    // Update selected address if it was the one updated
    if (
      selectedSavedAddress &&
      (typedPayload.new as SavedAddress)?.id === selectedSavedAddress?.id
    ) {
      handleSelectSavedAddress(typedPayload.new as SavedAddress)
    }
  })
  .subscribe()
```

**Key Points:**
- Cast `unknown` to typed structure
- Use type assertions for nested properties
- Handle both `new` and `old` payload properties
- Type guard before accessing properties

2. **Use Type Guards:**
```typescript
function isPostgresPayload(
  payload: unknown
): payload is RealtimePostgresChangesPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'new' in payload
  )
}
```

---

## 🛠️ Debugging Tips

### 1. Enable Debug Logging

```typescript
// Supabase client with debug
const supabase = createClient(url, key, {
  realtime: {
    log_level: 'debug',
  },
})
```

### 2. Check Connection Status

```typescript
channel.subscribe((status) => {
  console.log('Channel status:', status)
  // SUBSCRIBED, TIMED_OUT, CHANNEL_ERROR, etc.
})
```

### 3. Monitor Network Tab

- Check WebSocket connections in browser DevTools
- Verify messages are being sent/received
- Check for connection errors

### 4. Test with Simple Subscription

```typescript
// Minimal test subscription
const testChannel = supabase
  .channel('test')
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log('Test received:', payload)
  })
  .subscribe()

// Send test
testChannel.send({
  type: 'broadcast',
  event: 'test',
  payload: { message: 'Hello' },
})
```

---

## 📚 Related Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- EvolveDoc: `master-prompts/MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md`
- EvolveDoc: `troubleshooting/WINDOWS_COMPATIBILITY.md`

---

## 💡 Best Practices

1. **Always Clean Up**: Remove channels on unmount
2. **Handle Errors**: Implement error handling and reconnection
3. **Type Safety**: Use proper TypeScript types for payloads
4. **Monitor Status**: Check subscription status regularly
5. **Test Locally**: Test real-time features in development
6. **Rate Limiting**: Be mindful of subscription limits
7. **Security**: Use RLS policies for real-time subscriptions

---

**Last Updated:** 2025-01-27  
**Version:** 1.4.0

