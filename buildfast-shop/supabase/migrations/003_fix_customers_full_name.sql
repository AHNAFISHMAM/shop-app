-- Migration: Fix customers.full_name NOT NULL constraint
-- Description: Makes full_name nullable and fixes existing data
-- Run this if you got the "null value in column full_name" error

-- Step 1: Make full_name nullable (if it isn't already)
ALTER TABLE public.customers ALTER COLUMN full_name DROP NOT NULL;

-- Step 2: Update any existing NULL values to use email as fallback
UPDATE public.customers
SET full_name = email
WHERE full_name IS NULL;

-- Step 3: If you still get errors, you can set a default for future inserts
-- (This is optional, since we're making it nullable)
ALTER TABLE public.customers ALTER COLUMN full_name SET DEFAULT NULL;

-- Step 4: Now try the admin setup again from 002_setup_admin_user.sql
-- The INSERT will work now since full_name can be NULL

