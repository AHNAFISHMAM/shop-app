-- ============================================================================
-- FIX YOUR OUT-OF-STOCK PRODUCT - RUN THIS NOW
-- ============================================================================

-- STEP 1: Find ALL your products and see which ones should show
-- Copy this output and send it to me if you want more help
SELECT 
  name,
  stock_quantity,
  low_stock_threshold,
  CASE 
    WHEN stock_quantity IS NULL THEN '❌ NULL - Dashboard filters this out!'
    WHEN stock_quantity = 0 THEN '🔴 OUT OF STOCK - Should show if threshold >= 0'
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '⚠️  LOW STOCK - Should show'
    ELSE '✅ WELL STOCKED - Will NOT show'
  END as dashboard_status
FROM products
ORDER BY stock_quantity ASC NULLS FIRST;

-- ============================================================================
-- STEP 2: FIX ALL PRODUCTS WITH NULL STOCK
-- This is the #1 reason products don't show!
-- ============================================================================

UPDATE products
SET stock_quantity = 0  -- Change NULL to 0
WHERE stock_quantity IS NULL;

-- ============================================================================
-- STEP 3: ENSURE ALL PRODUCTS HAVE THRESHOLD SET
-- ============================================================================

UPDATE products
SET low_stock_threshold = 10  -- Set default threshold
WHERE low_stock_threshold IS NULL OR low_stock_threshold = 0;

-- ============================================================================
-- STEP 4: VERIFY YOUR OUT-OF-STOCK PRODUCTS WILL NOW SHOW
-- ============================================================================

SELECT 
  name,
  stock_quantity,
  low_stock_threshold,
  '✅ This WILL appear in Low Stock Alerts' as status
FROM products
WHERE stock_quantity IS NOT NULL
  AND stock_quantity <= COALESCE(low_stock_threshold, 10)
ORDER BY stock_quantity ASC;

-- ============================================================================
-- RESULT: You should see your out-of-stock products listed above!
-- If you do, go to http://localhost:5177/admin and hard refresh (CTRL+SHIFT+R)
-- ============================================================================

