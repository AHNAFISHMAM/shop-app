-- ============================================================================
-- DEBUG: Why isn't my out-of-stock product showing in Low Stock Alerts?
-- Run these queries in Supabase SQL Editor to find the root cause
-- ============================================================================

-- STEP 1: Check ALL products and their stock levels
SELECT 
  id,
  name,
  stock_quantity,
  low_stock_threshold,
  category,
  CASE 
    WHEN stock_quantity IS NULL THEN '❌ NULL (Problem!)'
    WHEN stock_quantity = 0 THEN '🔴 OUT OF STOCK'
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '⚠️  LOW STOCK'
    ELSE '✅ WELL STOCKED'
  END as alert_status,
  CASE
    WHEN low_stock_threshold IS NULL THEN 'Using default (10)'
    ELSE low_stock_threshold::text
  END as threshold_info
FROM products
ORDER BY stock_quantity ASC NULLS FIRST;

-- ============================================================================
-- STEP 2: Check which products SHOULD appear in Low Stock Alerts
-- This mimics the exact logic in LowStockAlerts.jsx (lines 42-58)
-- ============================================================================

SELECT 
  id,
  name,
  stock_quantity,
  COALESCE(low_stock_threshold, 10) as effective_threshold,
  CASE 
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '✅ WILL SHOW IN DASHBOARD'
    ELSE '❌ Will NOT show (stock too high)'
  END as dashboard_status
FROM products
WHERE stock_quantity IS NOT NULL  -- Dashboard filters out NULL stock
ORDER BY stock_quantity ASC;

-- ============================================================================
-- STEP 3: Find the ROOT CAUSE if product has stock_quantity = 0 but not showing
-- ============================================================================

-- Check if stock_quantity is NULL (this is the #1 issue!)
SELECT 
  name,
  'stock_quantity is NULL - DASHBOARD FILTERS THIS OUT!' as problem,
  'Set stock_quantity = 0 to fix' as solution
FROM products
WHERE stock_quantity IS NULL;

-- Check if low_stock_threshold is too low
SELECT 
  name,
  stock_quantity,
  low_stock_threshold,
  'Threshold is lower than stock! Increase threshold or decrease stock' as problem
FROM products
WHERE stock_quantity IS NOT NULL
  AND stock_quantity > COALESCE(low_stock_threshold, 10);

-- ============================================================================
-- STEP 4: REAL-TIME SUBSCRIPTION CHECK
-- ============================================================================

-- Check if products table is enabled for real-time
SELECT 
  schemaname,
  tablename,
  'Real-time enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('products', 'variant_combinations');

-- If above returns EMPTY, real-time is NOT enabled!
-- Run this to enable it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE products;
-- ALTER PUBLICATION supabase_realtime ADD TABLE variant_combinations;

-- ============================================================================
-- STEP 5: THE FIX - Update your existing out-of-stock product
-- ============================================================================

-- Option A: If stock_quantity is NULL, set it to 0
UPDATE products
SET stock_quantity = 0
WHERE stock_quantity IS NULL
  AND name = 'YOUR_PRODUCT_NAME';  -- Replace with actual product name

-- Option B: Set low_stock_threshold to ensure it shows
UPDATE products
SET 
  low_stock_threshold = 10,
  stock_quantity = COALESCE(stock_quantity, 0)
WHERE stock_quantity <= 10
  OR stock_quantity IS NULL;

-- Option C: Update a SPECIFIC product by name
UPDATE products
SET 
  stock_quantity = 0,           -- Set to out of stock
  low_stock_threshold = 10      -- Ensure threshold is set
WHERE name ILIKE '%your product name%'  -- Replace with your product name
RETURNING id, name, stock_quantity, low_stock_threshold;

-- ============================================================================
-- STEP 6: VERIFY THE FIX
-- ============================================================================

-- After updating, check if it will now appear
SELECT 
  name,
  stock_quantity,
  low_stock_threshold,
  CASE 
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '✅ WILL SHOW'
    ELSE '❌ Will NOT show'
  END as will_show_in_dashboard
FROM products
WHERE stock_quantity IS NOT NULL
  AND stock_quantity <= COALESCE(low_stock_threshold, 10);

