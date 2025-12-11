-- Check what URLs are actually in the database
SELECT
    name,
    LEFT(image_url, 100) as url_preview,
    CASE
        WHEN image_url IS NULL THEN '❌ NULL'
        WHEN image_url LIKE '%pexels%' THEN '✅ Pexels URL'
        WHEN image_url LIKE 'data:image%' THEN '📦 Placeholder'
        ELSE '❓ Unknown'
    END as url_type
FROM menu_items
WHERE image_url IS NOT NULL
ORDER BY name
LIMIT 10;
