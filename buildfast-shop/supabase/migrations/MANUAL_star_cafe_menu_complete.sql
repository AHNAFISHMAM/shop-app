-- =====================================================
-- STAR CAFÉ MENU SYSTEM - COMPLETE MANUAL MIGRATION
-- =====================================================
-- Run this migration manually via Supabase Dashboard SQL Editor
-- or via psql to create the complete Star Café menu system
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_slug ON menu_categories(slug);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort_order ON menu_categories(sort_order);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',

  -- Images
  image_url TEXT,
  placeholder_color TEXT DEFAULT '#C59D5F',

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Special Sections
  is_todays_menu BOOLEAN DEFAULT FALSE,
  is_daily_special BOOLEAN DEFAULT FALSE,
  is_new_dish BOOLEAN DEFAULT FALSE,
  is_discount_combo BOOLEAN DEFAULT FALSE,
  is_limited_time BOOLEAN DEFAULT FALSE,
  is_happy_hour BOOLEAN DEFAULT FALSE,

  -- Restaurant fields
  dietary_tags TEXT[] DEFAULT '{}',
  spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 3),
  prep_time INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_dietary ON menu_items USING GIN(dietary_tags);

-- Add menu_item_id to cart_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cart_items' AND column_name = 'menu_item_id'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE;
    CREATE INDEX idx_cart_items_menu_item ON cart_items(menu_item_id);
  END IF;
END $$;

-- Soft delete existing dishes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dishes' AND column_name = 'deleted_at'
    ) THEN
      ALTER TABLE dishes ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    UPDATE dishes
    SET is_active = FALSE,
        deleted_at = NOW()
    WHERE deleted_at IS NULL;
  END IF;
END $$;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Public can read available menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins have full access to categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins have full access to menu items" ON menu_items;

-- Public read access
CREATE POLICY "Public can read menu categories"
  ON menu_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read available menu items"
  ON menu_items
  FOR SELECT
  USING (is_available = true);

-- Admin full access
CREATE POLICY "Admins have full access to categories"
  ON menu_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to menu items"
  ON menu_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Star Café Menu System tables created successfully!';
  RAISE NOTICE '📊 Created menu_categories and menu_items tables';
  RAISE NOTICE '🔗 Added menu_item_id to cart_items';
  RAISE NOTICE '🔒 Set up RLS policies';
  RAISE NOTICE '👉 Next: Run the seeding script to add Star Café menu data';
END $$;
