-- Check what image URLs are actually saved
SELECT
    name,
    image_url,
    LENGTH(image_url) as url_length
FROM menu_items
WHERE image_url IS NOT NULL
LIMIT 10;

-- Count how many have images
SELECT
    COUNT(*) as total_items,
    SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as with_images,
    SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as without_images
FROM menu_items;
