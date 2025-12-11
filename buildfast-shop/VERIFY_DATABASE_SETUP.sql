-- =====================================================
-- VERIFY DATABASE IS PROPERLY CONFIGURED
-- =====================================================
-- Run this to check your database setup and image URLs
-- =====================================================

-- 1. Check menu_items table structure
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'menu_items'
ORDER BY ordinal_position;

-- 2. Check RLS policies for menu_items
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'menu_items'
ORDER BY policyname;

-- 3. Check actual image URLs (first 5)
SELECT
    id,
    name,
    image_url,
    LENGTH(image_url) as url_length,
    CASE
        WHEN image_url LIKE '%pexels.com%' THEN 'Pexels Image'
        WHEN image_url LIKE '%placeholder%' THEN 'Placeholder'
        WHEN image_url IS NULL THEN 'No Image'
        ELSE 'Other Source'
    END as image_source
FROM menu_items
WHERE image_url IS NOT NULL
LIMIT 5;

-- 4. Count images by source
SELECT
    CASE
        WHEN image_url LIKE '%pexels.com%' THEN 'Pexels'
        WHEN image_url LIKE '%placeholder%' THEN 'Placeholder'
        WHEN image_url IS NULL THEN 'No Image'
        ELSE 'Other'
    END as source,
    COUNT(*) as count
FROM menu_items
GROUP BY source
ORDER BY count DESC;

-- 5. Check for broken Pexels URLs (with h=350)
SELECT
    COUNT(*) as broken_urls
FROM menu_items
WHERE image_url LIKE '%pexels.com%h=350%';

-- 6. Sample of good Pexels URLs (large2x format)
SELECT
    name,
    image_url
FROM menu_items
WHERE image_url LIKE '%pexels.com%'
  AND image_url NOT LIKE '%h=350%'
LIMIT 3;
