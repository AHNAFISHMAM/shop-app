-- Migration: Create categories table
-- Description: Sets up the categories table with RLS policies for admin access
-- Run this in your Supabase SQL Editor
-- NOTE: Requires customers table to exist (run 002_setup_admin_user.sql first)

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;

-- Policy: Allow admins to insert categories
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to view all categories
CREATE POLICY "Admins can view all categories"
ON public.categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to delete categories
CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow public (unauthenticated) users to view categories (for product form)
CREATE POLICY "Public can view categories"
ON public.categories FOR SELECT
TO public
USING (true);

-- Add helpful comment
COMMENT ON TABLE public.categories IS 'Product categories that can be managed by admins';
COMMENT ON COLUMN public.categories.name IS 'Unique category name (e.g., Electronics, Clothing, etc.)';

