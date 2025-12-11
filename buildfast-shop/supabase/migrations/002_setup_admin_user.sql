-- Migration: Setup Admin User Helper
-- Description: Helper queries to set up admin users
-- 
-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with your actual email
-- 2. Run the appropriate query based on your situation

-- ============================================
-- OPTION 1: Make existing user an admin
-- ============================================
-- Use this if you already have a user account

-- First, check if customers table exists, if not create it
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,  -- Allow NULL for existing users who might not have full_name
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists with NOT NULL constraint, alter it to allow NULL
DO $$ 
BEGIN
  ALTER TABLE public.customers ALTER COLUMN full_name DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already be nullable or constraint doesn't exist
    NULL;
END $$;

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own customer data" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON public.customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;

-- Allow users to view their own customer data
CREATE POLICY "Users can view own customer data"
ON public.customers FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to update their own customer data (limited)
CREATE POLICY "Users can update own customer data"
ON public.customers FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow service role full access (for triggers and migrations)
CREATE POLICY "Service role can manage customers"
ON public.customers
TO service_role
USING (true)
WITH CHECK (true);

-- Now make your user an admin (REPLACE THE EMAIL!)
-- Run this query with your email:
INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,  -- Use metadata or email as fallback
  true, 
  NOW()
FROM auth.users
WHERE email = 'your-email@example.com'  -- ⚠️ CHANGE THIS EMAIL!
ON CONFLICT (id) DO UPDATE 
SET is_admin = true, 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name);  -- Preserve existing full_name if new one is NULL

-- ============================================
-- OPTION 2: Check your admin status
-- ============================================
-- Run this to see if you're an admin (must be logged in)

-- For authenticated users:
SELECT 
  u.email,
  u.id as user_id,
  c.is_admin,
  c.id as customer_id,
  CASE 
    WHEN c.id IS NULL THEN 'Not in customers table'
    WHEN c.is_admin = true THEN 'Is Admin ✓'
    ELSE 'Not Admin'
  END as status
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
WHERE u.id = auth.uid();

-- ============================================
-- OPTION 3: List all users and their admin status
-- ============================================
-- Run this in Supabase SQL Editor as service role

SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  c.is_admin,
  c.id as has_customer_record
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
ORDER BY u.created_at DESC;

-- ============================================
-- OPTION 4: Make ALL existing users admins (for testing only)
-- ============================================
-- ⚠️ WARNING: Use only for development/testing!

INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,  -- Use metadata or email as fallback
  true, 
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET is_admin = true,
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name);

-- ============================================
-- Quick Test: Verify you can insert products
-- ============================================
-- Run this as an authenticated admin user to test:

-- Step 1: First check your admin status
SELECT id, email, is_admin FROM public.customers WHERE id = auth.uid();

-- Step 2: Check if products table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Step 3: If table doesn't exist or missing columns, run migration 001_create_products_table.sql first!
-- Only run the test insert AFTER the products table is properly created:

-- Test insert (ONLY if products table exists with stock_quantity column):
INSERT INTO public.products (name, description, price, stock_quantity, category)
VALUES ('Test Product', 'This is a test', 10.99, 5, 'Other')
RETURNING *;

-- If successful, delete the test product:
DELETE FROM public.products WHERE name = 'Test Product';

