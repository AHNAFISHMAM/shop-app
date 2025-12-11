-- =====================================================
-- MIGRATION 029: Add Restaurant-Specific Columns
-- Adds columns needed for restaurant menu management
-- Must run BEFORE migration 030 (constraints)
-- =====================================================

\echo '========== MIGRATION 029: Add Restaurant Columns to Products =========='

-- ============================================
-- Check if columns already exist before adding
-- ============================================

-- Add dietary_tags column (array of dietary restrictions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'dietary_tags'
  ) THEN
    ALTER TABLE products ADD COLUMN dietary_tags TEXT[] DEFAULT '{}';
    RAISE NOTICE '✓ Added dietary_tags column';
  ELSE
    RAISE NOTICE '⊘ dietary_tags column already exists';
  END IF;
END $$;

-- Add spice_level column (0-3 scale)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'spice_level'
  ) THEN
    ALTER TABLE products ADD COLUMN spice_level INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added spice_level column';
  ELSE
    RAISE NOTICE '⊘ spice_level column already exists';
  END IF;
END $$;

-- Add chef_special column (boolean flag)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'chef_special'
  ) THEN
    ALTER TABLE products ADD COLUMN chef_special BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added chef_special column';
  ELSE
    RAISE NOTICE '⊘ chef_special column already exists';
  END IF;
END $$;

-- Add prep_time column (preparation time in minutes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'prep_time'
  ) THEN
    ALTER TABLE products ADD COLUMN prep_time INTEGER DEFAULT 15;
    RAISE NOTICE '✓ Added prep_time column';
  ELSE
    RAISE NOTICE '⊘ prep_time column already exists';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN products.dietary_tags IS 'Array of dietary tags: vegetarian, vegan, gluten-free, dairy-free, nut-free';
COMMENT ON COLUMN products.spice_level IS 'Spice level: 0=None, 1=Mild, 2=Medium, 3=Hot';
COMMENT ON COLUMN products.chef_special IS 'Whether this dish is featured as chef''s special';
COMMENT ON COLUMN products.prep_time IS 'Estimated preparation time in minutes';

\echo '✓ Restaurant columns added successfully'

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;

  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '          MIGRATION 029 COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Columns Added:';
  RAISE NOTICE '  ✓ dietary_tags (TEXT[])';
  RAISE NOTICE '  ✓ spice_level (INTEGER, 0-3)';
  RAISE NOTICE '  ✓ chef_special (BOOLEAN)';
  RAISE NOTICE '  ✓ prep_time (INTEGER, minutes)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Existing products: %', product_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEP: Run migration 030 to add constraints';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
END $$;
