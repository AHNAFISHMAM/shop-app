-- =====================================================
-- ADD category_id COLUMN TO PRODUCTS TABLE
-- Migration 028: Fix missing category_id foreign key
-- This fixes CRITICAL BUG #1 from code review
-- =====================================================

-- Add category_id column to products table
-- This is required by AdminProducts.jsx which saves category_id
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for performance (category filtering)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Backfill existing products: Set category_id based on subcategory
-- Products with subcategories get their category_id from subcategory's parent
UPDATE products
SET category_id = (
  SELECT subcategories.category_id
  FROM subcategories
  WHERE subcategories.id = products.subcategory_id
)
WHERE subcategory_id IS NOT NULL AND category_id IS NULL;

-- Backfill products without subcategories: Match by category name
-- This handles products that have category (TEXT) but no category_id (UUID)
UPDATE products
SET category_id = (
  SELECT categories.id
  FROM categories
  WHERE categories.name = products.category
  LIMIT 1
)
WHERE category_id IS NULL AND category IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN products.category_id IS 'Direct reference to main category for filtering. Can be used independently of subcategory_id.';

-- Verify the migration worked
DO $$
DECLARE
  total_products INTEGER;
  products_with_category_id INTEGER;
  products_without_category_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO products_with_category_id FROM products WHERE category_id IS NOT NULL;
  SELECT COUNT(*) INTO products_without_category_id FROM products WHERE category_id IS NULL;

  RAISE NOTICE 'Migration 028 Complete:';
  RAISE NOTICE '  Total products: %', total_products;
  RAISE NOTICE '  With category_id: %', products_with_category_id;
  RAISE NOTICE '  Without category_id: % (these need manual assignment)', products_without_category_id;
END $$;
