-- Fix Dishes Table Permissions for Admin
-- Run this entire file at once

BEGIN;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can update dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can manage all dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can insert dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can delete dishes" ON dishes;
DROP POLICY IF EXISTS "Anyone can view active dishes" ON dishes;
DROP POLICY IF EXISTS "Authenticated users can view all dishes" ON dishes;

-- Create admin policy
CREATE POLICY "Admins can manage all dishes"
  ON dishes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create public read policy
CREATE POLICY "Anyone can view active dishes"
  ON dishes
  FOR SELECT
  USING (is_active = true);

-- Create authenticated read policy
CREATE POLICY "Authenticated users can view all dishes"
  ON dishes
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;
