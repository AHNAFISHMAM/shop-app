-- =====================================================
-- ASSIGN MENU ITEMS TO SPECIAL SECTIONS
-- =====================================================
-- Assigns featured and popular items to special sections
-- so customers can see them on the Order page
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 Assigning menu items to special sections...';
END $$;

-- Mark featured items for "Today's Menu"
UPDATE menu_items
SET is_todays_menu = true
WHERE is_featured = true
  OR name ILIKE '%star special%'
  OR name ILIKE '%special%';

-- Mark biryani items as "Daily Specials"
UPDATE menu_items
SET is_daily_special = true
WHERE category_id IN (
  SELECT id FROM menu_categories WHERE name ILIKE '%biryani%'
)
LIMIT 10;

-- Mark some items as "New Dishes" (recently added)
UPDATE menu_items
SET is_new_dish = true
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 15;

-- Mark pizza items as "Discount Combos" (example)
UPDATE menu_items
SET is_discount_combo = true
WHERE category_id IN (
  SELECT id FROM menu_categories WHERE name ILIKE '%pizza%'
)
LIMIT 8;

-- Mark set menus as "Limited-Time Meals"
UPDATE menu_items
SET is_limited_time = true
WHERE category_id IN (
  SELECT id FROM menu_categories WHERE name ILIKE '%set menu%'
);

-- Mark appetizers and snacks for "Happy Hour"
UPDATE menu_items
SET is_happy_hour = true
WHERE category_id IN (
  SELECT id FROM menu_categories WHERE name ILIKE '%appetizer%' OR name ILIKE '%snack%'
)
LIMIT 12;

DO $$
BEGIN
  RAISE NOTICE '✅ Items assigned to special sections!';
  RAISE NOTICE 'Customers can now see special sections on Order page.';
END $$;
