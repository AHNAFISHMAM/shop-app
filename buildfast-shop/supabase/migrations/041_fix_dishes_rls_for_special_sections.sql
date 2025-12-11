-- =====================================================
-- Fix RLS Policies for Special Sections Admin Access
-- Allows admins to update special section flags on dishes
-- =====================================================

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Admins can update dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can manage all dishes" ON dishes;

-- Create comprehensive admin policy for dishes
CREATE POLICY "Admins can manage all dishes"
  ON dishes
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure public can still read dishes
DROP POLICY IF EXISTS "Anyone can view active dishes" ON dishes;
CREATE POLICY "Anyone can view active dishes"
  ON dishes
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to view all dishes (for admin interface)
DROP POLICY IF EXISTS "Authenticated users can view all dishes" ON dishes;
CREATE POLICY "Authenticated users can view all dishes"
  ON dishes
  FOR SELECT
  USING (auth.role() = 'authenticated');
