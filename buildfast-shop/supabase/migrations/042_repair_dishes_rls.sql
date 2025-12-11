-- =====================================================
-- Migration 042: Repair Dishes RLS policies for admin UI
-- - Ensures RLS is enabled on dishes
-- - Recreates least-privilege policies with WITH CHECK clauses
-- - Grants authenticated role read access to auth.users for role checks
-- =====================================================

BEGIN;

-- Ensure RLS is enabled on dishes
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid duplicates/conflicts
DROP POLICY IF EXISTS "Admins can update dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can manage all dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can insert dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can delete dishes" ON dishes;
DROP POLICY IF EXISTS "Anyone can view active dishes" ON dishes;
DROP POLICY IF EXISTS "Authenticated users can view all dishes" ON dishes;

-- Admins (authenticated users with admin role) can perform all operations
CREATE POLICY "Admins can manage all dishes"
  ON dishes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Anyone (anonymous) can view dishes flagged as active
CREATE POLICY "Anyone can view active dishes"
  ON dishes
  FOR SELECT
  USING (is_active = true);

-- Authenticated users (including admins) can view all dishes
CREATE POLICY "Authenticated users can view all dishes"
  ON dishes
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant the authenticated role permission to read auth.users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

COMMIT;

