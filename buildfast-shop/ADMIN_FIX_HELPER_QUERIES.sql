-- ============================================================================
-- ADMIN FIX HELPER QUERIES
-- ============================================================================
-- Use these queries in Supabase SQL Editor to verify and fix admin status
-- ============================================================================

-- STEP 1: Verify your admin status
-- Replace 'your-email@example.com' with your actual email
-- ----------------------------------------------------------------------------
SELECT 
  u.id as user_id,
  u.email,
  c.id as customer_id,
  c.is_admin,
  CASE 
    WHEN c.id IS NULL THEN '❌ NO CUSTOMER RECORD'
    WHEN c.is_admin = true THEN '✅ IS ADMIN'
    ELSE '❌ NOT ADMIN'
  END as status
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
WHERE u.email = 'your-email@example.com';

-- STEP 2: Create/Update customer record with admin privileges
-- Replace 'your-email@example.com' with your actual email
-- ----------------------------------------------------------------------------
INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'fullName',
    split_part(u.email, '@', 1)
  ) as full_name,
  true as is_admin,
  NOW()
FROM auth.users u
WHERE u.email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE 
SET is_admin = true, 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name);

-- STEP 3: Verify RLS policies allow reading customers table
-- ----------------------------------------------------------------------------
SELECT 
  policyname, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'customers' AND schemaname = 'public';

-- STEP 4: Check all users and their admin status
-- ----------------------------------------------------------------------------
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  c.is_admin,
  c.id as has_customer_record,
  CASE 
    WHEN c.id IS NULL THEN 'No customer record'
    WHEN c.is_admin = true THEN 'Admin'
    ELSE 'Not admin'
  END as status
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
ORDER BY u.created_at DESC;

