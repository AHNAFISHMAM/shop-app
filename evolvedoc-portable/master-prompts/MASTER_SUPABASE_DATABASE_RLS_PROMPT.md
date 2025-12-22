# 🗄️ MASTER SUPABASE DATABASE & RLS PROMPT
## Production-Grade Database Schema, Security, and Query Development Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to designing, implementing, and securing Supabase database schemas with Row-Level Security (RLS) policies. It covers schema design, migrations, RLS policies, query optimization, security best practices, and TypeScript integration.

**Applicable to:**
- Database schema design and migrations
- Row-Level Security (RLS) policy creation
- Query optimization and indexing
- Database functions and triggers
- Real-time subscriptions setup
- TypeScript type generation
- Security auditing and testing
- Performance optimization

---

## 🎯 CORE PRINCIPLES

### 1. **Security First**
- **RLS is MANDATORY** - All tables must have RLS enabled
- **Principle of Least Privilege** - Users get minimum required permissions
- **Defense in Depth** - Multiple security layers (RLS + client-side validation)
- **WITH CHECK clauses** - Always use for UPDATE and INSERT policies
- **Never trust client-side** - RLS provides the real security

### 2. **Data Ownership Model**
- **User-Owned Data**: Users can only modify their own data
- **Partner Read-Only Access**: Partners can VIEW but NOT modify each other's data (for collaborative features)
- **Admin-Only Access**: Certain tables are read-only for users, write-only for admins
- **Public Read-Only**: Some tables (like `modules`, `resources`) are readable by all authenticated users

### 3. **Query Optimization**
- **Indexes**: Create indexes for frequently queried columns
- **Selective Queries**: Only select needed columns
- **Efficient Joins**: Use proper foreign keys and indexes
- **Pagination**: Use `.range()` for large datasets
- **Error Handling**: Always handle Supabase errors gracefully

### 4. **Type Safety**
- **TypeScript Types**: Generate types from database schema
- **Type-Safe Queries**: Use typed Supabase client
- **Interface Definitions**: Define clear interfaces for query results

---

## 🔍 PHASE 1: SCHEMA DESIGN & PLANNING

### Step 1.1: Understand Requirements
```
1. Identify the data entities and relationships
2. Determine data ownership (user-owned, partner-shared, admin-managed, public)
3. Identify access patterns (read/write permissions)
4. Plan for future scalability
5. Consider data privacy and GDPR requirements
6. Plan for soft deletes if needed
```

### Step 1.2: Design Schema Structure
```
1. Define tables and columns
2. Set up foreign key relationships
3. Define constraints (NOT NULL, UNIQUE, CHECK)
4. Plan indexes for performance
5. Design for RLS (include user_id columns where needed)
6. Plan for timestamps (created_at, updated_at)
7. Consider JSONB columns for flexible data
```

### Step 1.3: Research Best Practices
**Research Sources:**
1. **Supabase Documentation**
   - Schema design patterns
   - RLS policy patterns
   - Performance optimization
   - URL: https://supabase.com/docs

2. **PostgreSQL Best Practices**
   - Index strategies
   - Query optimization
   - Constraint design
   - URL: https://www.postgresql.org/docs/

3. **Security Best Practices**
   - OWASP Database Security
   - RLS policy patterns
   - SQL injection prevention
   - URL: https://owasp.org/

4. **Database Design Patterns**
   - Normalization (1NF, 2NF, 3NF)
   - Denormalization strategies
   - Soft delete patterns
   - Audit logging patterns

### Step 1.4: Plan RLS Policies
```
For each table, determine:
1. Who can SELECT (read)?
2. Who can INSERT (create)?
3. Who can UPDATE (modify)?
4. Who can DELETE (remove)?
5. Are there partner access requirements?
6. Are there admin-only operations?
7. What are the WITH CHECK requirements?
```

---

## 🛠️ PHASE 2: MIGRATION CREATION

### Step 2.1: Migration File Structure
```
File naming: YYYYMMDDHHMMSS_descriptive_name.sql
Location: supabase/migrations/

Example: 20250201000009_ensure_user_data_security.sql
```

### Step 2.2: Migration Template
```sql
-- =============================================
-- [Migration Title]
-- =============================================
-- Description: [What this migration does]
-- Date: [YYYY-MM-DD]
-- Related: [Related migrations or issues]

BEGIN;

-- =============================================
-- 1. CREATE TABLE (if new table)
-- =============================================
CREATE TABLE IF NOT EXISTS public.table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- other columns
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_table_name_user_id 
  ON public.table_name(user_id);

-- =============================================
-- 3. ENABLE RLS
-- =============================================
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================
-- SELECT policy
CREATE POLICY "Users can view own [resource]"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own [resource]"
  ON public.table_name FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own [resource]"
  ON public.table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy (if needed)
CREATE POLICY "Users can delete own [resource]"
  ON public.table_name FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 5. CREATE TRIGGERS (if needed)
-- =============================================
-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. COMMENTS (documentation)
-- =============================================
COMMENT ON TABLE public.table_name IS 'Description of table purpose';
COMMENT ON POLICY "Users can view own [resource]" ON public.table_name IS 
  'Users can only view their own [resource]. Partner access is read-only via separate policy.';

COMMIT;
```

### Step 2.3: Migration Checklist
- [ ] Migration file named correctly (timestamp prefix)
- [ ] BEGIN/COMMIT transaction blocks
- [ ] Table created with proper constraints
- [ ] Foreign keys defined with ON DELETE CASCADE
- [ ] Indexes created for frequently queried columns
- [ ] RLS enabled on table
- [ ] All RLS policies created (SELECT, INSERT, UPDATE, DELETE as needed)
- [ ] WITH CHECK clauses on UPDATE and INSERT policies
- [ ] Triggers created (updated_at, etc.)
- [ ] Comments added for documentation
- [ ] Tested in development environment

---

## 🔒 PHASE 3: RLS POLICY PATTERNS

### Pattern 1: User-Owned Data (Private)
**Use Case**: Data that belongs to a single user, no partner access
**Examples**: `user_checklist_progress`, `user_module_progress`, `budgets`, `mahr`

```sql
-- SELECT: Users can only view their own data
CREATE POLICY "Users can view own [resource]"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own data
CREATE POLICY "Users can insert own [resource]"
  ON public.table_name FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own data
CREATE POLICY "Users can update own [resource]"
  ON public.table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)  -- Can only update if it's theirs
  WITH CHECK (auth.uid() = user_id);  -- Must remain theirs after update

-- DELETE: Users can only delete their own data
CREATE POLICY "Users can delete own [resource]"
  ON public.table_name FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Pattern 2: Partner Read-Only Access
**Use Case**: Partners can VIEW but NOT modify each other's data
**Examples**: `profiles`, `user_discussion_answers`

```sql
-- SELECT: Users can view their own data + partner's data (read-only)
CREATE POLICY "Users can view own [resource]"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id  -- Own data
    OR
    -- Partner access (read-only)
    EXISTS (
      SELECT 1 FROM public.couples c
      WHERE (c.user1_id = auth.uid() AND c.user2_id = user_id)
         OR (c.user2_id = auth.uid() AND c.user1_id = user_id)
      AND c.status = 'active'
    )
  );

-- INSERT/UPDATE/DELETE: Only own data (no partner modification)
CREATE POLICY "Users can insert own [resource]"
  ON public.table_name FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own [resource]"
  ON public.table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own [resource]"
  ON public.table_name FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Pattern 3: Admin-Only Write Access
**Use Case**: All authenticated users can read, only admins can write
**Examples**: `modules`, `lessons`, `checklist_categories`, `resources`

```sql
-- SELECT: All authenticated users can read
CREATE POLICY "Anyone can view [resource]"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: Admins only
CREATE POLICY "Admins can manage [resource]"
  ON public.table_name FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

### Pattern 4: Couple-Shared Data
**Use Case**: Both partners can read and write
**Examples**: `couples` table

```sql
-- SELECT: Users can view couples they are part of
CREATE POLICY "Users can view own couple"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- UPDATE: Both partners can update
CREATE POLICY "Users can update own couple"
  ON public.table_name FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  )
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );
```

### Pattern 5: Bidirectional Access
**Use Case**: Users can access data where they are either sender or receiver
**Examples**: `partner_invitations`

```sql
-- SELECT: Users can view invitations they sent or received
CREATE POLICY "Users can view own invitations"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (
    auth.uid() = inviter_id  -- Sent by user
    OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email  -- Received by user
  );

-- UPDATE: Users can update invitations they sent or received
CREATE POLICY "Users can update own invitations"
  ON public.table_name FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = inviter_id
    OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  )
  WITH CHECK (
    auth.uid() = inviter_id
    OR
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = invitee_email
  );
```

### RLS Policy Checklist
- [ ] RLS enabled on table
- [ ] SELECT policy created
- [ ] INSERT policy created (if needed)
- [ ] UPDATE policy created (if needed)
- [ ] DELETE policy created (if needed)
- [ ] WITH CHECK clauses on UPDATE and INSERT
- [ ] Partner access handled correctly (read-only)
- [ ] Admin access handled correctly (if applicable)
- [ ] Policies tested with different user contexts
- [ ] Comments added to policies

---

## 📊 PHASE 4: QUERY IMPLEMENTATION

### Step 4.1: Query Patterns

#### Pattern 1: Simple Select
```typescript
// ✅ CORRECT - Type-safe, error handling
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .maybeSingle()

if (error) {
  logError(error, 'useProfile')
  throw error
}

return data
```

#### Pattern 2: Select with Joins
```typescript
// ✅ CORRECT - Nested select for relationships
const { data, error } = await supabase
  .from('checklist_categories')
  .select(`
    *,
    checklist_items (
      *,
      user_checklist_progress (*)
    )
  `)
  .order('sort_order')

if (error) {
  logError(error, 'Checklist.fetchChecklist')
  throw error
}

// Type-safe handling of nested relations
return (data || []).map(cat => ({
  ...cat,
  checklist_items: Array.isArray(cat.checklist_items) 
    ? cat.checklist_items 
    : [],
}))
```

#### Pattern 3: Insert with Error Handling
```typescript
// ✅ CORRECT - Error handling, user_id from auth context
const { data, error } = await supabase
  .from('user_checklist_progress')
  .insert({
    user_id: user.id,  // Always from auth context
    item_id: itemId,
    is_completed: true,
  })
  .select()
  .single()

if (error) {
  logError(error, 'Checklist.toggleItem')
  throw error
}

return data
```

#### Pattern 4: Update with Error Handling
```typescript
// ✅ CORRECT - Error handling, user_id from auth context
const { data, error } = await supabase
  .from('profiles')
  .update({
    first_name: firstName,
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id)  // Always from auth context
  .select()
  .single()

if (error) {
  logError(error, 'useUpdateProfile')
  throw error
}

return data
```

#### Pattern 5: Delete with Error Handling
```typescript
// ✅ CORRECT - Error handling, user_id from auth context
const { error } = await supabase
  .from('user_resource_favorites')
  .delete()
  .eq('user_id', user.id)  // Always from auth context
  .eq('resource_id', resourceId)

if (error) {
  logError(error, 'useFavoriteResources.removeFavorite')
  throw error
}
```

#### Pattern 6: Pagination
```typescript
// ✅ CORRECT - Pagination with range
const { data, error, count } = await supabase
  .from('resources')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(page * pageSize, (page + 1) * pageSize - 1)

if (error) {
  logError(error, 'Resources.fetchResources')
  throw error
}

return { data: data || [], count: count || 0 }
```

#### Pattern 7: Complex Query with Filters
```typescript
// ✅ CORRECT - Multiple filters, ordering
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_read', false)
  .order('created_at', { ascending: false })
  .limit(50)

if (error) {
  logError(error, 'useNotifications')
  throw error
}

return data || []
```

### Step 4.2: Query Best Practices

#### ✅ DO:
- Always check for errors
- Use `.maybeSingle()` when expecting 0 or 1 result
- Use `.single()` when expecting exactly 1 result
- Use `.eq('user_id', user.id)` from auth context (never accept user_id as parameter)
- Use TypeScript types from `Database` type
- Handle null/undefined results gracefully
- Use `.select()` with specific columns when possible
- Use indexes for frequently filtered columns
- Use `.range()` for pagination
- Log errors with context

#### ❌ DON'T:
- Accept `user_id` as a parameter (security risk)
- Ignore errors
- Use `SELECT *` when you only need specific columns
- Forget to handle null/undefined results
- Skip error logging
- Use client-side filtering when database filtering is possible
- Create N+1 queries (use joins instead)

### Step 4.3: Query Checklist
- [ ] Error handling implemented
- [ ] User ID from auth context (not parameter)
- [ ] TypeScript types used
- [ ] Null/undefined handling
- [ ] Error logging with context
- [ ] Efficient query (indexes used, selective columns)
- [ ] Pagination for large datasets
- [ ] Proper use of `.single()`, `.maybeSingle()`, or array results

---

## 🔐 PHASE 5: SECURITY IMPLEMENTATION

### Step 5.1: Security Checklist

#### Database Level
- [ ] RLS enabled on all tables
- [ ] All policies have WITH CHECK clauses (for UPDATE/INSERT)
- [ ] No policies allow users to modify other users' data
- [ ] Partner access is read-only (SELECT only)
- [ ] Admin functions use SECURITY DEFINER
- [ ] Triggers prevent privilege escalation
- [ ] Foreign keys have ON DELETE CASCADE where appropriate

#### Application Level
- [ ] All queries use `user.id` from auth context
- [ ] No hooks accept `user_id` as parameter (except admin)
- [ ] Route protection implemented
- [ ] Client-side validation (but not trusted)
- [ ] Error messages don't leak sensitive information

### Step 5.2: Security Testing
```typescript
// Test RLS policies:
// 1. Log in as User A
// 2. Attempt to query User B's data
// 3. Verify RLS blocks unauthorized access

// Example test:
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', otherUserId)  // Should fail if not authorized

// Should return empty or error, not other user's data
```

### Step 5.3: Common Security Pitfalls

#### ❌ INSECURE:
```typescript
// ❌ WRONG - Accepts user_id as parameter
export function useProfile(userId?: string) {
  return useQuery({
    queryFn: async () => {
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)  // Security risk!
    }
  })
}
```

#### ✅ SECURE:
```typescript
// ✅ CORRECT - Uses authenticated user ID
export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryFn: async () => {
      if (!user?.id) return null
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)  // Always from auth context
        .maybeSingle()
    }
  })
}
```

---

## ⚡ PHASE 6: PERFORMANCE OPTIMIZATION

### Step 6.1: Index Creation
```sql
-- ✅ CORRECT - Index on frequently queried column
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON public.profiles(user_id);

-- ✅ CORRECT - Composite index for multi-column queries
CREATE INDEX IF NOT EXISTS idx_checklist_progress_user_item 
  ON public.user_checklist_progress(user_id, item_id);

-- ✅ CORRECT - Index on foreign key
CREATE INDEX IF NOT EXISTS idx_checklist_items_category_id 
  ON public.checklist_items(category_id);
```

### Step 6.2: Query Optimization
```typescript
// ✅ CORRECT - Select only needed columns
const { data } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, email')  // Specific columns
  .eq('id', user.id)

// ✅ CORRECT - Use indexes
const { data } = await supabase
  .from('user_checklist_progress')
  .select('*')
  .eq('user_id', user.id)  // Indexed column
  .eq('item_id', itemId)   // Indexed column

// ✅ CORRECT - Limit results
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .limit(50)  // Limit large datasets
```

### Step 6.3: Performance Checklist
- [ ] Indexes created for frequently queried columns
- [ ] Composite indexes for multi-column queries
- [ ] Foreign keys indexed
- [ ] Queries use indexed columns in WHERE clauses
- [ ] Pagination implemented for large datasets
- [ ] Only select needed columns
- [ ] Avoid N+1 queries (use joins)
- [ ] Use `.range()` for pagination

---

## 🔄 PHASE 7: REAL-TIME SETUP

### Step 7.1: Enable Realtime
```sql
-- Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_name;

-- Set replica identity (required for UPDATE/DELETE events)
ALTER TABLE public.table_name REPLICA IDENTITY FULL;
```

### Step 7.2: Realtime Subscription Pattern

**Recommended: Use `useRealtimeChannel` Hook**
```typescript
// ✅ RECOMMENDED - Use reusable hook with automatic reconnection
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'

function MyComponent() {
  const { user } = useAuth()
  
  // Automatic reconnection, health checks, and cleanup built-in
  useRealtimeChannel({
    table: 'table_name',
    filter: `user_id=eq.${user.id}`,
    queryKeys: [['table_name', user.id]],
    enabled: !!user?.id,
  })
  
  // ... rest of component
}
```

**Manual Pattern (if not using hook):**
```typescript
// ⚠️ Manual pattern - use useRealtimeChannel hook instead when possible
useEffect(() => {
  if (!user?.id || !supabase) return

  const channel = supabase
    .channel('table_name_changes')
    .on(
      'postgres_changes',
      {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'table_name',
        filter: `user_id=eq.${user.id}`,  // Filter to user's data
      },
      (payload) => {
        // Invalidate React Query cache
        queryClient.invalidateQueries({ queryKey: ['table_name', user.id] })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user?.id, queryClient])
```

**Note:** The `useRealtimeChannel` hook includes:
- Automatic reconnection with exponential backoff
- Health checks every 30 minutes to prevent timeouts
- Proper cleanup on unmount
- Debounced cache invalidation
- Error handling for connection issues

See [MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md](./MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md) for complete details.

### Step 7.3: Realtime Checklist
- [ ] Realtime enabled on table
- [ ] Replica identity set to FULL
- [ ] Use `useRealtimeChannel` hook (recommended) or manual subscription
- [ ] Subscription filters to user's data
- [ ] Automatic reconnection enabled (built into hook)
- [ ] Health checks configured (built into hook)
- [ ] Cleanup on unmount
- [ ] Debounced cache invalidation (built into hook)
- [ ] Error handling for connection issues (built into hook)

---

## 📝 PHASE 8: TYPE GENERATION

### Step 8.1: Generate Types
```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Step 8.2: Use Types in Queries
```typescript
import type { Database } from '../types/database'

// ✅ CORRECT - Typed Supabase client
const supabase = createClient<Database>(url, key)

// ✅ CORRECT - Type-safe query
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .maybeSingle()

// data is typed as Database['public']['Tables']['profiles']['Row'] | null
```

### Step 8.3: Type Safety Checklist
- [ ] Types generated from database schema
- [ ] Supabase client typed with Database type
- [ ] Query results properly typed
- [ ] Interfaces defined for complex query results
- [ ] Types updated after schema changes

---

## 🧪 PHASE 9: TESTING & VERIFICATION

### Step 9.1: Manual Testing
```
1. Test as regular user:
   - Can read own data ✅
   - Can write own data ✅
   - Cannot read other users' data ✅
   - Cannot write other users' data ✅

2. Test as partner:
   - Can read partner's data (if applicable) ✅
   - Cannot write partner's data ✅

3. Test as admin:
   - Can read admin-managed tables ✅
   - Can write admin-managed tables ✅
```

### Step 9.2: SQL Testing
```sql
-- Test RLS policy (run as different users)
-- 1. Set role to test user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';

-- 2. Test query
SELECT * FROM public.profiles WHERE id = 'other-user-uuid';
-- Should return empty if RLS is working

-- 3. Test own data
SELECT * FROM public.profiles WHERE id = 'user-uuid-here';
-- Should return data
```

### Step 9.3: Testing Checklist
- [ ] RLS policies tested with different users
- [ ] Partner access tested (read-only)
- [ ] Admin access tested
- [ ] Error handling tested
- [ ] Performance tested (query speed)
- [ ] Real-time subscriptions tested
- [ ] Migration tested in development

---

## 📚 REFERENCE PATTERNS

### Complete Migration Example
```sql
-- =============================================
-- Create User Notes Table
-- =============================================
BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id 
  ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_created_at 
  ON public.user_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notes"
  ON public.user_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.user_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.user_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.user_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.user_notes IS 'User notes table - private to each user';
COMMENT ON POLICY "Users can view own notes" ON public.user_notes IS 
  'Users can only view their own notes. No partner access.';

COMMIT;
```

### Complete Hook Example
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logError } from '../lib/error-handler'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../types/database'

type UserNote = Database['public']['Tables']['user_notes']['Row']

export function useUserNotes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-notes', user?.id],
    queryFn: async (): Promise<UserNote[]> => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logError(error, 'useUserNotes')
        throw error
      }

      return (data || []) as UserNote[]
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  })
}

export function useCreateNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (note: { title: string; content?: string }) => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('user_notes')
        .insert({
          user_id: user.id,
          title: note.title,
          content: note.content,
        })
        .select()
        .single()

      if (error) {
        logError(error, 'useCreateNote')
        throw error
      }

      return data as UserNote
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes', user?.id] })
    },
  })
}
```

---

## 🎯 SUCCESS CRITERIA

A database schema/RLS implementation is complete when:

1. ✅ **Schema**: Tables created with proper constraints and indexes
2. ✅ **RLS**: All tables have RLS enabled with appropriate policies
3. ✅ **Security**: WITH CHECK clauses on all UPDATE/INSERT policies
4. ✅ **Queries**: Type-safe queries with error handling
5. ✅ **Performance**: Indexes created for frequently queried columns
6. ✅ **Real-time**: Realtime enabled where needed
7. ✅ **Types**: TypeScript types generated and used
8. ✅ **Testing**: RLS policies tested with different users
9. ✅ **Documentation**: Comments added to tables and policies
10. ✅ **Migration**: Migration file created and tested

---

## 🚨 COMMON PITFALLS

### ❌ Don't:
- Disable RLS in production
- Accept user_id as parameter
- Skip WITH CHECK clauses
- Forget to index foreign keys
- Ignore error handling
- Use SELECT * when specific columns needed
- Create policies that allow users to modify other users' data
- Skip testing RLS policies

### ✅ Do:
- Always enable RLS
- Use user.id from auth context
- Include WITH CHECK clauses
- Create indexes for performance
- Handle all errors
- Select only needed columns
- Test policies thoroughly
- Document policies with comments

---

## 🔐 PHASE 10: ADVANCED RLS PATTERNS

### Pattern 6: Guest Checkout Support
**Use Case**: Allow unauthenticated users to create orders (e-commerce)
**Examples**: `orders`, `order_items` tables

```sql
-- ✅ CORRECT - Allow public (unauthenticated) users to create orders
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  TO public  -- Note: 'public' includes both authenticated and anon
  WITH CHECK (true);

-- ✅ CORRECT - Users can view own orders, guests can view by session
CREATE POLICY "Users and guests can view own orders"
  ON public.orders FOR SELECT
  TO public
  USING (
    (user_id = auth.uid())  -- Authenticated users
    OR 
    (is_guest = TRUE AND guest_session_id IS NOT NULL)  -- Guest users
  );

-- ✅ CORRECT - Order items accessible for accessible orders
CREATE POLICY "Users and guests can view order items for accessible orders"
  ON public.order_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()  -- Authenticated user's order
        OR 
        orders.is_guest = TRUE  -- Guest order
      )
    )
  );
```

**Key Points:**
- Use `TO public` instead of `TO authenticated` for guest access
- Guest orders should have `is_guest = TRUE` and `guest_session_id`
- Always validate guest access through parent table (orders)
- Client-side filtering by `guest_session_id` for security

### Pattern 7: Verified Purchase Reviews
**Use Case**: Users can only review products they've purchased
**Examples**: `product_reviews` table

```sql
-- ✅ CORRECT - Users can create reviews only for purchased products
CREATE POLICY "Users can create reviews for purchased products"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE oi.id = order_item_id
        AND oi.product_id = product_id
        AND (
          o.user_id = auth.uid()  -- Authenticated user
          OR 
          (o.user_id IS NULL AND o.customer_email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
          ))  -- Guest order matched to user email
        )
        AND o.status IN ('delivered', 'shipped', 'processing')
    )
  );

-- ✅ CORRECT - Public can view non-hidden reviews
CREATE POLICY "Public can view non-hidden reviews"
  ON public.product_reviews FOR SELECT
  TO public
  USING (is_hidden = false);

-- ✅ CORRECT - Users can view all their own reviews (including hidden)
CREATE POLICY "Users can view own reviews"
  ON public.product_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

**Key Points:**
- Verify purchase through `order_items` and `orders` join
- Support both authenticated and guest orders
- Check order status (only delivered/shipped orders can be reviewed)
- Use `is_hidden` flag for admin moderation

### Pattern 8: Guest Reservations
**Use Case**: Allow unauthenticated users to create reservations
**Examples**: `table_reservations` table

```sql
-- ✅ CORRECT - Anyone can create reservations
CREATE POLICY "Anyone can create reservations"
  ON public.table_reservations FOR INSERT
  TO public
  WITH CHECK (true);

-- ✅ CORRECT - Users can view own reservations (by user_id)
CREATE POLICY "Users can view own reservations"
  ON public.table_reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ✅ CORRECT - Public can view reservations (client-side filtering by email)
CREATE POLICY "Public can view reservations by email"
  ON public.table_reservations FOR SELECT
  TO public
  USING (true);  -- Client-side filtering by email for security

-- ✅ CORRECT - Users can cancel own pending/confirmed reservations
CREATE POLICY "Users can cancel own reservations"
  ON public.table_reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status IN ('pending', 'confirmed')  -- Can only cancel pending/confirmed
  );
```

**Key Points:**
- Allow public INSERT for guest reservations
- Use client-side filtering for guest SELECT (by email)
- Restrict UPDATE to specific statuses (pending/confirmed)
- `user_id` can be NULL for guest reservations

### Pattern 9: Admin-Only Management
**Use Case**: Admins can manage all records, users can only view/update own
**Examples**: `orders`, `reservations`, `product_reviews`

```sql
-- ✅ CORRECT - Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ✅ CORRECT - Admins can update any order
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ✅ CORRECT - Admins can delete any order
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

**Key Points:**
- Check admin status via `customers.is_admin` flag
- Use `EXISTS` subquery for admin check (more efficient than JOIN)
- Apply admin policies AFTER user policies (PostgreSQL evaluates in order)
- Always include WITH CHECK for UPDATE policies

---

## 🛠️ PHASE 11: RPC FUNCTIONS & SECURITY

### Step 11.1: Creating Secure RPC Functions

RPC functions should:
- Validate all inputs server-side
- Use `SECURITY DEFINER` only when necessary
- Return clear error messages
- Handle edge cases gracefully

#### Example: Atomic Order Creation
```sql
-- ✅ CORRECT - Atomic order creation with validation
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _user_id UUID,
  _customer_email TEXT,
  _customer_name TEXT,
  _shipping_address JSONB,
  _items JSONB,
  _subtotal NUMERIC DEFAULT NULL,
  _discount_code_id UUID DEFAULT NULL,
  _discount_amount NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  _order_id UUID;
  _calculated_subtotal NUMERIC(10,2) := 0;
  _order_total NUMERIC(10,2);
  _item JSONB;
  _item_price NUMERIC(10,2);
  _item_quantity INTEGER;
  _item_product_id UUID;
  _item_menu_item_id UUID;
  _menu_item_available BOOLEAN;
BEGIN
  -- Validate inputs
  IF _customer_email IS NULL OR _customer_email = '' THEN
    RAISE EXCEPTION 'customer_email is required';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items array cannot be empty';
  END IF;

  -- Calculate subtotal from items (server-side for security)
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_price_input := NULLIF(_item->>'price_at_purchase', '')::NUMERIC;
    _item_quantity := (_item->>'quantity')::INTEGER;
    _item_menu_item_id := NULLIF(_item->>'menu_item_id', '')::UUID;

    -- Validate menu item exists and is available
    IF _item_menu_item_id IS NOT NULL THEN
      SELECT price, is_available
      INTO _item_price, _menu_item_available
      FROM menu_items
      WHERE id = _item_menu_item_id;

      IF _item_price IS NULL THEN
        RAISE EXCEPTION 'Menu item % not found', _item_menu_item_id;
      END IF;

      IF NOT COALESCE(_menu_item_available, FALSE) THEN
        RAISE EXCEPTION 'Menu item % is not available', _item_menu_item_id;
      END IF;
    END IF;

    -- Override client price with server price (security)
    IF _item_price_input IS NOT NULL AND ABS(_item_price - _item_price_input) > 0.01 THEN
      RAISE NOTICE 'Client price %.2f overridden by catalog price %.2f',
        _item_price_input, _item_price;
    END IF;

    _calculated_subtotal := _calculated_subtotal + (_item_price * _item_quantity);
  END LOOP;

  -- Calculate order total
  _order_total := _calculated_subtotal - COALESCE(_discount_amount, 0);
  IF _order_total < 0 THEN
    _order_total := 0;
  END IF;

  -- Create the order
  INSERT INTO public.orders (
    user_id,
    customer_email,
    customer_name,
    shipping_address,
    order_total,
    status
  ) VALUES (
    _user_id,
    _customer_email,
    _customer_name,
    _shipping_address,
    _order_total,
    'pending'
  )
  RETURNING id INTO _order_id;

  -- Insert order items
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      quantity,
      price_at_purchase
    ) VALUES (
      _order_id,
      NULLIF(_item->>'menu_item_id', '')::UUID,
      (_item->>'quantity')::INTEGER,
      _item_price  -- Use server-calculated price
    );
  END LOOP;

  RETURN _order_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_order_with_items(
  UUID, TEXT, TEXT, JSONB, JSONB, NUMERIC, UUID, NUMERIC
) TO anon, authenticated;
```

**Key Points:**
- Always validate inputs (NULL checks, empty arrays)
- Recalculate prices server-side (never trust client)
- Check availability before creating order
- Use transactions (implicit in function)
- Return clear error messages
- Grant permissions to `anon` and `authenticated` as needed

#### Example: Reservation Creation with Validation
```sql
-- ✅ CORRECT - Reservation creation with duplicate checking
CREATE OR REPLACE FUNCTION public.create_reservation(
  _user_id UUID,
  _customer_name TEXT,
  _customer_email TEXT,
  _customer_phone TEXT,
  _reservation_date DATE,
  _reservation_time TIME,
  _party_size INTEGER,
  _special_requests TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  _reservation_id UUID;
  _existing_count INTEGER;
BEGIN
  -- Validate inputs
  IF _customer_name IS NULL OR _customer_name = '' THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;

  IF _party_size < 1 OR _party_size > 20 THEN
    RAISE EXCEPTION 'party_size must be between 1 and 20';
  END IF;

  -- Check if reservation is in the past
  IF _reservation_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot make reservations for past dates';
  END IF;

  IF _reservation_date = CURRENT_DATE AND _reservation_time < CURRENT_TIME THEN
    RAISE EXCEPTION 'Cannot make reservations for past times';
  END IF;

  -- Check for duplicate reservations (same email, date, time within 30 minutes)
  SELECT COUNT(*) INTO _existing_count
  FROM table_reservations
  WHERE customer_email = _customer_email
    AND reservation_date = _reservation_date
    AND ABS(EXTRACT(EPOCH FROM (reservation_time - _reservation_time))) < 1800
    AND status IN ('pending', 'confirmed');

  IF _existing_count > 0 THEN
    RAISE EXCEPTION 'You already have a reservation around this time. Please choose a different time.';
  END IF;

  -- Create the reservation
  INSERT INTO public.table_reservations (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    reservation_date,
    reservation_time,
    party_size,
    special_requests,
    status
  ) VALUES (
    _user_id,
    _customer_name,
    _customer_email,
    _customer_phone,
    _reservation_date,
    _reservation_time,
    _party_size,
    _special_requests,
    'pending'
  )
  RETURNING id INTO _reservation_id;

  RETURN _reservation_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_reservation(
  UUID, TEXT, TEXT, TEXT, DATE, TIME, INTEGER, TEXT
) TO anon, authenticated;
```

**Key Points:**
- Validate all required fields
- Check business rules (past dates, party size limits)
- Prevent duplicates (same email, date, time window)
- Return clear error messages
- Use `anon` permission for guest reservations

### Step 11.2: RPC Function Security Checklist
- [ ] All inputs validated (NULL checks, type checks, range checks)
- [ ] Business rules enforced (availability, duplicates, limits)
- [ ] Server-side calculations (prices, totals)
- [ ] Clear error messages (user-friendly)
- [ ] Permissions granted appropriately (`anon`, `authenticated`)
- [ ] `SECURITY DEFINER` only when necessary
- [ ] Functions tested with edge cases
- [ ] Comments added for documentation

---

## 📊 PHASE 12: REAL-WORLD MIGRATION EXAMPLES

### Example 1: Orders Table with Guest Support
**From**: `buildfast-shop/supabase/migrations/011_create_orders_tables.sql`

```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL for guests
  customer_email TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  order_total DECIMAL(10, 2) NOT NULL CHECK (order_total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Allow users to create their own orders (or guest orders)
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);  -- NULL for guests

-- Policy: Allow users to delete their own pending orders
CREATE POLICY "Users can delete own pending orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Admins can update orders
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

**Key Learnings:**
- `user_id` can be NULL for guest orders
- Use `customer_email` for guest identification
- Status enum with CHECK constraint
- Admin policies use `EXISTS` subquery
- WITH CHECK clauses on all UPDATE/INSERT policies

### Example 2: Reviews Table with Verified Purchase
**From**: `buildfast-shop/supabase/migrations/019_create_reviews_table.sql`

```sql
-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_review_per_order_item UNIQUE (order_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_hidden ON public.product_reviews(is_hidden);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view non-hidden reviews
CREATE POLICY "Public can view non-hidden reviews"
  ON public.product_reviews FOR SELECT
  TO public
  USING (is_hidden = false);

-- Policy: Users can view all their own reviews (including hidden)
CREATE POLICY "Users can view own reviews"
  ON public.product_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create reviews for purchased products
CREATE POLICY "Users can create reviews for purchased products"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE oi.id = order_item_id
        AND oi.product_id = product_id
        AND (o.user_id = auth.uid() OR (o.user_id IS NULL AND o.customer_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )))
        AND o.status IN ('delivered', 'shipped', 'processing')
    )
  );

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all reviews (including hidden)
CREATE POLICY "Admins can view all reviews"
  ON public.product_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

**Key Learnings:**
- UNIQUE constraint prevents duplicate reviews per order item
- Verify purchase through JOIN with `order_items` and `orders`
- Support both authenticated and guest orders
- Use `is_hidden` flag for moderation
- Public can view non-hidden, users can view all their own

### Example 3: Reservations with Guest Support
**From**: `buildfast-shop/supabase/migrations/025_create_reservations_table.sql`

```sql
-- Create table_reservations table
CREATE TABLE IF NOT EXISTS public.table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL for guests
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
  table_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_user_id
  ON public.table_reservations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_customer_email
  ON public.table_reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_reservations_datetime
  ON public.table_reservations(reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON public.table_reservations(status);

-- Enable RLS
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create reservations
CREATE POLICY "Anyone can create reservations"
  ON public.table_reservations FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can view own reservations
CREATE POLICY "Users can view own reservations"
  ON public.table_reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Public can view reservations (client-side filtering by email)
CREATE POLICY "Public can view reservations by email"
  ON public.table_reservations FOR SELECT
  TO public
  USING (true);  -- Client-side filtering for security

-- Policy: Users can cancel own pending/confirmed reservations
CREATE POLICY "Users can cancel own reservations"
  ON public.table_reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status IN ('pending', 'confirmed')
  );

-- Policy: Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON public.table_reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );
```

**Key Learnings:**
- Partial index on `user_id` (WHERE user_id IS NOT NULL)
- Composite index on `(reservation_date, reservation_time)` for availability checks
- Public INSERT for guest reservations
- Client-side filtering for guest SELECT (by email)
- Status-based UPDATE restrictions (only pending/confirmed can be cancelled)

---

## 🔍 PHASE 13: MIGRATION BEST PRACTICES

### Step 13.1: Idempotent Migrations
Always make migrations idempotent (safe to run multiple times):

```sql
-- ✅ CORRECT - Idempotent table creation
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns
);

-- ✅ CORRECT - Idempotent column addition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'table_name'
    AND column_name = 'new_column'
  ) THEN
    ALTER TABLE public.table_name ADD COLUMN new_column TEXT;
  END IF;
END $$;

-- ✅ CORRECT - Idempotent policy creation
DROP POLICY IF EXISTS "Policy name" ON public.table_name;
CREATE POLICY "Policy name"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (condition);
```

### Step 13.2: Migration Organization
- Use timestamp prefix: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Group related changes in one migration
- Use transaction blocks (BEGIN/COMMIT)
- Add comments explaining purpose
- Include verification queries (commented out)

### Step 13.3: Migration Checklist
- [ ] Migration file named correctly (timestamp prefix)
- [ ] BEGIN/COMMIT transaction blocks
- [ ] Idempotent operations (IF NOT EXISTS, DROP IF EXISTS)
- [ ] Table created with proper constraints
- [ ] Foreign keys defined with appropriate ON DELETE
- [ ] Indexes created for frequently queried columns
- [ ] RLS enabled on table
- [ ] All RLS policies created with WITH CHECK clauses
- [ ] Triggers created (updated_at, etc.)
- [ ] Comments added for documentation
- [ ] Tested in development environment
- [ ] Verification queries included (commented)

---

## 🎯 SUCCESS CRITERIA (EXPANDED)

A database schema/RLS implementation is complete when:

1. ✅ **Schema**: Tables created with proper constraints and indexes
2. ✅ **RLS**: All tables have RLS enabled with appropriate policies
3. ✅ **Security**: WITH CHECK clauses on all UPDATE/INSERT policies
4. ✅ **Queries**: Type-safe queries with error handling
5. ✅ **Performance**: Indexes created for frequently queried columns
6. ✅ **Real-time**: Realtime enabled where needed
7. ✅ **Types**: TypeScript types generated and used
8. ✅ **Testing**: RLS policies tested with different users
9. ✅ **Documentation**: Comments added to tables and policies
10. ✅ **Migration**: Migration file created and tested
11. ✅ **Guest Support**: Guest access patterns implemented (if needed)
12. ✅ **RPC Functions**: Server-side validation and business logic
13. ✅ **Admin Access**: Admin policies for management operations
14. ✅ **Idempotency**: Migrations safe to run multiple times

---

## 🚨 COMMON PITFALLS (EXPANDED)

### ❌ Don't:
- Disable RLS in production
- Accept user_id as parameter
- Skip WITH CHECK clauses
- Forget to index foreign keys
- Ignore error handling
- Use SELECT * when specific columns needed
- Create policies that allow users to modify other users' data
- Skip testing RLS policies
- Trust client-side price calculations
- Allow public INSERT without validation
- Forget to handle NULL user_id for guests
- Skip server-side validation in RPC functions
- Use `SECURITY DEFINER` unnecessarily
- Create non-idempotent migrations

### ✅ Do:
- Always enable RLS
- Use user.id from auth context
- Include WITH CHECK clauses
- Create indexes for performance
- Handle all errors
- Select only needed columns
- Test policies thoroughly
- Document policies with comments
- Recalculate prices server-side
- Validate all inputs in RPC functions
- Support guest users where appropriate
- Use partial indexes for nullable columns
- Make migrations idempotent
- Add verification queries to migrations

---

---

## 🔧 Schema Alignment Best Practices

**Critical Rule:** Code must match actual database schema exactly. Mismatches cause runtime errors (400/404 Bad Request).

### Common Schema Mismatches to Avoid

**Table Name Corrections:**
- ❌ `products` → ✅ `menu_items`
- ❌ `dishes` → ✅ `menu_items`
- ❌ `reservations` → ✅ `table_reservations`

**Column Corrections:**
- ❌ `stock_quantity` (integer) → ✅ `is_available` (boolean) for menu_items
- ❌ `payment_status` in orders → ✅ (removed, column doesn't exist)
- ❌ `customer_phone` in orders → ✅ (removed, column doesn't exist)
- ❌ `order_number` → ✅ (doesn't exist, use `id` instead)
- ❌ `total_amount` → ✅ `order_total`
- ❌ `guest_name` in reservations → ✅ `customer_name`

### Backward Compatibility Pattern

Some code uses a fallback pattern for table names:
1. Try `menu_items` first (current schema)
2. Fall back to `dishes` or `products` if table doesn't exist (legacy support)

This allows gradual migration. **New code should use `menu_items` directly.**

**Example:**
```typescript
// ✅ CORRECT: Try menu_items first, fallback for legacy
try {
  const { data } = await supabase.from('menu_items').select('*')
} catch (error) {
  // Fallback to legacy table if menu_items doesn't exist
  const { data } = await supabase.from('dishes').select('*')
}
```

### Type Definition Sync Process

**When Schema Changes:**
1. Regenerate types: `supabase gen types typescript --local > src/lib/database.types.ts`
2. Verify all queries match type definitions
3. Remove non-existent columns from types
4. Update all code references to match actual schema
5. Test queries to ensure no 400/404 errors

**Verification Checklist:**
- [ ] All `.from()` calls use correct table names
- [ ] All `.select()` calls use existing columns
- [ ] TypeScript types match actual database schema
- [ ] No references to removed columns
- [ ] All queries tested and working

### Example: Schema Alignment Fix

```typescript
// ❌ INCORRECT (causes 400 Bad Request):
const { data } = await supabase
  .from('products')  // Table doesn't exist
  .select('stock_quantity, payment_status')  // Columns don't exist
  .eq('id', productId)

// ✅ CORRECT (matches actual schema):
const { data } = await supabase
  .from('menu_items')  // Correct table name
  .select('is_available')  // Correct column name
  .eq('id', productId)
```

### Schema Alignment Best Practices

**Critical Rule:** Code must match actual database schema exactly.

**Common Mismatches to Avoid:**

- ❌ `products` → ✅ `menu_items`
- ❌ `dishes` → ✅ `menu_items`
- ❌ `reservations` → ✅ `table_reservations`
- ❌ `stock_quantity` → ✅ `is_available` (boolean)
- ❌ `payment_status` → ✅ (removed, doesn't exist in orders table)
- ❌ `customer_phone` in orders → ✅ (removed, doesn't exist)

**Type Definition Sync:**

Always update `src/lib/database.types.ts` when schema changes:

1. Regenerate types: `supabase gen types typescript --local > src/lib/database.types.ts`
2. Verify all queries match type definitions
3. Remove non-existent columns from types
4. Update all documentation examples to reflect actual schema

**Verification Checklist:**

- [ ] All table names match actual database tables
- [ ] All column names match actual database columns
- [ ] All `.select()` calls use existing columns
- [ ] TypeScript types match actual database schema
- [ ] No references to removed columns
- [ ] All queries tested and working

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

### Version 1.1 - 2025-01-20
**Trigger:** Database Schema Alignment Fixes
**Changes:**
- Added "Schema Alignment Best Practices" section
- Documented common table/column name mismatches
- Added type definition sync process
- Included verification checklist
**Files Changed:** Multiple files updated to match actual Supabase schema
**Pattern:** Code must exactly match database schema to prevent runtime errors

---

**This master prompt should be followed for ALL Supabase database and RLS development work.**

