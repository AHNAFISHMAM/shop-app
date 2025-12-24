# STEP 7: Supabase Setup

## 📋 What This Step Does

Sets up Supabase backend integration including database, authentication, storage, and real-time subscriptions. This step is optional but recommended for projects using Supabase.

**⭐ Before starting:** Ensure you have a Supabase account and project created.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I'm setting up Supabase in my project. Please:

1. Create environment variable template (.env.example):
   - VITE_SUPABASE_URL=your-project-url
   - VITE_SUPABASE_ANON_KEY=your-anon-key
   - VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional, for server-side)

2. Create Supabase client configuration file:
   - src/lib/supabase.ts or src/lib/supabaseClient.ts
   - Initialize Supabase client with environment variables
   - Export client for use throughout the app

3. Set up TypeScript types:
   - Generate types from Supabase: npx supabase gen types typescript --local > src/lib/database.types.ts
   - Or create manual type definitions if not using Supabase CLI

4. Create authentication utilities (if using auth):
   - src/lib/auth.ts or src/features/auth/
   - Sign up, sign in, sign out functions
   - Session management

5. Create database utilities:
   - src/lib/db.ts or src/features/database/
   - Common query patterns
   - Error handling for database operations

6. Set up real-time subscriptions (if needed):
   - src/hooks/useRealtime.ts or similar
   - Channel management patterns
   - Cleanup on unmount

7. Add Supabase to package.json dependencies:
   - @supabase/supabase-js (latest version)

8. Create README section for Supabase setup:
   - Instructions for getting Supabase credentials
   - Environment variable setup
   - Database schema setup (if applicable)

My project path is: [YOUR_PROJECT_PATH]
My Supabase project URL: [YOUR_SUPABASE_URL] (or leave blank if not set up yet)
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] `.env.example` file exists with Supabase variables
- [ ] Supabase client file exists and exports client
- [ ] TypeScript types file exists (database.types.ts or similar)
- [ ] `@supabase/supabase-js` is in package.json dependencies
- [ ] Environment variables are documented in README
- [ ] Supabase client can be imported and used
- [ ] Type definitions are available for database tables

---

## 📝 Manual Steps (if needed)

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client

**Real Example from buildfast-shop:**

```typescript
// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import type { Database } from './database.types'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Always log environment variable errors (critical for setup)
  logger.error('Missing Supabase environment variables!')
  logger.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  logger.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

// Create Supabase client with better error handling
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Clear invalid tokens automatically
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)
```

**Key Features:**
- Type-safe with Database types
- Environment variable validation with logging
- Auth configuration for session persistence
- Cross-platform storage handling

### 3. Generate TypeScript Types

```bash
# If using Supabase CLI
npx supabase gen types typescript --local > src/lib/database.types.ts

# Or manually create types based on your schema
```

### 4. Set Up Environment Variables

```bash
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# .env (create from .env.example)
cp .env.example .env
# Then fill in your actual values
```

---

## 🎯 Common Patterns

### Database Query Pattern

```typescript
// Example: Fetching data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value')

if (error) {
  console.error('Error:', error)
  return
}

// Use data
```

### Authentication Pattern

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Sign out
await supabase.auth.signOut()
```

### Real-time Subscription Pattern

**Real Example from buildfast-shop (useRealtimeChannel hook):**

```typescript
// src/hooks/useRealtimeChannel.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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
      .subscribe()
    
    channelRef.current = channel
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, event, filter, enabled, queryKeys, queryClient, debounceMs])
}

// Usage example:
useRealtimeChannel({
  table: 'orders',
  filter: `user_id=eq.${user.id}`,
  queryKeys: [['orders', user.id], ['order-summary', user.id]],
  enabled: !!user?.id,
})
```

**Key Features:**
- Automatic cleanup on unmount
- Debounced cache invalidation
- Type-safe payload handling
- React Query integration

---

## 🔗 Next Steps

After completing this step:

1. **STEP_8_PAYMENT_INTEGRATION.md** - If using payment processing
2. **STEP_5_VERIFY_SETUP.md** - Verify your setup works
3. Continue with your application development

---

## 📚 Related Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- EvolveDoc: `master-prompts/MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md`
- EvolveDoc: `master-prompts/MASTER_SUPABASE_DATABASE_RLS_PROMPT.md`

---

**Note:** This step is optional. Skip if your project doesn't use Supabase.

