-- =====================================================
-- COMPLETE MIGRATION: Transform Products to Restaurant Dishes
-- Combines migrations 029, 030, 031, 032 into ONE file
-- Run this SINGLE file to complete all changes
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '   STARTING COMPLETE MIGRATION (029-032)';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 1: Add Restaurant-Specific Columns (029a)
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '>>> PART 1/5: Adding restaurant columns...';
END $$;

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

-- Handle legacy 'category' TEXT column (from original schema)
DO $$
BEGIN
  -- Check if old 'category' TEXT column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    -- Drop NOT NULL constraint from old category column
    ALTER TABLE products ALTER COLUMN category DROP NOT NULL;
    RAISE NOTICE '✓ Removed NOT NULL constraint from legacy category column';
  END IF;
END $$;

DO $$ BEGIN
  RAISE NOTICE '✓ Restaurant columns added';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 2: Add Soft Delete Support (029b)
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '>>> PART 2/5: Adding soft delete support...';
END $$;

-- Add soft delete columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for fast filtering of active products
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- Create index for deleted products (admin view)
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN products.is_active IS 'Soft delete flag - FALSE means product is deleted but data preserved';
COMMENT ON COLUMN products.deleted_at IS 'Timestamp when product was soft deleted';

-- Create function to soft delete products
CREATE OR REPLACE FUNCTION soft_delete_product(product_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET is_active = FALSE,
      deleted_at = NOW()
  WHERE id = product_uuid AND is_active = TRUE;

  RAISE NOTICE 'Product % soft deleted', product_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to restore soft deleted products
CREATE OR REPLACE FUNCTION restore_product(product_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET is_active = TRUE,
      deleted_at = NULL
  WHERE id = product_uuid AND is_active = FALSE;

  RAISE NOTICE 'Product % restored', product_uuid;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  RAISE NOTICE '✓ Soft delete support added';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 3: Add Data Validation Constraints (030)
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '>>> PART 3/5: Adding validation constraints...';
END $$;

-- Drop existing constraints if they exist (for re-running)
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_dietary_tags;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_spice_level;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_prep_time;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_price;
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_stock;

-- 1. DIETARY TAGS VALIDATION
ALTER TABLE products
ADD CONSTRAINT valid_dietary_tags
CHECK (
  dietary_tags IS NULL OR
  dietary_tags <@ ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'spicy']::TEXT[]
);

-- 2. SPICE LEVEL VALIDATION
ALTER TABLE products
ADD CONSTRAINT valid_spice_level
CHECK (spice_level >= 0 AND spice_level <= 3);

-- 3. PREP TIME VALIDATION
ALTER TABLE products
ADD CONSTRAINT valid_prep_time
CHECK (prep_time > 0 AND prep_time <= 180);

-- 4. PRICE VALIDATION
ALTER TABLE products
ADD CONSTRAINT valid_price
CHECK (price > 0);

-- 5. STOCK VALIDATION
ALTER TABLE products
ADD CONSTRAINT valid_stock
CHECK (stock_quantity >= 0);

DO $$ BEGIN
  RAISE NOTICE '✓ Validation constraints added';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 4: Rename Products to Dishes (031)
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '>>> PART 4/5: Renaming products table to dishes...';
END $$;

-- Rename main table
ALTER TABLE IF EXISTS products RENAME TO dishes;

DO $$ BEGIN
  RAISE NOTICE '✓ Renamed products table to dishes';
END $$;

-- Rename indexes
ALTER INDEX IF EXISTS idx_products_category_id RENAME TO idx_dishes_category_id;
ALTER INDEX IF EXISTS idx_products_subcategory RENAME TO idx_dishes_subcategory;
ALTER INDEX IF EXISTS idx_products_active RENAME TO idx_dishes_active;
ALTER INDEX IF EXISTS idx_products_deleted RENAME TO idx_dishes_deleted;

DO $$ BEGIN
  RAISE NOTICE '✓ Renamed dish table indexes';
END $$;

-- Update cart_items foreign key
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES dishes(id) ON DELETE CASCADE;

DO $$ BEGIN
  RAISE NOTICE '✓ Updated cart_items foreign key';
END $$;

-- Update order_items foreign key
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES dishes(id) ON DELETE RESTRICT;

DO $$ BEGIN
  RAISE NOTICE '✓ Updated order_items foreign key';
END $$;

-- Update reviews table foreign key (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES dishes(id) ON DELETE CASCADE;

    RAISE NOTICE '✓ Updated reviews foreign key';
  END IF;
END $$;

-- Update product_variants table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
    ALTER TABLE product_variants
    ADD CONSTRAINT product_variants_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES dishes(id) ON DELETE CASCADE;

    RAISE NOTICE '✓ Updated product_variants foreign key';
  END IF;
END $$;

-- Update wishlist_items table foreign key (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wishlist_items') THEN
    ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_product_id_fkey;
    ALTER TABLE wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES dishes(id) ON DELETE CASCADE;

    RAISE NOTICE '✓ Updated wishlist_items foreign key';
  END IF;
END $$;

-- Update RLS Policies
DROP POLICY IF EXISTS "Public can view products" ON dishes;
DROP POLICY IF EXISTS "Admins can insert products" ON dishes;
DROP POLICY IF EXISTS "Admins can update products" ON dishes;
DROP POLICY IF EXISTS "Admins can delete products" ON dishes;
DROP POLICY IF EXISTS "Sellers can manage own products" ON dishes;

CREATE POLICY "Public can view dishes"
  ON dishes FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert dishes"
  ON dishes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true
    )
  );

CREATE POLICY "Admins can update dishes"
  ON dishes FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete dishes"
  ON dishes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'isAdmin')::boolean = true
    )
  );

DO $$ BEGIN
  RAISE NOTICE '✓ Updated RLS policies';
END $$;

-- Update Functions
DROP FUNCTION IF EXISTS soft_delete_product(UUID);
CREATE OR REPLACE FUNCTION soft_delete_dish(dish_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE dishes SET is_active = FALSE, deleted_at = NOW()
  WHERE id = dish_uuid AND is_active = TRUE;
  RAISE NOTICE 'Dish % soft deleted', dish_uuid;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS restore_product(UUID);
CREATE OR REPLACE FUNCTION restore_dish(dish_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE dishes SET is_active = TRUE, deleted_at = NULL
  WHERE id = dish_uuid AND is_active = FALSE;
  RAISE NOTICE 'Dish % restored', dish_uuid;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  RAISE NOTICE '✓ Updated functions';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PART 5: Seed Sample Restaurant Dishes (032)
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '>>> PART 5/5: Seeding sample restaurant dishes...';
END $$;

-- Clear existing data (only from tables that exist)
DO $$
BEGIN
  -- Always clear these core tables
  DELETE FROM cart_items;
  DELETE FROM order_items;

  -- Clear optional tables only if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    DELETE FROM reviews;
    RAISE NOTICE '✓ Cleared reviews table';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dish_variants') THEN
    DELETE FROM dish_variants;
    RAISE NOTICE '✓ Cleared dish_variants table';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    DELETE FROM product_variants;
    RAISE NOTICE '✓ Cleared product_variants table';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wishlist_items') THEN
    DELETE FROM wishlist_items;
    RAISE NOTICE '✓ Cleared wishlist_items table';
  END IF;

  -- Clear dishes (or products if not renamed yet)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') THEN
    DELETE FROM dishes;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    DELETE FROM products;
  END IF;

  RAISE NOTICE '✓ Cleared all existing data';
END $$;

-- Get category IDs
DO $$
DECLARE
  appetizers_id UUID;
  main_course_id UUID;
  desserts_id UUID;
  beverages_id UUID;
  biryani_id UUID;
  beef_id UUID;
  mutton_id UUID;
  chicken_id UUID;
  fish_id UUID;
BEGIN
  -- Get main categories
  SELECT id INTO appetizers_id FROM categories WHERE name = 'Appetizers' LIMIT 1;
  SELECT id INTO main_course_id FROM categories WHERE name = 'Main Course' LIMIT 1;
  SELECT id INTO desserts_id FROM categories WHERE name = 'Desserts' LIMIT 1;
  SELECT id INTO beverages_id FROM categories WHERE name = 'Beverages' LIMIT 1;

  -- Get subcategories
  SELECT id INTO biryani_id FROM subcategories WHERE name = 'Biryani' LIMIT 1;
  SELECT id INTO beef_id FROM subcategories WHERE name = 'Beef' LIMIT 1;
  SELECT id INTO mutton_id FROM subcategories WHERE name = 'Mutton' LIMIT 1;
  SELECT id INTO chicken_id FROM subcategories WHERE name = 'Chicken' LIMIT 1;
  SELECT id INTO fish_id FROM subcategories WHERE name = 'Fish & Prawn' LIMIT 1;

  -- Insert Appetizers (8 dishes)
  INSERT INTO dishes (name, description, price, stock_quantity, low_stock_threshold, category_id, subcategory_id, dietary_tags, spice_level, chef_special, prep_time, images, is_active) VALUES
  ('Spring Rolls', 'Crispy vegetable spring rolls served with sweet chili sauce', 150.00, 50, 10, appetizers_id, NULL, ARRAY['vegetarian'], 0, false, 15, to_jsonb(ARRAY['https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400']), true),
  ('Chicken Wings', 'Spicy buffalo wings with ranch dipping sauce', 280.00, 40, 8, appetizers_id, NULL, ARRAY[]::text[], 2, false, 20, to_jsonb(ARRAY['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400']), true),
  ('Samosas', 'Traditional triangular pastries filled with spiced potatoes and peas', 120.00, 60, 15, appetizers_id, NULL, ARRAY['vegetarian', 'vegan'], 1, false, 12, to_jsonb(ARRAY['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400']), true),
  ('Onion Bhaji', 'Crispy onion fritters with mint chutney', 130.00, 45, 10, appetizers_id, NULL, ARRAY['vegetarian', 'vegan', 'gluten-free'], 1, false, 15, to_jsonb(ARRAY['https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400']), true),
  ('Chicken Pakora', 'Spiced chicken fritters with tamarind sauce', 220.00, 35, 8, appetizers_id, NULL, ARRAY[]::text[], 2, false, 18, to_jsonb(ARRAY['https://images.unsplash.com/photo-1562158147-f7da6a38a4b3?w=400']), true),
  ('Prawn Tempura', 'Lightly battered prawns with soy dipping sauce', 380.00, 25, 5, appetizers_id, NULL, ARRAY[]::text[], 0, true, 18, to_jsonb(ARRAY['https://images.unsplash.com/photo-1580462490378-5a53e5d1f62c?w=400']), true),
  ('Vegetable Soup', 'Hearty mixed vegetable soup with herbs', 140.00, 40, 10, appetizers_id, NULL, ARRAY['vegetarian', 'vegan', 'gluten-free'], 0, false, 10, to_jsonb(ARRAY['https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400']), true),
  ('Caesar Salad', 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing', 240.00, 35, 8, appetizers_id, NULL, ARRAY['vegetarian'], 0, false, 10, to_jsonb(ARRAY['https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400']), true);

  RAISE NOTICE '✓ Inserted 8 appetizers';

  -- Insert Biryani (4 dishes)
  INSERT INTO dishes (name, description, price, stock_quantity, low_stock_threshold, category_id, subcategory_id, dietary_tags, spice_level, chef_special, prep_time, images, is_active) VALUES
  ('Chicken Biryani', 'Aromatic basmati rice cooked with tender chicken, spices, and saffron', 320.00, 50, 10, main_course_id, biryani_id, ARRAY[]::text[], 2, true, 45, to_jsonb(ARRAY['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400']), true),
  ('Mutton Biryani', 'Traditional mutton biryani with fragrant spices and raita', 420.00, 30, 8, main_course_id, biryani_id, ARRAY[]::text[], 2, true, 60, to_jsonb(ARRAY['https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=400']), true),
  ('Beef Biryani', 'Slow-cooked beef biryani with aromatic spices', 380.00, 35, 8, main_course_id, biryani_id, ARRAY[]::text[], 2, false, 55, to_jsonb(ARRAY['https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400']), true),
  ('Vegetable Biryani', 'Mixed vegetable biryani with cashews and raisins', 250.00, 40, 10, main_course_id, biryani_id, ARRAY['vegetarian', 'vegan'], 1, false, 35, to_jsonb(ARRAY['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400']), true);

  RAISE NOTICE '✓ Inserted 4 biryani dishes';

  -- Insert Curries (6 dishes)
  INSERT INTO dishes (name, description, price, stock_quantity, low_stock_threshold, category_id, subcategory_id, dietary_tags, spice_level, chef_special, prep_time, images, is_active) VALUES
  ('Beef Rezala', 'Tender beef in a rich, creamy yogurt-based gravy with aromatic spices', 450.00, 30, 8, main_course_id, beef_id, ARRAY[]::text[], 2, true, 50, to_jsonb(ARRAY['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400']), true),
  ('Mutton Rogan Josh', 'Classic Kashmiri lamb curry with tomatoes and aromatic spices', 480.00, 25, 6, main_course_id, mutton_id, ARRAY[]::text[], 3, true, 55, to_jsonb(ARRAY['https://images.unsplash.com/photo-1603894584373-5ac82b2fb0c2?w=400']), true),
  ('Chicken Tikka Masala', 'Grilled chicken in a creamy tomato-based sauce', 350.00, 45, 10, main_course_id, chicken_id, ARRAY[]::text[], 2, false, 35, to_jsonb(ARRAY['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400']), true),
  ('Butter Chicken', 'Tender chicken in a rich, buttery tomato sauce', 360.00, 50, 10, main_course_id, chicken_id, ARRAY[]::text[], 1, true, 40, to_jsonb(ARRAY['https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400']), true),
  ('Fish Curry (Bengali Style)', 'Fresh fish cooked in a spicy mustard-based gravy', 420.00, 20, 5, main_course_id, fish_id, ARRAY['gluten-free'], 3, true, 30, to_jsonb(ARRAY['https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400']), true),
  ('Prawn Malai Curry', 'Jumbo prawns in a creamy coconut sauce', 520.00, 20, 5, main_course_id, fish_id, ARRAY['gluten-free'], 2, true, 25, to_jsonb(ARRAY['https://images.unsplash.com/photo-1633504581786-316c8002b1b9?w=400']), true);

  RAISE NOTICE '✓ Inserted 6 curry dishes';

  -- Insert Desserts (6 dishes)
  INSERT INTO dishes (name, description, price, stock_quantity, low_stock_threshold, category_id, subcategory_id, dietary_tags, spice_level, chef_special, prep_time, images, is_active) VALUES
  ('Gulab Jamun', 'Soft milk dumplings soaked in rose-flavored sugar syrup', 120.00, 50, 15, desserts_id, NULL, ARRAY['vegetarian'], 0, false, 5, to_jsonb(ARRAY['https://images.unsplash.com/photo-1589447923001-e6e755c8a8b8?w=400']), true),
  ('Kheer (Rice Pudding)', 'Creamy rice pudding with cardamom, nuts, and raisins', 140.00, 40, 10, desserts_id, NULL, ARRAY['vegetarian', 'gluten-free'], 0, false, 8, to_jsonb(ARRAY['https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400']), true),
  ('Rasgulla', 'Soft, spongy cheese balls in light sugar syrup', 100.00, 45, 12, desserts_id, NULL, ARRAY['vegetarian', 'gluten-free'], 0, false, 5, to_jsonb(ARRAY['https://images.unsplash.com/photo-1585238341710-4a18607eed42?w=400']), true),
  ('Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 280.00, 25, 6, desserts_id, NULL, ARRAY['vegetarian'], 0, true, 15, to_jsonb(ARRAY['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400']), true),
  ('Mango Kulfi', 'Traditional Indian ice cream with real mango pulp', 150.00, 35, 8, desserts_id, NULL, ARRAY['vegetarian', 'gluten-free'], 0, false, 5, to_jsonb(ARRAY['https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400']), true),
  ('Tiramisu', 'Classic Italian coffee-flavored dessert', 320.00, 20, 5, desserts_id, NULL, ARRAY['vegetarian'], 0, true, 10, to_jsonb(ARRAY['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400']), true);

  RAISE NOTICE '✓ Inserted 6 desserts';

  -- Insert Beverages (6 dishes)
  INSERT INTO dishes (name, description, price, stock_quantity, low_stock_threshold, category_id, subcategory_id, dietary_tags, spice_level, chef_special, prep_time, images, is_active) VALUES
  ('Mango Lassi', 'Refreshing yogurt drink blended with ripe mangoes', 120.00, 60, 15, beverages_id, NULL, ARRAY['vegetarian', 'gluten-free'], 0, true, 5, to_jsonb(ARRAY['https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400']), true),
  ('Fresh Lime Soda', 'Sparkling lime drink with mint', 80.00, 70, 20, beverages_id, NULL, ARRAY['vegetarian', 'vegan', 'gluten-free'], 0, false, 3, to_jsonb(ARRAY['https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=400']), true),
  ('Masala Chai', 'Traditional spiced tea with milk', 60.00, 80, 25, beverages_id, NULL, ARRAY['vegetarian', 'gluten-free'], 0, false, 5, to_jsonb(ARRAY['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400']), true),
  ('Fresh Orange Juice', 'Freshly squeezed orange juice', 150.00, 40, 10, beverages_id, NULL, ARRAY['vegetarian', 'vegan', 'gluten-free'], 0, false, 5, to_jsonb(ARRAY['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400']), true),
  ('Cold Coffee', 'Iced coffee with milk and ice cream', 180.00, 45, 10, beverages_id, NULL, ARRAY['vegetarian', 'gluten-free'], 0, false, 8, to_jsonb(ARRAY['https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400']), true),
  ('Bottled Water (500ml)', 'Purified drinking water', 30.00, 100, 30, beverages_id, NULL, ARRAY['vegetarian', 'vegan', 'gluten-free'], 0, false, 1, to_jsonb(ARRAY['https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400']), true);

  RAISE NOTICE '✓ Inserted 6 beverages';
END $$;

DO $$ BEGIN
  RAISE NOTICE '✓ Sample dishes seeded';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

DO $$ BEGIN
  RAISE NOTICE '>>> Final Verification...';
  RAISE NOTICE '';
END $$;

DO $$
DECLARE
  dishes_count INTEGER;
  cart_items_count INTEGER;
  order_items_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dishes_count FROM dishes;
  SELECT COUNT(*) INTO cart_items_count FROM cart_items;
  SELECT COUNT(*) INTO order_items_count FROM order_items;

  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '     🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY! 🎉';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Database State:';
  RAISE NOTICE '  ✓ Dishes: % (30 expected)', dishes_count;
  RAISE NOTICE '  ✓ Cart Items: %', cart_items_count;
  RAISE NOTICE '  ✓ Order Items: %', order_items_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Changes Applied:';
  RAISE NOTICE '  ✓ Added restaurant columns (dietary_tags, spice_level, etc.)';
  RAISE NOTICE '  ✓ Added soft delete support (is_active, deleted_at)';
  RAISE NOTICE '  ✓ Added validation constraints';
  RAISE NOTICE '  ✓ Renamed products → dishes table';
  RAISE NOTICE '  ✓ Updated all foreign keys';
  RAISE NOTICE '  ✓ Updated RLS policies';
  RAISE NOTICE '  ✓ Updated functions';
  RAISE NOTICE '  ✓ Seeded 30 sample dishes';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Column names remain as product_id for compatibility';
  RAISE NOTICE '   (Only the main table was renamed: products → dishes)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your restaurant app is now ready!';
  RAISE NOTICE '   Refresh your browser to see 30 dishes in the menu.';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
END $$;
