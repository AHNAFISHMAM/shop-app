-- =====================================================
-- Migration: Transform E-commerce to Restaurant
-- Description: Add restaurant-specific columns and update data for Star Café
-- Created: 2025-01-07
-- =====================================================

-- ============================================
-- 1. UPDATE PRODUCTS TABLE FOR MENU ITEMS
-- ============================================

-- Add restaurant-specific columns to products (menu items)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 3),
ADD COLUMN IF NOT EXISTS chef_special BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS portion_sizes JSONB DEFAULT '{"small": 0, "medium": 0, "large": 0}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.products.dietary_tags IS 'Array of dietary tags: vegetarian, vegan, gluten-free, dairy-free, nut-free, spicy';
COMMENT ON COLUMN public.products.spice_level IS 'Spice level: 0 = Mild, 1 = Medium, 2 = Hot, 3 = Extra Hot';
COMMENT ON COLUMN public.products.chef_special IS 'Mark as chef special or daily special';
COMMENT ON COLUMN public.products.prep_time IS 'Preparation time in minutes';
COMMENT ON COLUMN public.products.portion_sizes IS 'Pricing for different portion sizes';

-- ============================================
-- 2. UPDATE ORDERS TABLE FOR RESTAURANT ORDERS
-- ============================================

-- Add restaurant-specific columns to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup', 'dine-in')),
ADD COLUMN IF NOT EXISTS table_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER DEFAULT 30;

-- Add comment
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: delivery, pickup, or dine-in';
COMMENT ON COLUMN public.orders.table_number IS 'Table number for dine-in orders';
COMMENT ON COLUMN public.orders.delivery_time IS 'Requested delivery or pickup time';
COMMENT ON COLUMN public.orders.special_instructions IS 'Customer special instructions (allergies, preferences, etc.)';
COMMENT ON COLUMN public.orders.estimated_prep_time IS 'Estimated preparation time in minutes';

-- Update order statuses to be more restaurant-friendly
-- Keep existing statuses but they now mean:
-- 'pending' → Order received
-- 'processing' → Preparing in kitchen
-- 'shipped' → Ready for pickup / Out for delivery
-- 'delivered' → Served / Delivered
-- 'cancelled' → Cancelled

-- ============================================
-- 3. UPDATE CATEGORIES FOR RESTAURANT
-- ============================================

-- Clear existing categories and add restaurant categories
DO $$
DECLARE
  appetizers_id UUID := gen_random_uuid();
  mains_id UUID := gen_random_uuid();
  desserts_id UUID := gen_random_uuid();
  beverages_id UUID := gen_random_uuid();
  specials_id UUID := gen_random_uuid();
BEGIN
  -- Only insert if categories table is empty or has less than 5 items
  IF (SELECT COUNT(*) FROM public.categories) < 5 THEN
    DELETE FROM public.categories;

    INSERT INTO public.categories (id, name, created_at, updated_at)
    VALUES
      (appetizers_id, 'Appetizers', NOW(), NOW()),
      (mains_id, 'Main Course', NOW(), NOW()),
      (desserts_id, 'Desserts', NOW(), NOW()),
      (beverages_id, 'Beverages', NOW(), NOW()),
      (specials_id, 'Chef Specials', NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 4. UPDATE STORE SETTINGS FOR RESTAURANT
-- ============================================

-- Update store_settings with restaurant-specific data
UPDATE public.store_settings
SET
  store_name = 'Star Café',
  store_description = 'Fine dining experience with fresh ingredients and exceptional service',
  tax_rate = 8.00,
  shipping_type = 'flat',
  shipping_cost = 5.00,
  free_shipping_threshold = 50.00,
  currency = 'USD',
  contact_email = 'contact@starcafe.com',
  contact_phone = '(555) 123-4567',
  return_policy = 'We guarantee 100% satisfaction. If you''re not happy with your order, please contact us within 1 hour of delivery for a refund or replacement.',
  updated_at = NOW()
WHERE id = (SELECT id FROM public.store_settings LIMIT 1);

-- If no store settings exist, create one
INSERT INTO public.store_settings (
  store_name,
  store_description,
  tax_rate,
  shipping_type,
  shipping_cost,
  free_shipping_threshold,
  currency,
  contact_email,
  contact_phone,
  return_policy,
  singleton_guard,
  created_at,
  updated_at
)
SELECT
  'Star Café',
  'Fine dining experience with fresh ingredients and exceptional service',
  8.00,
  'flat',
  5.00,
  50.00,
  'USD',
  'contact@starcafe.com',
  '(555) 123-4567',
  'We guarantee 100% satisfaction. If you''re not happy with your order, please contact us within 1 hour of delivery for a refund or replacement.',
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings LIMIT 1);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index on dietary_tags for filtering
CREATE INDEX IF NOT EXISTS idx_products_dietary_tags ON public.products USING GIN (dietary_tags);

-- Index on chef_special for quick filtering
CREATE INDEX IF NOT EXISTS idx_products_chef_special ON public.products (chef_special) WHERE chef_special = TRUE;

-- Index on order_type for restaurant order management
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders (order_type);

-- Index on delivery_time for scheduled orders
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time ON public.orders (delivery_time) WHERE delivery_time IS NOT NULL;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Run these queries in Supabase SQL Editor after migration:

-- Check products table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products'
-- AND column_name IN ('dietary_tags', 'spice_level', 'chef_special', 'prep_time', 'portion_sizes');

-- Check orders table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'orders'
-- AND column_name IN ('order_type', 'table_number', 'delivery_time', 'special_instructions', 'estimated_prep_time');

-- Check categories
-- SELECT * FROM public.categories ORDER BY name;

-- Check store settings
-- SELECT store_name, store_description, shipping_type, shipping_cost FROM public.store_settings;

-- ============================================
-- END OF MIGRATION
-- ============================================
