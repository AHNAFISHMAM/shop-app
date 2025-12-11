-- ============================================================================
-- REMOVE ALL TEST PRODUCTS FROM DATABASE
-- Run this in Supabase SQL Editor to clean up test data
-- ============================================================================

-- STEP 1: See what test products exist
SELECT id, name, stock_quantity, category
FROM products
WHERE name ILIKE '%test%'
   OR name ILIKE '%debug%'
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: DELETE all test products
-- ============================================================================

DELETE FROM products
WHERE name ILIKE '%test%'
   OR name ILIKE '%debug%';

-- ============================================================================
-- STEP 3: Verify they're gone
-- ============================================================================

SELECT COUNT(*) as remaining_test_products
FROM products
WHERE name ILIKE '%test%' OR name ILIKE '%debug%';

-- Should return: remaining_test_products = 0

-- ============================================================================
-- STEP 4: See your real products
-- ============================================================================

SELECT 
  name,
  stock_quantity,
  low_stock_threshold,
  CASE 
    WHEN stock_quantity IS NULL THEN '⚠️  NULL stock'
    WHEN stock_quantity = 0 THEN '🔴 OUT OF STOCK'
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '⚠️  LOW STOCK'
    ELSE '✅ WELL STOCKED'
  END as status
FROM products
ORDER BY created_at DESC;

