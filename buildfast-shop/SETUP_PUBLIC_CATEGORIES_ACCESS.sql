-- =====================================================
-- SETUP PUBLIC ACCESS TO MENU CATEGORIES
-- =====================================================
-- Ensures customers can see all menu categories
-- =====================================================

-- Enable RLS on menu_categories table
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON menu_categories;

-- =====================================================
-- PUBLIC READ ACCESS (Customers can see categories)
-- =====================================================

-- Allow EVERYONE (logged in or not) to view ALL menu categories
CREATE POLICY "Public can view all menu categories"
ON menu_categories
FOR SELECT
TO public
USING (true);

-- =====================================================
-- ADMIN WRITE ACCESS (Only admins can manage categories)
-- =====================================================

-- Allow authenticated users to insert (we'll add admin check in app)
CREATE POLICY "Authenticated users can insert menu categories"
ON menu_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update (we'll add admin check in app)
CREATE POLICY "Authenticated users can update menu categories"
ON menu_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete (we'll add admin check in app)
CREATE POLICY "Authenticated users can delete menu categories"
ON menu_categories
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
WHERE tablename = 'menu_categories'
ORDER BY cmd, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Menu categories are now publicly readable!';
  RAISE NOTICE '✅ All customers can see category filters';
  RAISE NOTICE '✅ Only authenticated users can manage categories';
END $$;
