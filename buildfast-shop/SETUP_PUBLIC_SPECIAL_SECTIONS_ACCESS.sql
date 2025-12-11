-- =====================================================
-- SETUP PUBLIC ACCESS TO SPECIAL SECTIONS
-- =====================================================
-- Ensures customers can see special sections like "Today's Menu"
-- =====================================================

-- Enable RLS on special_sections table
ALTER TABLE special_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view special sections" ON special_sections;
DROP POLICY IF EXISTS "Anyone can view sections" ON special_sections;
DROP POLICY IF EXISTS "Admins can manage sections" ON special_sections;

-- =====================================================
-- PUBLIC READ ACCESS (Customers can see sections)
-- =====================================================

-- Allow EVERYONE (logged in or not) to view ALL special sections
CREATE POLICY "Public can view all special sections"
ON special_sections
FOR SELECT
TO public
USING (true);

-- =====================================================
-- ADMIN WRITE ACCESS
-- =====================================================

CREATE POLICY "Authenticated users can insert special sections"
ON special_sections
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update special sections"
ON special_sections
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete special sections"
ON special_sections
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'special_sections'
ORDER BY cmd, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Special sections are now publicly readable!';
  RAISE NOTICE '✅ Customers can see "Today''s Menu" and other special sections';
  RAISE NOTICE '✅ Only authenticated users can manage sections';
END $$;
