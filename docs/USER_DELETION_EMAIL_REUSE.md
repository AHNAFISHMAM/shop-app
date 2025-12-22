# User Deletion & Email Reuse Fix

## Problem
When users delete their accounts, the profile data is anonymized but the user remains in `auth.users`. This prevents the email from being reused for new signups because Supabase Auth enforces email uniqueness.

## Solution
We've implemented a complete solution that:
1. Properly deletes users from `auth.users` when they delete their account
2. Provides better error messages during signup
3. Includes cleanup tools for existing orphaned users

## Implementation

### 1. Database Migration
Run the migration to add helper functions:
```sql
-- File: supabase/migrations/20250203000000_fix_user_deletion_auth_cleanup.sql
```

This adds:
- `check_user_exists(email)` - Check if a user exists in auth.users

### 2. Edge Function
Deploy the Edge Function to handle auth user deletion:
```typescript
-- File: supabase/functions/delete-auth-user/index.ts
```

**Deployment:**
```bash
supabase functions deploy delete-auth-user
```

**Environment Variables Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (from Supabase dashboard)

### 3. Updated Delete Hook
The `useDeleteUserData` hook now:
1. Calls the RPC function to anonymize profile data
2. Calls the Edge Function to delete from `auth.users`
3. Signs out the user

### 4. Improved Signup Error Handling
The signup function now:
- Detects when an email is already registered
- Checks if it's a deleted user
- Provides helpful error messages

## Cleanup Existing Orphaned Users

### Step 1: Identify Orphaned Users
Run in Supabase SQL Editor:
```sql
SELECT * FROM v_orphaned_auth_users;
```

This shows users in `auth.users` whose profiles are deleted.

### Step 2: Delete Orphaned Users
For each orphaned user, call the Edge Function:

**Using curl:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/delete-auth-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "user-uuid-here"}'
```

**Or create a script:**
```typescript
// Cleanup script
const orphanedUsers = await supabase
  .from('v_orphaned_auth_users')
  .select('id')

for (const user of orphanedUsers.data) {
  await fetch(`${SUPABASE_URL}/functions/v1/delete-auth-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: user.id }),
  })
}
```

## Testing

### Test User Deletion
1. Create a test account
2. Delete the account
3. Verify:
   - Profile is anonymized (email starts with `deleted_`)
   - User is removed from `auth.users` (check via SQL or Edge Function logs)
   - Email can be reused for new signup

### Test Signup with Existing Email
1. Try to sign up with an email that was previously deleted
2. Should succeed if deletion worked properly
3. If it fails, check Edge Function logs for errors

## Troubleshooting

### Edge Function Not Working
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function secrets
- Check Edge Function logs in Supabase dashboard
- Ensure the function is deployed: `supabase functions deploy delete-auth-user`

### Email Still Can't Be Reused
1. Check if user exists in `auth.users`:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'test@example.com';
   ```
2. If user exists, manually delete via Edge Function
3. Verify deletion:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'test@example.com';
   -- Should return no rows
   ```

### Permission Errors
- Edge Function requires service role key (not anon key)
- Database functions use `SECURITY DEFINER` to access `auth.users`
- Ensure RLS policies allow authenticated users to execute functions

## Best Practices

1. **Always delete from auth.users** when deleting user accounts
2. **Use Edge Functions** for operations requiring service role
3. **Monitor orphaned users** periodically using the view
4. **Test email reuse** after implementing deletion
5. **Log deletion operations** for audit trail

## Related Files

- `supabase/migrations/20250203000000_fix_user_deletion_auth_cleanup.sql`
- `supabase/migrations/20250203000001_cleanup_orphaned_auth_users.sql`
- `supabase/functions/delete-auth-user/index.ts`
- `src/hooks/useDeleteUserData.ts`
- `src/lib/supabase.ts`

