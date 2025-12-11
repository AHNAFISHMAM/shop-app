-- =====================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor to apply all Phase 1 migrations
-- This is your ONE-STOP setup for the long-term solution
-- =====================================================

-- ============================================
-- STEP 1: Apply Migration 027 (Two-Level Categories)
-- ============================================
\echo '========== MIGRATION 027: Two-Level Categories =========='

-- Ensure required categories exist
INSERT INTO categories (name, created_at, updated_at) VALUES
  ('Appetizers', NOW(), NOW()),
  ('Main Course', NOW(), NOW()),
  ('Desserts', NOW(), NOW()),
  ('Beverages', NOW(), NOW()),
  ('Chef Specials', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON subcategories;

CREATE POLICY "Public can view subcategories"
  ON subcategories FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert subcategories"
  ON subcategories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true));

CREATE POLICY "Admins can update subcategories"
  ON subcategories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true));

CREATE POLICY "Admins can delete subcategories"
  ON subcategories FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true));

-- Seed subcategories
INSERT INTO subcategories (name, category_id, display_order)
SELECT 'Biryani', id, 1 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Beef', id, 2 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Mutton', id, 3 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Chicken', id, 4 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Fish & Prawn', id, 5 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Kabab & Naan', id, 6 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Rice & Curry', id, 7 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Pizza & Burger', id, 8 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Pasta & Chowmein', id, 9 FROM categories WHERE name = 'Main Course'
UNION ALL SELECT 'Appetizers & Snacks', id, 10 FROM categories WHERE name = 'Appetizers'
UNION ALL SELECT 'Salad & Vegetable', id, 11 FROM categories WHERE name = 'Appetizers'
UNION ALL SELECT 'Soup', id, 12 FROM categories WHERE name = 'Appetizers'
UNION ALL SELECT 'Set Menu', id, 13 FROM categories WHERE name = 'Chef Specials'
ON CONFLICT (name) DO NOTHING;

ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);

\echo '✓ Migration 027 Complete'

-- ============================================
-- STEP 2: Apply Migration 028 (Add category_id)
-- ============================================
\echo '========== MIGRATION 028: Add category_id Column =========='

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Backfill: Set category_id from subcategory
UPDATE products
SET category_id = (
  SELECT subcategories.category_id
  FROM subcategories
  WHERE subcategories.id = products.subcategory_id
)
WHERE subcategory_id IS NOT NULL AND category_id IS NULL;

-- Backfill: Set category_id from old category text field
UPDATE products
SET category_id = (
  SELECT categories.id
  FROM categories
  WHERE categories.name = products.category
  LIMIT 1
)
WHERE category_id IS NULL AND category IS NOT NULL;

\echo '✓ Migration 028 Complete'

-- ============================================
-- STEP 3: Apply Migration 029 (Soft Delete)
-- ============================================
\echo '========== MIGRATION 029: Soft Delete Support =========='

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE FUNCTION soft_delete_product(product_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET is_active = FALSE, deleted_at = NOW()
  WHERE id = product_uuid AND is_active = TRUE;
  RAISE NOTICE 'Product % soft deleted', product_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION restore_product(product_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET is_active = TRUE, deleted_at = NULL
  WHERE id = product_uuid AND is_active = FALSE;
  RAISE NOTICE 'Product % restored', product_uuid;
END;
$$ LANGUAGE plpgsql;

\echo '✓ Migration 029 Complete'

-- ============================================
-- STEP 4: Apply Migration 030 (Constraints)
-- ============================================
\echo '========== MIGRATION 030: Data Constraints =========='

ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_dietary_tags;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_spice_level;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_prep_time;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_price;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_stock;

ALTER TABLE products ADD CONSTRAINT valid_dietary_tags
  CHECK (dietary_tags IS NULL OR dietary_tags <@ ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free','spicy']::TEXT[]);

ALTER TABLE products ADD CONSTRAINT valid_spice_level
  CHECK (spice_level >= 0 AND spice_level <= 3);

ALTER TABLE products ADD CONSTRAINT valid_prep_time
  CHECK (prep_time > 0 AND prep_time <= 180);

ALTER TABLE products ADD CONSTRAINT valid_price
  CHECK (price > 0);

ALTER TABLE products ADD CONSTRAINT valid_stock
  CHECK (stock_quantity >= 0);

\echo '✓ Migration 030 Complete'

-- ============================================
-- FINAL VERIFICATION
-- ============================================
DO $$
DECLARE
  total_products INTEGER;
  with_category_id INTEGER;
  with_subcategory_id INTEGER;
  active_products INTEGER;
  total_categories INTEGER;
  total_subcategories INTEGER;
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO with_category_id FROM products WHERE category_id IS NOT NULL;
  SELECT COUNT(*) INTO with_subcategory_id FROM products WHERE subcategory_id IS NOT NULL;
  SELECT COUNT(*) INTO active_products FROM products WHERE is_active = TRUE;
  SELECT COUNT(*) INTO total_categories FROM categories;
  SELECT COUNT(*) INTO total_subcategories FROM subcategories;
  SELECT COUNT(*) INTO constraint_count FROM information_schema.table_constraints
    WHERE table_name = 'products' AND constraint_type = 'CHECK';

  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '                 ALL MIGRATIONS COMPLETE!';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Statistics:';
  RAISE NOTICE '  Categories: %', total_categories;
  RAISE NOTICE '  Subcategories: %', total_subcategories;
  RAISE NOTICE '  Total Products: %', total_products;
  RAISE NOTICE '  - With category_id: %', with_category_id;
  RAISE NOTICE '  - With subcategory_id: %', with_subcategory_id;
  RAISE NOTICE '  - Active products: %', active_products;
  RAISE NOTICE '  CHECK constraints: %', constraint_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Features Enabled:';
  RAISE NOTICE '  ✓ Two-level category system';
  RAISE NOTICE '  ✓ Direct category_id reference';
  RAISE NOTICE '  ✓ Soft delete support';
  RAISE NOTICE '  ✓ Data validation constraints';
  RAISE NOTICE '';

  IF with_category_id < total_products THEN
    RAISE WARNING '⚠️  % products missing category_id - please assign categories in admin!', (total_products - with_category_id);
  ELSE
    RAISE NOTICE '✅ All products have category_id assigned';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Apply code fixes from bug report';
  RAISE NOTICE '  2. Test menu and order pages';
  RAISE NOTICE '  3. Verify admin product management';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
END $$;
