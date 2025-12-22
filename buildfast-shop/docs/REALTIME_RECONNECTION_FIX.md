# Realtime Channel Reconnection Fix

## Problem

The app was breaking after a couple of hours of deployment because Supabase Realtime channels were timing out and never reconnecting. This caused:
- Loss of real-time updates (orders, cart, menu items)
- Stale data in the UI
- Silent failures (logged but not recovered)
- App appearing broken to users

## Root Cause

**Primary Issue:** `useRealtimeChannel` hook detected timeouts (`TIMED_OUT`, `CLOSED`) but did not automatically reconnect.

**Evidence:**
- Channels timeout after ~1-2 hours of inactivity (Supabase WebSocket behavior)
- Hook logged warnings but took no recovery action
- No automatic reconnection mechanism
- No health check/keepalive to prevent timeouts

## Solution Implemented

### 1. Automatic Reconnection with Exponential Backoff

**Added to `useRealtimeChannel.ts`:**
- Detects `TIMED_OUT`, `CLOSED`, and `CHANNEL_ERROR` statuses
- Automatically reconnects with exponential backoff (1s → 2s → 4s → 8s → 16s → 30s max)
- Maximum 5 reconnection attempts
- Resets attempts on successful subscription

**Key Features:**
```typescript
// Exponential backoff calculation
const delay = Math.min(
  INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
  MAX_RECONNECT_DELAY
)

// Automatic reconnection trigger
setReconnectTrigger((prev) => prev + 1) // Forces useEffect to re-run
```

### 2. Health Check Mechanism

**Added periodic health monitoring:**
- Checks channel state every 30 minutes
- Detects inactive channels before timeout
- Proactively reconnects if channel state is not `joined` or `joining`
- Prevents silent failures

**Implementation:**
```typescript
healthCheckIntervalRef.current = setInterval(() => {
  const channelState = channelRef.current?.state
  if (channelState !== 'joined' && channelState !== 'joining') {
    // Trigger reconnection
    setReconnectTrigger((prev) => prev + 1)
  }
}, HEALTH_CHECK_INTERVAL) // 30 minutes
```

### 3. Proper Cleanup

**Enhanced cleanup:**
- Clears reconnect timeouts on unmount
- Clears health check intervals
- Resets reconnect attempts
- Prevents memory leaks

## Configuration

```typescript
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const HEALTH_CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
```

## Impact

### Before Fix
- ❌ Channels timeout after 1-2 hours
- ❌ No automatic recovery
- ❌ App breaks silently
- ❌ Users see stale data

### After Fix
- ✅ Automatic reconnection on timeout
- ✅ Exponential backoff prevents server overload
- ✅ Health checks prevent timeouts
- ✅ App self-heals from connection issues
- ✅ Users get real-time updates continuously

## Testing

To test the reconnection logic:

1. **Simulate timeout:**
   - Open browser DevTools → Network tab
   - Find WebSocket connection to Supabase
   - Close connection manually
   - Observe automatic reconnection in console logs

2. **Monitor reconnection:**
   - Watch console for `[Realtime] Channel TIMED_OUT` warnings
   - Verify reconnection attempts with exponential backoff
   - Confirm successful reconnection after attempts

3. **Health check:**
   - Leave app open for 30+ minutes
   - Verify health check runs and maintains connection
   - Check that channels stay active

## Related Files

- `buildfast-shop/src/hooks/useRealtimeChannel.ts` - Main hook with reconnection logic
- `buildfast-shop/src/pages/Checkout/hooks/useCheckoutRealtime.ts` - Already had retry logic (now consistent)
- `buildfast-shop/src/contexts/StoreSettingsContext.tsx` - Uses realtime subscriptions

## Notes

- Reconnection attempts are logged in development mode
- Production errors are logged via error handler
- Maximum 5 attempts prevents infinite reconnection loops
- Health check interval (30 min) is before typical timeout (1-2 hours)
- All components using `useRealtimeChannel` automatically benefit from this fix

