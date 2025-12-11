-- =====================================================
-- TWO-LEVEL CATEGORY SYSTEM FOR STAR CAFÉ MENU
-- Migration 027: Create subcategories and update products
-- SAFE VERSION: Creates categories first if they don't exist
-- =====================================================

-- STEP 1: Ensure required categories exist
-- This prevents NULL category_id errors
INSERT INTO categories (name, created_at, updated_at) VALUES
  ('Appetizers', NOW(), NOW()),
  ('Main Course', NOW(), NOW()),
  ('Desserts', NOW(), NOW()),
  ('Beverages', NOW(), NOW()),
  ('Chef Specials', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- STEP 2: Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast category lookups
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON subcategories;

-- RLS Policies: Public can read, only admins can write
CREATE POLICY "Public can view subcategories"
  ON subcategories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert subcategories"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true
    )
  );

CREATE POLICY "Admins can update subcategories"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true
    )
  );

CREATE POLICY "Admins can delete subcategories"
  ON subcategories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true
    )
  );

-- STEP 3: Seed subcategories (with better error handling)
DO $$
DECLARE
  main_course_id UUID;
  appetizers_id UUID;
  beverages_id UUID;
  desserts_id UUID;
  chef_specials_id UUID;
BEGIN
  -- Get category IDs (they should now exist after STEP 1)
  SELECT id INTO main_course_id FROM categories WHERE name = 'Main Course' LIMIT 1;
  SELECT id INTO appetizers_id FROM categories WHERE name = 'Appetizers' LIMIT 1;
  SELECT id INTO beverages_id FROM categories WHERE name = 'Beverages' LIMIT 1;
  SELECT id INTO desserts_id FROM categories WHERE name = 'Desserts' LIMIT 1;
  SELECT id INTO chef_specials_id FROM categories WHERE name = 'Chef Specials' LIMIT 1;

  -- Verify we found all categories
  IF main_course_id IS NULL THEN
    RAISE EXCEPTION 'Category "Main Course" not found. Please check categories table.';
  END IF;

  IF appetizers_id IS NULL THEN
    RAISE EXCEPTION 'Category "Appetizers" not found. Please check categories table.';
  END IF;

  IF beverages_id IS NULL THEN
    RAISE EXCEPTION 'Category "Beverages" not found. Please check categories table.';
  END IF;

  IF desserts_id IS NULL THEN
    RAISE EXCEPTION 'Category "Desserts" not found. Please check categories table.';
  END IF;

  IF chef_specials_id IS NULL THEN
    RAISE EXCEPTION 'Category "Chef Specials" not found. Please check categories table.';
  END IF;

  -- Insert subcategories mapped to main categories
  -- Main Course subcategories
  INSERT INTO subcategories (name, category_id, display_order) VALUES
    ('Biryani', main_course_id, 1),
    ('Beef', main_course_id, 2),
    ('Mutton', main_course_id, 3),
    ('Chicken', main_course_id, 4),
    ('Fish & Prawn', main_course_id, 5),
    ('Kabab & Naan', main_course_id, 6),
    ('Rice & Curry', main_course_id, 7),
    ('Pizza & Burger', main_course_id, 8),
    ('Pasta & Chowmein', main_course_id, 9)
  ON CONFLICT (name) DO NOTHING;

  -- Appetizers subcategories
  INSERT INTO subcategories (name, category_id, display_order) VALUES
    ('Appetizers & Snacks', appetizers_id, 10),
    ('Salad & Vegetable', appetizers_id, 11),
    ('Soup', appetizers_id, 12)
  ON CONFLICT (name) DO NOTHING;

  -- Chef Specials subcategories
  INSERT INTO subcategories (name, category_id, display_order) VALUES
    ('Set Menu', chef_specials_id, 13)
  ON CONFLICT (name) DO NOTHING;

  RAISE NOTICE 'Successfully created subcategories';
  RAISE NOTICE '  Main Course: 9 subcategories';
  RAISE NOTICE '  Appetizers: 3 subcategories';
  RAISE NOTICE '  Chef Specials: 1 subcategory';

END $$;

-- STEP 4: Add subcategory_id column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- Create index for fast subcategory filtering
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);

-- STEP 5: Add updated_at trigger for subcategories
CREATE OR REPLACE FUNCTION update_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subcategories_updated_at ON subcategories;
CREATE TRIGGER subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_subcategories_updated_at();

-- STEP 6: Enable realtime for subcategories table
DO $$
BEGIN
  -- Try to add table to realtime, but don't fail if it already exists
  ALTER PUBLICATION supabase_realtime ADD TABLE subcategories;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Table subcategories already in realtime publication';
END $$;

-- Add helpful comments
COMMENT ON TABLE subcategories IS 'Subcategories for detailed menu organization under main categories';
COMMENT ON COLUMN products.subcategory_id IS 'Optional subcategory for detailed menu filtering';

-- STEP 7: Verification
DO $$
DECLARE
  category_count INTEGER;
  subcategory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO category_count FROM categories;
  SELECT COUNT(*) INTO subcategory_count FROM subcategories;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 027 Complete!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Categories in database: %', category_count;
  RAISE NOTICE 'Subcategories created: %', subcategory_count;
  RAISE NOTICE '==============================================';
END $$;
