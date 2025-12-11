-- Quick check: How many menu items do you have?

SELECT
    'CURRENT DATABASE STATE' as info,
    COUNT(*) as total_menu_items
FROM menu_items;

-- Show breakdown
SELECT
    'WITH vs WITHOUT IMAGES' as info,
    SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as with_images,
    SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as without_images
FROM menu_items;

-- If you only have 20 items, you need to run COMPLETE_STAR_CAFE_SEED.sql!
