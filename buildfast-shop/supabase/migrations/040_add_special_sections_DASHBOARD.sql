-- =====================================================
-- MIGRATION 040: Add Special Section Flags & Configuration
-- Adds boolean flags for special menu sections on Order page
-- Creates configuration table for admin control
-- =====================================================

-- ============================================
-- Add Special Section Boolean Flags to Dishes
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

-- Add comments for documentation
COMMENT ON COLUMN dishes.is_todays_menu IS 'Featured in Today''s Menu section';
COMMENT ON COLUMN dishes.is_daily_special IS 'Featured in Daily Specials section';
COMMENT ON COLUMN dishes.is_new_dish IS 'Featured in New Dishes section';
COMMENT ON COLUMN dishes.is_discount_combo IS 'Featured in Discount Combos section';
COMMENT ON COLUMN dishes.is_limited_time IS 'Featured in Limited-Time Meals section';
COMMENT ON COLUMN dishes.is_happy_hour IS 'Featured in Happy Hour Offers section';

-- ============================================
-- Create Special Sections Configuration Table
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

-- Add indexes for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'special_sections' AND indexname = 'idx_special_sections_display_order'
  ) THEN
    CREATE INDEX idx_special_sections_display_order ON special_sections(display_order);
    RAISE NOTICE '✓ Created index on display_order';
  ELSE
    RAISE NOTICE '⊘ Index on display_order already exists';
  END IF;
END $$;

-- ============================================
-- Enable RLS on special_sections table
-- ============================================

ALTER TABLE special_sections ENABLE ROW LEVEL SECURITY;

-- Public can read section configuration
DROP POLICY IF EXISTS "Anyone can view special sections" ON special_sections;
CREATE POLICY "Anyone can view special sections"
  ON special_sections FOR SELECT
  USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can manage special sections" ON special_sections;
CREATE POLICY "Admins can manage special sections"
  ON special_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- Pre-populate Special Sections Configuration
-- ============================================

DO $$
BEGIN
  -- Only insert if table is empty
  IF NOT EXISTS (SELECT 1 FROM special_sections) THEN
    INSERT INTO special_sections (section_key, section_name, display_order, is_available, custom_message) VALUES
      ('todays_menu', 'Today''s Menu', 1, true, 'Today''s special menu is being prepared. Check back soon!'),
      ('daily_specials', 'Daily Specials', 2, true, 'No daily specials available right now. Try our regular menu!'),
      ('new_dishes', 'New Dishes', 3, true, 'New dishes coming soon! Stay tuned for exciting additions.'),
      ('discount_combos', 'Discount Combos', 4, true, 'Combo offers will be available soon. Check back later!'),
      ('limited_time', 'Limited-Time Meals', 5, true, 'Limited-time offers are not available right now.'),
      ('happy_hour', 'Happy Hour Offers', 6, true, 'Happy hour hasn''t started yet. Come back during our happy hour!');

    RAISE NOTICE '✓ Pre-populated special_sections with 6 sections';
  ELSE
    RAISE NOTICE '⊘ special_sections already has data';
  END IF;
END $$;

-- ============================================
-- Create Indexes on Dishes for Performance
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'dishes' AND indexname = 'idx_dishes_special_flags'
  ) THEN
    CREATE INDEX idx_dishes_special_flags ON dishes(
      is_todays_menu,
      is_daily_special,
      is_new_dish,
      is_discount_combo,
      is_limited_time,
      is_happy_hour
    ) WHERE is_active = true;
    RAISE NOTICE '✓ Created composite index on special section flags';
  ELSE
    RAISE NOTICE '⊘ Index on special flags already exists';
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  dish_count INTEGER;
  section_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dish_count FROM dishes;
  SELECT COUNT(*) INTO section_count FROM special_sections;

  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '          MIGRATION 040 COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Columns Added to dishes table:';
  RAISE NOTICE '  ✓ is_todays_menu (BOOLEAN)';
  RAISE NOTICE '  ✓ is_daily_special (BOOLEAN)';
  RAISE NOTICE '  ✓ is_new_dish (BOOLEAN)';
  RAISE NOTICE '  ✓ is_discount_combo (BOOLEAN)';
  RAISE NOTICE '  ✓ is_limited_time (BOOLEAN)';
  RAISE NOTICE '  ✓ is_happy_hour (BOOLEAN)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ New table created:';
  RAISE NOTICE '  ✓ special_sections with % rows', section_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total dishes: %', dish_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '  1. Use admin panel to toggle section flags on dishes';
  RAISE NOTICE '  2. Configure section availability in special_sections table';
  RAISE NOTICE '  3. View sections on Order page';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
END $$;
