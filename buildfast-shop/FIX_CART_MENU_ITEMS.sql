-- =====================================================
-- FIX CART_ITEMS FOR MENU_ITEMS SUPPORT
-- =====================================================
-- Run this to fix cart_items table to support menu_items
-- =====================================================

-- Step 1: Add menu_item_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cart_items' AND column_name = 'menu_item_id'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added menu_item_id column';
  ELSE
    RAISE NOTICE '✓ menu_item_id column already exists';
  END IF;
END $$;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item ON cart_items(menu_item_id);

-- Step 3: Drop old restrictive constraint if it exists
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_or_menu_item_check;

-- Step 4: Make product_id nullable (for menu items)
ALTER TABLE cart_items ALTER COLUMN product_id DROP NOT NULL;

-- Step 5: Update RLS policies to allow menu_item_id inserts
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- Create comprehensive RLS policies
CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'cart_items'
AND column_name IN ('user_id', 'product_id', 'menu_item_id', 'quantity')
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cart items table fixed!';
  RAISE NOTICE '✅ menu_item_id column ready';
  RAISE NOTICE '✅ RLS policies updated';
  RAISE NOTICE '✅ You can now add menu items to cart!';
END $$;
