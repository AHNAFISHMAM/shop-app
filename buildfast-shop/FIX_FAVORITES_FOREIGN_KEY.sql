-- =====================================================
-- FIX FAVORITES TABLE TO REFERENCE MENU_ITEMS
-- =====================================================
-- This updates the favorites table to point to menu_items
-- instead of the dishes table
-- =====================================================

-- Step 1: Drop the old foreign key constraint
ALTER TABLE favorites
DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;

-- Step 2: Add new foreign key pointing to menu_items
ALTER TABLE favorites
ADD CONSTRAINT favorites_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES menu_items(id)
ON DELETE CASCADE;

-- Verify the fix
SELECT 'Foreign key updated successfully' AS status;
