-- =====================================================
-- ADD MENU_ITEM_ID TO CART_ITEMS - MIGRATION 051
-- =====================================================
-- Adds menu_item_id column to cart_items table
-- Allows cart to reference both new menu_items and old dishes
-- Maintains backward compatibility with existing orders
-- =====================================================

-- Add menu_item_id column (nullable for backward compatibility)
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item ON cart_items(menu_item_id);

-- Add check constraint: must have either product_id OR menu_item_id
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_product_or_menu_item_check
CHECK (
  (product_id IS NOT NULL AND menu_item_id IS NULL) OR
  (product_id IS NULL AND menu_item_id IS NOT NULL)
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cart integration migration complete!';
  RAISE NOTICE '📊 Added menu_item_id column to cart_items';
  RAISE NOTICE '🔗 Cart now supports both menu_items and dishes';
END $$;
