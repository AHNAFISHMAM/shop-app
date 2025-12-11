-- =====================================================
-- MASTER SCRIPT: ENABLE PUBLIC ACCESS TO ORDER PAGE
-- =====================================================
-- Run this script to ensure ALL customers (logged in or not)
-- can see menu items, categories, and special sections
-- that admins configure in the admin panel
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'SETTING UP PUBLIC ACCESS TO MENU SYSTEM...';
  RAISE NOTICE '=================================================';
END $$;

-- =====================================================
-- 1. MENU ITEMS - Public Read Access
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  Setting up menu_items access...';
END $$;

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all menu items" ON menu_items;
DROP POLICY IF EXISTS "Public can view available menu items" ON menu_items;
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow all updates to menu_items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can delete menu items" ON menu_items;

-- Public can see all menu items
CREATE POLICY "Public can view all menu items"
ON menu_items FOR SELECT TO public USING (true);

-- Authenticated users can manage (admin check in app)
CREATE POLICY "Authenticated users can insert menu items"
ON menu_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu items"
ON menu_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menu items"
ON menu_items FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 2. MENU CATEGORIES - Public Read Access
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  Setting up menu_categories access...';
END $$;

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Public can view menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated users can insert menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated users can update menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated users can delete menu categories" ON menu_categories;

-- Public can see all categories
CREATE POLICY "Public can view all menu categories"
ON menu_categories FOR SELECT TO public USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can insert menu categories"
ON menu_categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu categories"
ON menu_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menu categories"
ON menu_categories FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 3. SPECIAL SECTIONS - Public Read Access
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  Setting up special_sections access...';
END $$;

ALTER TABLE special_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all special sections" ON special_sections;
DROP POLICY IF EXISTS "Public can view special sections" ON special_sections;
DROP POLICY IF EXISTS "Anyone can view sections" ON special_sections;
DROP POLICY IF EXISTS "Authenticated users can insert special sections" ON special_sections;
DROP POLICY IF EXISTS "Authenticated users can update special sections" ON special_sections;
DROP POLICY IF EXISTS "Authenticated users can delete special sections" ON special_sections;

-- Public can see all special sections
CREATE POLICY "Public can view all special sections"
ON special_sections FOR SELECT TO public USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can insert special sections"
ON special_sections FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update special sections"
ON special_sections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete special sections"
ON special_sections FOR DELETE TO authenticated USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'VERIFYING POLICIES...';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Menu Items Policies:';
END $$;

SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'menu_items' ORDER BY cmd;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Menu Categories Policies:';
END $$;

SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'menu_categories' ORDER BY cmd;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Special Sections Policies:';
END $$;

SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'special_sections' ORDER BY cmd;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ PUBLIC MENU ACCESS ENABLED!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All customers can now see:';
  RAISE NOTICE '   - Menu items configured by admins';
  RAISE NOTICE '   - Category filters';
  RAISE NOTICE '   - Special sections (Today''s Menu, Daily Specials, etc.)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Order page is accessible at both:';
  RAISE NOTICE '   - /order';
  RAISE NOTICE '   - /order-online';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   - Only authenticated users can manage menu items';
  RAISE NOTICE '   - Add admin role checks in your app for extra security';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;
