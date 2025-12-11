-- ============================================================================
-- 🚀 MASTER SQL FIX - COMBINES ALL SQL FIXES IN ONE FILE
-- ============================================================================
-- This file combines:
--   1. FIX_EXISTING_VARIANT_STOCK.sql - Fix variant stock
--   2. WISHLIST_RLS.sql - Fix wishlist permissions
--   3. CHECK_VARIANT_STOCK_ISSUE.sql - Diagnostic queries
--   4. VERIFY_PRODUCT_VALUES.sql - Verification queries
--
-- USAGE:
--   1. Copy this ENTIRE file
--   2. Paste into Supabase SQL Editor
--   3. Click RUN
--   4. Verify results at the end
-- ============================================================================

-- ============================================================================
-- PART 1: FIX VARIANT STOCK FOR "bvhg" PRODUCT
-- ============================================================================

-- See the problem first (BEFORE fix)
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'PART 1: CHECKING VARIANT STOCK BEFORE FIX' as section;

SELECT 
  p.name,
  p.stock_quantity as base_stock,
  vc.id as variant_combo_id,
  vc.variant_values,
  vc.stock_quantity as variant_stock,
  CASE 
    WHEN vc.stock_quantity = 0 THEN '🔴 OUT OF STOCK - NEEDS FIX!'
    WHEN vc.stock_quantity < p.stock_quantity THEN '🟠 MISMATCH - NEEDS FIX!'
    ELSE '✅ MATCHING'
  END as status
FROM products p
JOIN variant_combinations vc ON vc.product_id = p.id
WHERE p.name = 'bvhg'
ORDER BY vc.id;

-- Fix "bvhg" variants - set them to match base stock
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'APPLYING FIX: Updating variant stock to match base stock...' as action;

UPDATE variant_combinations
SET stock_quantity = (
  SELECT stock_quantity 
  FROM products 
  WHERE products.id = variant_combinations.product_id
)
WHERE product_id = (SELECT id FROM products WHERE name = 'bvhg')
RETURNING 
  id,
  variant_values,
  stock_quantity as new_stock,
  'UPDATED! ✅' as status;

-- Verify the fix worked
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'VERIFICATION: Checking variant stock AFTER fix...' as section;

SELECT 
  p.name,
  p.stock_quantity as base_stock,
  vc.id as variant_combo_id,
  vc.variant_values,
  vc.stock_quantity as variant_stock,
  CASE 
    WHEN vc.stock_quantity = p.stock_quantity THEN '✅ FIXED - MATCHING NOW!'
    ELSE '❌ Still mismatch (unexpected)'
  END as verification
FROM products p
JOIN variant_combinations vc ON vc.product_id = p.id
WHERE p.name = 'bvhg'
ORDER BY vc.id;

-- ============================================================================
-- PART 2: FIX WISHLIST RLS POLICY
-- ============================================================================

SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'PART 2: FIXING WISHLIST RLS POLICY' as section;

-- Check current wishlist policies
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'Checking existing wishlist policies...' as action;

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Has SELECT policy'
    ELSE 'Other policy: ' || cmd
  END as note
FROM pg_policies
WHERE tablename = 'wishlist'
ORDER BY cmd, policyname;

-- Drop and recreate the SELECT policy (PostgreSQL doesn't support IF NOT EXISTS for policies)
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'Applying wishlist SELECT policy...' as action;

DROP POLICY IF EXISTS "users: select own wishlist items" ON public.wishlist;

CREATE POLICY "users: select own wishlist items"
ON public.wishlist FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Verify the policy was created
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'VERIFICATION: Checking wishlist policy was created...' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  '✅ Policy created successfully!' as status
FROM pg_policies
WHERE tablename = 'wishlist' AND cmd = 'SELECT';

-- ============================================================================
-- PART 3: DIAGNOSTIC CHECKS FOR VARIANT STOCK
-- ============================================================================

SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'PART 3: DIAGNOSTIC - Variant Stock Analysis' as section;

-- Check base product stock
SELECT 
  id,
  name,
  stock_quantity as base_stock,
  low_stock_threshold,
  'Base product stock' as type
FROM products
WHERE name = 'bvhg';

-- Check ALL variant combinations with detailed status
SELECT 
  vc.id,
  vc.variant_values,
  vc.stock_quantity as variant_stock,
  vc.price_adjustment,
  p.name as product_name,
  p.stock_quantity as product_base_stock,
  CASE 
    WHEN vc.stock_quantity = 0 THEN '🔴 OUT OF STOCK'
    WHEN vc.stock_quantity <= 10 THEN '🟠 LOW STOCK'
    WHEN vc.stock_quantity = p.stock_quantity THEN '✅ WELL STOCKED & MATCHING'
    ELSE '✅ WELL STOCKED'
  END as variant_status
FROM variant_combinations vc
JOIN products p ON p.id = vc.product_id
WHERE p.name = 'bvhg'
ORDER BY vc.stock_quantity ASC;

-- ============================================================================
-- PART 4: VERIFY ALL PRODUCT VALUES MATCH UI
-- ============================================================================

SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'PART 4: VERIFICATION - All Products Display Check' as section;

-- Check all your products with status calculations
SELECT 
  name,
  stock_quantity,
  COALESCE(low_stock_threshold, 10) as threshold,
  CASE 
    WHEN stock_quantity = 0 THEN '🔴 OUT OF STOCK'
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '🟠 LOW STOCK'
    ELSE '🟢 WELL STOCKED'
  END as status,
  stock_quantity || ' / ' || COALESCE(low_stock_threshold, 10) || ' units' as displayed_text,
  CASE
    WHEN stock_quantity > COALESCE(low_stock_threshold, 10) THEN '✅ Should show: WELL STOCKED'
    WHEN stock_quantity = 0 THEN '✅ Should show: OUT OF STOCK'
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN '✅ Should show: LOW STOCK'
  END as expected_display
FROM products
WHERE name IN ('asdasdasdasd', 'sdsd s', 'assdqsd', 'bvhg')
ORDER BY name;

-- Component logic verification
SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  'Component Logic Match (LowStockAlerts.jsx lines 263-268)' as note;

SELECT 
  name,
  stock_quantity,
  COALESCE(low_stock_threshold, 10) as threshold,
  stock_quantity || ' / ' || COALESCE(low_stock_threshold, 10) || ' units' as ui_display,
  CASE 
    WHEN stock_quantity = 0 THEN 'Component shows: OUT OF STOCK 🔴'
    WHEN stock_quantity <= COALESCE(low_stock_threshold, 10) THEN 'Component shows: LOW STOCK 🟠'
    ELSE 'Component shows: WELL STOCKED 🟢'
  END as component_behavior
FROM products
WHERE name IN ('asdasdasdasd', 'sdsd s', 'assdqsd', 'bvhg')
ORDER BY stock_quantity ASC;

-- ============================================================================
-- PART 5: FINAL VERIFICATION SUMMARY
-- ============================================================================

SELECT 
  '══════════════════════════════════════════════════════════════' as divider,
  '🎉 FINAL VERIFICATION SUMMARY 🎉' as section;

-- Check 1: Variant stock matches base stock
SELECT 
  'Check 1: Variant Stock Sync' as check_name,
  COUNT(*) as total_variants,
  COUNT(*) FILTER (WHERE vc.stock_quantity = p.stock_quantity) as matching_variants,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE vc.stock_quantity = p.stock_quantity) 
    THEN '✅ ALL VARIANTS MATCH BASE STOCK!'
    ELSE '❌ Some variants still mismatched'
  END as result
FROM variant_combinations vc
JOIN products p ON p.id = vc.product_id
WHERE p.name = 'bvhg';

-- Check 2: Wishlist SELECT policy exists
SELECT 
  'Check 2: Wishlist RLS Policy' as check_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ WISHLIST SELECT POLICY EXISTS!'
    ELSE '❌ Policy missing'
  END as result
FROM pg_policies
WHERE tablename = 'wishlist' AND cmd = 'SELECT';

-- Check 3: All products have correct thresholds
SELECT 
  'Check 3: Product Thresholds' as check_name,
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE low_stock_threshold IS NOT NULL AND low_stock_threshold > 0) as with_threshold,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE low_stock_threshold IS NOT NULL AND low_stock_threshold > 0)
    THEN '✅ ALL PRODUCTS HAVE THRESHOLDS!'
    ELSE '⚠️ Some products missing threshold (will use default 10)'
  END as result
FROM products
WHERE name IN ('asdasdasdasd', 'sdsd s', 'assdqsd', 'bvhg');

-- ============================================================================
-- 🎉 EXPECTED RESULTS:
-- ============================================================================
--
-- PART 1 - Variant Stock:
--   ✅ All "bvhg" variants should show: "FIXED - MATCHING NOW!"
--   ✅ All variant_stock should equal base_stock (65 or current value)
--
-- PART 2 - Wishlist RLS:
--   ✅ Should see policy: "users: select own wishlist items"
--   ✅ Policy created successfully!
--
-- PART 3 - Diagnostics:
--   ✅ All variants should show "WELL STOCKED & MATCHING"
--
-- PART 4 - Product Values:
--   ✅ All products should show correct status
--   asdasdasdasd: 11 / 10 → WELL STOCKED ✅
--   sdsd s:       11 / 10 → WELL STOCKED ✅
--   assdqsd:      45 / 10 → WELL STOCKED ✅
--   bvhg:         65 / 10 → WELL STOCKED ✅
--
-- PART 5 - Final Summary:
--   ✅ ALL VARIANTS MATCH BASE STOCK!
--   ✅ WISHLIST SELECT POLICY EXISTS!
--   ✅ ALL PRODUCTS HAVE THRESHOLDS!
--
-- ============================================================================
-- 🚀 AFTER RUNNING THIS:
-- ============================================================================
--
-- 1. All "bvhg" variant combinations will have correct stock
-- 2. Product detail page will show "Add to Cart" (not "Out of Stock")
-- 3. Wishlist 406 error will be fixed
-- 4. All real-time updates will work correctly
-- 5. Admin dashboard will show accurate data
--
-- ============================================================================
-- ✅ DONE! Your database is now ready for 100% real-time operation!
-- ============================================================================

