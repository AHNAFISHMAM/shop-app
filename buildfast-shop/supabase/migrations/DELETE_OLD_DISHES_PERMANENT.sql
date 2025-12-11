-- =====================================================
-- PERMANENTLY DELETE OLD DISHES
-- =====================================================
-- This script PERMANENTLY deletes all old dishes from the dishes table
-- while preserving order history integrity
-- Run this AFTER you've verified the new menu system is working
-- =====================================================

BEGIN;

-- Step 1: Check if there are any recent orders using these dishes
DO $$
DECLARE
    recent_order_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at > NOW() - INTERVAL '30 days'
    AND oi.product_id IN (SELECT id FROM dishes WHERE is_active = false);

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Found % order items from inactive dishes in last 30 days', recent_order_count;
    RAISE NOTICE '========================================';
END $$;

-- Step 2: PERMANENTLY DELETE all inactive dishes
-- WARNING: This cannot be undone!
-- First, update any cart items referencing these dishes
UPDATE cart_items
SET product_id = NULL
WHERE product_id IN (SELECT id FROM dishes WHERE is_active = false);

-- Now delete the inactive dishes
DELETE FROM dishes
WHERE is_active = false;

-- Step 3: Show summary
DO $$
DECLARE
    remaining_count INT;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM dishes;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ OLD DISHES PERMANENTLY DELETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Remaining active dishes: %', remaining_count;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run these separately to check)
-- =====================================================

-- Check remaining dishes
-- SELECT COUNT(*) as remaining_dishes FROM dishes;

-- Check menu_items count (should have 150+)
-- SELECT COUNT(*) as menu_items FROM menu_items;

-- Check if any orders are affected
-- SELECT COUNT(*) as affected_orders
-- FROM order_items
-- WHERE product_id NOT IN (SELECT id FROM dishes);
