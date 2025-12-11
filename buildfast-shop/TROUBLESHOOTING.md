# Troubleshooting Guide

## Common Errors and Solutions

### 1. "Invalid Refresh Token" Error

**Symptoms:**
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

**Solution:**
- This is now automatically handled by the app - it will clear invalid tokens
- If you still see this error:
  1. Clear your browser's localStorage
  2. Refresh the page
  3. Log in again

**To manually clear:**
- Open browser DevTools (F12)
- Go to Application/Storage tab
- Clear Local Storage for your domain
- Refresh the page

### 2. "Permission Denied" or 400 Error When Adding Products

**Symptoms:**
- Product insert fails with 400 error
- Error: "Permission denied" or RLS policy error

**Causes & Solutions:**

#### Cause A: User is not marked as admin

**Check:**
```sql
-- Run this in Supabase SQL Editor
SELECT id, email, is_admin 
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
WHERE u.email = 'your-email@example.com';
```

**Fix:**
```sql
-- If user doesn't exist in customers table, create entry
INSERT INTO public.customers (id, email, is_admin, created_at)
SELECT id, email, true, NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- OR update existing user to admin
UPDATE public.customers
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

#### Cause B: Customers table doesn't exist

**Check:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'customers'
);
```

**Fix:** Create the customers table:
```sql
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view own customer data"
ON public.customers FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow service role to insert/update (for triggers)
CREATE POLICY "Service role can manage customers"
ON public.customers
TO service_role
USING (true)
WITH CHECK (true);
```

#### Cause C: Products table doesn't exist

**Check:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'products'
);
```

**Fix:** Run the migration:
1. Go to Supabase SQL Editor
2. Copy contents of `supabase/migrations/001_create_products_table.sql`
3. Run the SQL

### 3. "Table does not exist" Error

**Solution:**
- Run the migration SQL files in Supabase
- Check that you're connected to the correct Supabase project
- Verify environment variables are set correctly

### 4. Products Not Showing After Adding

**Check:**
1. Open browser console (F12)
2. Look for errors in Network tab
3. Check if RLS policies allow SELECT

**Fix:** Verify RLS policies:
```sql
-- Check if public can view products
SELECT * FROM public.products LIMIT 1;
```

### 5. Environment Variables Not Set

**Check:**
```javascript
// In browser console
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

**Fix:**
Create `.env` or `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then restart the dev server.

## Quick Fixes

### Error: "Admin status fetch timeout"

**Symptoms:**
- Console shows: "Error in fetchAdminStatus: Error: Admin status fetch timeout"
- App loads but admin features don't work

**Causes:**
1. Customers table doesn't exist
2. RLS policies are blocking the query
3. User doesn't exist in customers table

**Quick Fix:**

**Step 1:** Check if customers table exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'customers'
);
```

**Step 2:** If table doesn't exist, create it:
```sql
-- Run this from supabase/migrations/002_setup_admin_user.sql
-- Or use the OPTION 1 section to create the table
```

**Step 3:** Make yourself an admin:
```sql
-- Replace with your email
INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  true, 
  NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE 
SET is_admin = true, 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name);
```

**Step 4:** Verify RLS policy allows SELECT:
```sql
-- Check if policy exists
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers' AND schemaname = 'public';
```

**Step 5:** Refresh the page and check console - error should be gone.

### Reset Admin Status for Current User

```sql
-- Make current logged-in user an admin
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  true, 
  NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE 
SET is_admin = true, 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name);
```

### Check Current User's Admin Status

```sql
-- In Supabase SQL Editor, run as authenticated user
SELECT 
  u.email,
  c.is_admin,
  c.id as customer_id
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
WHERE u.id = auth.uid();
```

### Disable RLS Temporarily (FOR TESTING ONLY)

```sql
-- ⚠️ WARNING: Only use for testing! Never in production!
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
```

## Step-by-Step Debugging

1. **Check if user is logged in:**
   - Look at browser console
   - Check Network tab for auth requests
   - Verify session exists in localStorage

2. **Check if user is admin:**
   - Run the SQL query above to check admin status
   - Make sure `is_admin = true` in customers table

3. **Check if table exists:**
   - Run the existence check SQL
   - Verify table structure matches migration

4. **Check RLS policies:**
   - Verify policies are created
   - Test with SQL queries in Supabase

5. **Check error details:**
   - Open browser console
   - Look for detailed error messages
   - Check Network tab for API responses

## Getting Help

If you're still stuck:
1. Check browser console for full error messages
2. Check Supabase dashboard → Logs for backend errors
3. Verify all migrations have been run
4. Check RLS policies in Supabase dashboard → Authentication → Policies

