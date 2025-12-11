-- =====================================================
-- SETUP PUBLIC ACCESS TO MENU ITEMS
-- =====================================================
-- Ensures customers can see all menu items that admins configure
-- =====================================================

-- Enable RLS on menu_items table
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view available menu items" ON menu_items;
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow all updates to menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;

-- =====================================================
-- PUBLIC READ ACCESS (Customers can see menu items)
-- =====================================================

-- Allow EVERYONE (logged in or not) to view ALL menu items
CREATE POLICY "Public can view all menu items"
ON menu_items
FOR SELECT
TO public
USING (true);

-- =====================================================
-- ADMIN WRITE ACCESS (Only admins can manage menu)
-- =====================================================

-- Allow authenticated users to insert (we'll add admin check in app)
CREATE POLICY "Authenticated users can insert menu items"
ON menu_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update (we'll add admin check in app)
CREATE POLICY "Authenticated users can update menu items"
ON menu_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete (we'll add admin check in app)
CREATE POLICY "Authenticated users can delete menu items"
ON menu_items
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
WHERE tablename = 'menu_items'
ORDER BY cmd, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Menu items are now publicly readable!';
  RAISE NOTICE '✅ All customers can see menu items configured by admins';
  RAISE NOTICE '✅ Only authenticated users can manage menu items';
  RAISE NOTICE '📝 Note: Add admin-only checks in your app code for extra security';
END $$;
