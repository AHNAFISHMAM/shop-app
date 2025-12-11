-- ============================================================================
-- MANUAL MIGRATION: Make User an Admin
-- ============================================================================
-- This file contains SQL commands to check and fix existing user records
-- to grant admin privileges. Run these commands MANUALLY in Supabase SQL Editor.
--
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address!
-- ============================================================================

-- STEP 1: Check if your user exists and has a customer record
-- ----------------------------------------------------------------------------
-- Run this query first to see the current state of your account
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  c.id as customer_id,
  c.full_name,
  c.is_admin,
  c.created_at as customer_created,
  CASE
    WHEN c.id IS NULL THEN '❌ NO CUSTOMER RECORD - Need to create one'
    WHEN c.is_admin = true THEN '✅ Already an admin'
    WHEN c.is_admin = false THEN '⚠️  Has customer record but NOT admin'
    ELSE '❓ Unknown state'
  END as status
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
WHERE u.email = 'your-email@example.com';  -- ⚠️  REPLACE WITH YOUR EMAIL!


-- STEP 2: Create customer record AND grant admin privileges
-- ----------------------------------------------------------------------------
-- This command will:
-- 1. Create a customer record if it doesn't exist
-- 2. Set is_admin = true
-- 3. Use your existing auth.users data for the record

INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'fullName',
    split_part(u.email, '@', 1)  -- Fallback to username part of email
  ) as full_name,
  true as is_admin,  -- 👈 Grant admin privileges
  u.created_at
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- ⚠️  REPLACE WITH YOUR EMAIL!
ON CONFLICT (id) DO UPDATE
  SET is_admin = true;  -- Update existing record to admin


-- STEP 3: Verify the change was successful
-- ----------------------------------------------------------------------------
-- Run this to confirm you're now an admin
SELECT
  u.email,
  c.is_admin,
  c.full_name,
  CASE
    WHEN c.is_admin = true THEN '✅ SUCCESS! You are now an admin'
    ELSE '❌ Something went wrong'
  END as result
FROM auth.users u
JOIN public.customers c ON c.id = u.id
WHERE u.email = 'your-email@example.com';  -- ⚠️  REPLACE WITH YOUR EMAIL!


-- ============================================================================
-- BONUS: Make multiple users admin at once
-- ============================================================================
-- If you need to make multiple users admin, use this query instead:

/*
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
  u.created_at
FROM auth.users u
WHERE u.email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
)
ON CONFLICT (id) DO UPDATE
  SET is_admin = true;
*/


-- ============================================================================
-- TROUBLESHOOTING: View all users and their admin status
-- ============================================================================
-- Run this to see ALL users in your system and their admin status

/*
SELECT
  u.email,
  u.created_at as signup_date,
  c.is_admin,
  c.full_name,
  CASE
    WHEN c.id IS NULL THEN '❌ Missing customer record'
    WHEN c.is_admin = true THEN '✅ Admin'
    WHEN c.is_admin = false THEN '👤 Regular user'
  END as user_type
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
ORDER BY u.created_at DESC;
*/
