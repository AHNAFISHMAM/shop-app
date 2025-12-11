-- =====================================================
-- FINAL FIX FOR SPECIAL SECTIONS - Handles Existing Policies
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- ============================================
-- STEP 1: Add special section columns if missing
-- ============================================

ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_todays_menu BOOLEAN DEFAULT false;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_daily_special BOOLEAN DEFAULT false;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_new_dish BOOLEAN DEFAULT false;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_discount_combo BOOLEAN DEFAULT false;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_limited_time BOOLEAN DEFAULT false;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_happy_hour BOOLEAN DEFAULT false;

-- ============================================
-- STEP 2: Create special_sections table if missing
-- ============================================

CREATE TABLE IF NOT EXISTS special_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  custom_message TEXT DEFAULT 'This section is currently unavailable. Please check back later.',
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate if empty
INSERT INTO special_sections (section_key, section_name, display_order, is_available, custom_message)
SELECT * FROM (VALUES
  ('todays_menu', 'Today''s Menu', 1, true, 'Fresh picks curated by our chef today!'),
  ('daily_specials', 'Daily Specials', 2, true, 'Limited-time deals you don''t want to miss!'),
  ('new_dishes', 'New Dishes', 3, true, 'Brand new items added to our menu!'),
  ('discount_combos', 'Discount Combos', 4, true, 'Bundle up and save big!'),
  ('limited_time', 'Limited-Time Meals', 5, true, 'Grab them before they''re gone!'),
  ('happy_hour', 'Happy Hour Offers', 6, true, 'It''s happy hour – time to celebrate!')
) AS v(section_key, section_name, display_order, is_available, custom_message)
WHERE NOT EXISTS (SELECT 1 FROM special_sections WHERE special_sections.section_key = v.section_key);

-- ============================================
-- STEP 3: DROP ALL EXISTING POLICIES (Comprehensive)
-- ============================================

-- Enable RLS first
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_sections ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies on dishes table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'dishes') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON dishes', r.policyname);
    END LOOP;
END $$;

-- Drop ALL possible existing policies on special_sections table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'special_sections') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON special_sections', r.policyname);
    END LOOP;
END $$;

-- ============================================
-- STEP 4: CREATE NEW POLICIES (Clean Slate)
-- ============================================

-- DISHES TABLE POLICIES
-- Admin can do everything (using customers.is_admin)
CREATE POLICY "Admins can manage all dishes"
  ON dishes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM customers
      WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM customers
      WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
  );

-- Public can view active dishes
CREATE POLICY "Public can view active dishes"
  ON dishes
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all dishes
CREATE POLICY "Authenticated users can view all dishes"
  ON dishes
  FOR SELECT
  TO authenticated
  USING (true);

-- SPECIAL_SECTIONS TABLE POLICIES
-- Public can read
CREATE POLICY "Anyone can view special sections"
  ON special_sections
  FOR SELECT
  USING (true);

-- Admin can manage (using customers.is_admin)
CREATE POLICY "Admins can manage special sections"
  ON special_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM customers
      WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM customers
      WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
  );

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_dishes_special_flags ON dishes(
  is_todays_menu, is_daily_special, is_new_dish,
  is_discount_combo, is_limited_time, is_happy_hour
) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_special_sections_display_order ON special_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_customers_is_admin ON customers(is_admin) WHERE is_admin = true;

COMMIT;

-- ============================================
-- Verification
-- ============================================
SELECT 'Special Sections Fix Applied Successfully! 🎉' AS status;
SELECT COUNT(*) AS total_dishes FROM dishes;
SELECT COUNT(*) AS total_sections FROM special_sections;
SELECT COUNT(*) AS admin_count FROM customers WHERE is_admin = true;
