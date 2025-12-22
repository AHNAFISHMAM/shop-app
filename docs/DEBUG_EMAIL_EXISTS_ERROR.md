# Debug: "Email Already Exists" Error

## Problem
You're getting "An account with this email already exists" but you don't see the user in your `profiles` table.

## Root Cause
The user exists in `auth.users` (Supabase Auth table) but either:
1. Has no profile in `profiles` table
2. Has a deleted profile (email starts with `deleted_`)

Supabase Auth enforces email uniqueness, so even if the profile is deleted, the email can't be reused until the user is removed from `auth.users`.

## Solution: Check and Clean Up

### Step 1: Check if User Exists in auth.users

Run this in Supabase SQL Editor:

```sql
-- Check if email exists in auth.users
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  deleted_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 2: Check Profile Status

Run this to see the full picture:

```sql
-- See user status across both tables
SELECT * FROM v_auth_users_with_profiles 
WHERE auth_email = 'your-email@example.com';
```

### Step 3: Find All Orphaned Users

```sql
-- See all users that need cleanup
SELECT * FROM find_orphaned_auth_users();
```

### Step 4: Delete from auth.users

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to Supabase Dashboard → Authentication → Users
2. Search for the email
3. Click the user → Delete User

**Option B: Via SQL (Requires Service Role)**
```sql
-- WARNING: This requires service role permissions
-- You may need to run this via Supabase Dashboard SQL Editor with "Run as owner"
DELETE FROM auth.users 
WHERE email = 'your-email@example.com';
```

**Option C: Via Edge Function (Recommended)**
If you've deployed the Edge Function:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/delete-auth-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "user-uuid-here"}'
```

## Quick Fix Script

Run this in Supabase SQL Editor to see all problematic users:

```sql
-- View all users and their status
SELECT 
  au.email,
  CASE 
    WHEN p.id IS NULL THEN '❌ No Profile - DELETE FROM auth.users'
    WHEN p.email LIKE 'deleted_%@deleted.local' THEN '⚠️ Profile Deleted - DELETE FROM auth.users'
    WHEN p.email = au.email THEN '✅ Active'
    ELSE '⚠️ Mismatch'
  END as action_needed,
  au.id as user_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL 
   OR p.email LIKE 'deleted_%@deleted.local'
ORDER BY au.created_at DESC;
```

Then delete each user ID from `auth.users` using one of the methods above.

## Prevention

After deleting users, the Edge Function in `supabase/functions/delete-auth-user/index.ts` will automatically delete from `auth.users` when users delete their accounts in the future.

Make sure:
1. ✅ Edge Function is deployed
2. ✅ Service role key is set as secret
3. ✅ `useDeleteUserData` hook calls the Edge Function

## Related Files

- `supabase/migrations/20250203000002_check_and_cleanup_orphaned_users.sql` - Diagnostic queries
- `supabase/functions/delete-auth-user/index.ts` - Edge Function for deletion
- `src/hooks/useDeleteUserData.ts` - Hook that calls Edge Function

