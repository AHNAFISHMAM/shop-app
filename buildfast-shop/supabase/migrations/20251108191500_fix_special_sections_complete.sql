-- =====================================================
-- COMPLETE FIX: Special Sections Admin Access
-- Fixes ALL root problems with special sections
-- =====================================================

BEGIN;

-- ============================================
-- PART 1: Ensure all special section columns exist
-- ============================================

-- Add is_todays_menu column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'is_todays_menu'
  ) THEN
    ALTER TABLE dishes ADD COLUMN is_todays_menu BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added is_todays_menu column';
  ELSE
    RAISE NOTICE '⊘ is_todays_menu column already exists';
  END IF;
END $$;

-- Add is_daily_special column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'is_daily_special'
  ) THEN
    ALTER TABLE dishes ADD COLUMN is_daily_special BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added is_daily_special column';
  ELSE
    RAISE NOTICE '⊘ is_daily_special column already exists';
  END IF;
END $$;

-- Add is_new_dish column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'is_new_dish'
  ) THEN
    ALTER TABLE dishes ADD COLUMN is_new_dish BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added is_new_dish column';
  ELSE
    RAISE NOTICE '⊘ is_new_dish column already exists';
  END IF;
END $$;

-- Add is_discount_combo column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'is_discount_combo'
  ) THEN
    ALTER TABLE dishes ADD COLUMN is_discount_combo BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added is_discount_combo column';
  ELSE
    RAISE NOTICE '⊘ is_discount_combo column already exists';
  END IF;
END $$;

-- Add is_limited_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'is_limited_time'
  ) THEN
    ALTER TABLE dishes ADD COLUMN is_limited_time BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added is_limited_time column';
  ELSE
    RAISE NOTICE '⊘ is_limited_time column already exists';
  END IF;
END $$;

-- Add is_happy_hour column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'is_happy_hour'
  ) THEN
    ALTER TABLE dishes ADD COLUMN is_happy_hour BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added is_happy_hour column';
  ELSE
    RAISE NOTICE '⊘ is_happy_hour column already exists';
  END IF;
END $$;

-- ============================================
-- PART 2: Ensure special_sections table exists
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'special_sections'
  ) THEN
    CREATE TABLE special_sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_key TEXT NOT NULL UNIQUE,
      section_name TEXT NOT NULL,
      is_available BOOLEAN DEFAULT true,
      custom_message TEXT DEFAULT 'This section is currently unavailable. Please check back later.',
      display_order INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✓ Created special_sections table';
  ELSE
    RAISE NOTICE '⊘ special_sections table already exists';
  END IF;
END $$;

-- Pre-populate special_sections if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM special_sections) THEN
    INSERT INTO special_sections (section_key, section_name, display_order, is_available, custom_message) VALUES
      ('todays_menu', 'Today''s Menu', 1, true, 'Fresh picks curated by our chef today!'),
      ('daily_specials', 'Daily Specials', 2, true, 'Limited-time deals you don''t want to miss!'),
      ('new_dishes', 'New Dishes', 3, true, 'Brand new items added to our menu!'),
      ('discount_combos', 'Discount Combos', 4, true, 'Bundle up and save big!'),
      ('limited_time', 'Limited-Time Meals', 5, true, 'Grab them before they''re gone!'),
      ('happy_hour', 'Happy Hour Offers', 6, true, 'It''s happy hour – time to celebrate!');
    RAISE NOTICE '✓ Pre-populated special_sections with 6 sections';
  ELSE
    RAISE NOTICE '⊘ special_sections already has data';
  END IF;
END $$;

-- ============================================
-- PART 3: FIX RLS POLICIES - Use customers.is_admin instead of auth.users role
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_sections ENABLE ROW LEVEL SECURITY;

-- Drop all existing conflicting policies on dishes
DROP POLICY IF EXISTS "Admins can update dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can manage all dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can insert dishes" ON dishes;
DROP POLICY IF EXISTS "Admins can delete dishes" ON dishes;
DROP POLICY IF EXISTS "Anyone can view active dishes" ON dishes;
DROP POLICY IF EXISTS "Authenticated users can view all dishes" ON dishes;
DROP POLICY IF EXISTS "Public can view dishes" ON dishes;

-- CORRECT ADMIN POLICY: Check customers.is_admin
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

-- Authenticated users can view all dishes (for admin interface)
CREATE POLICY "Authenticated users can view all dishes"
  ON dishes
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop existing policies on special_sections
DROP POLICY IF EXISTS "Anyone can view special sections" ON special_sections;
DROP POLICY IF EXISTS "Admins can manage special sections" ON special_sections;

-- Public can read special_sections
CREATE POLICY "Anyone can view special sections"
  ON special_sections FOR SELECT
  USING (true);

-- CORRECT ADMIN POLICY for special_sections: Check customers.is_admin
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
-- PART 4: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_dishes_special_flags ON dishes(
  is_todays_menu,
  is_daily_special,
  is_new_dish,
  is_discount_combo,
  is_limited_time,
  is_happy_hour
) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_special_sections_display_order ON special_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_customers_is_admin ON customers(is_admin) WHERE is_admin = true;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  dish_count INTEGER;
  section_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dish_count FROM dishes;
  SELECT COUNT(*) INTO section_count FROM special_sections;
  SELECT COUNT(*) INTO admin_count FROM customers WHERE is_admin = true;

  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '   ✅ ALL FIXES APPLIED SUCCESSFULLY! ✅';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Special section columns verified';
  RAISE NOTICE '✓ special_sections table verified (% rows)', section_count;
  RAISE NOTICE '✓ RLS policies FIXED to use customers.is_admin';
  RAISE NOTICE '✓ Performance indexes created';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Status:';
  RAISE NOTICE '  - Total dishes: %', dish_count;
  RAISE NOTICE '  - Special sections: %', section_count;
  RAISE NOTICE '  - Admin users: %', admin_count;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Special Sections are now working!';
  RAISE NOTICE '   Go to Admin → Special Sections to assign dishes';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
END $$;

COMMIT;
