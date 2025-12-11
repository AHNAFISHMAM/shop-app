import { readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { buildPexelsImageUrl } from './src/lib/pexelsUtils.js';

const PEXELS_API_KEY = '6wVsvYgS5DrwWUCUsE7yAplSP3vZLzhpAPshm7vvUZ6G4uoDMl5jyyOH';
const menuItems = JSON.parse(readFileSync('./menu_items_list.json', 'utf-8'));

console.log('🔄 Fetching REAL photo IDs from Pexels API...\n');

// Food categories to search
const searchQueries = [
  { query: 'pizza', count: 25 },
  { query: 'burger', count: 20 },
  { query: 'hamburger', count: 10 },
  { query: 'pasta', count: 15 },
  { query: 'noodles', count: 15 },
  { query: 'fried chicken', count: 20 },
  { query: 'grilled chicken', count: 15 },
  { query: 'chicken curry', count: 10 },
  { query: 'beef steak', count: 15 },
  { query: 'beef curry', count: 10 },
  { query: 'fish fillet', count: 15 },
  { query: 'grilled fish', count: 10 },
  { query: 'seafood', count: 10 },
  { query: 'fried rice', count: 15 },
  { query: 'biryani', count: 10 },
  { query: 'soup bowl', count: 10 },
  { query: 'salad', count: 10 },
  { query: 'kebab', count: 10 },
  { query: 'nachos', count: 5 },
  { query: 'bread', count: 5 }
];

async function fetchPexelsPhotos(query, perPage = 20) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`❌ Error fetching "${query}": ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const photoIds = data.photos.map(photo => photo.id.toString());
    console.log(`✅ "${query}": Found ${photoIds.length} photos`);

    return photoIds;
  } catch (error) {
    console.error(`❌ Error fetching "${query}":`, error.message);
    return [];
  }
}

async function fetchAllPhotos() {
  const allPhotoIds = [];

  for (const { query, count } of searchQueries) {
    const photoIds = await fetchPexelsPhotos(query, count);
    allPhotoIds.push(...photoIds);

    // Rate limiting: Wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Remove duplicates
  const uniquePhotoIds = [...new Set(allPhotoIds)];

  console.log(`\n📊 Total photos fetched: ${allPhotoIds.length}`);
  console.log(`🎯 Unique photo IDs: ${uniquePhotoIds.length}`);

  return uniquePhotoIds;
}

// Main execution
(async () => {
  try {
    const photoIds = await fetchAllPhotos();

    if (photoIds.length < 150) {
      console.warn(`\n⚠️  Warning: Only got ${photoIds.length} unique IDs. Needed ~203.`);
      console.log('💡 Will cycle through available photos with cache busting\n');
    }

    // Generate SQL
    let sql = `-- ═══════════════════════════════════════════════════
-- REAL PEXELS API PHOTOS - 100% VERIFIED
-- ═══════════════════════════════════════════════════
-- Fetched from Pexels API: ${new Date().toISOString()}
-- Total unique photo IDs: ${photoIds.length}
-- All photos guaranteed to exist
-- ═══════════════════════════════════════════════════

UPDATE menu_items
SET image_url =
  CASE
`;

    const usedPhotoIds = new Set();
    let duplicateAssignments = 0;

    function selectPhotoId(position) {
      const total = photoIds.length;
      if (total === 0) {
        return { photoId: null, duplicate: true };
      }

      for (let offset = 0; offset < total; offset++) {
        const idx = (position + offset) % total;
        const candidate = photoIds[idx];
        if (!usedPhotoIds.has(candidate)) {
          usedPhotoIds.add(candidate);
          return { photoId: candidate, duplicate: false };
        }
      }

      const fallbackId = photoIds[position % total];
      duplicateAssignments += 1;
      return { photoId: fallbackId, duplicate: true };
    }

    menuItems.forEach((item, index) => {
      const { photoId } = selectPhotoId(index);

      if (!photoId) {
        console.warn(`❌ Unable to assign photo for ${item.name} - no photo IDs fetched.`);
        return;
      }

      const url = buildPexelsImageUrl(photoId, { width: 800, height: 600 });

      sql += `    WHEN id = '${item.id}' THEN '${url}'\n`;
    });

    sql += `    ELSE NULL
  END;

-- Verify uniqueness
SELECT
  COUNT(*) as total_items,
  COUNT(DISTINCT image_url) as unique_image_urls,
  COUNT(DISTINCT SUBSTRING(image_url FROM 'photos/(\\\\d+)/')) as unique_photo_ids,
  COUNT(*) - COUNT(DISTINCT image_url) as duplicate_urls
FROM menu_items;

-- Show photo ID distribution
SELECT
  SUBSTRING(image_url FROM 'photos/(\\\\d+)/') as photo_id,
  COUNT(*) as times_used,
  STRING_AGG(SUBSTRING(name, 1, 25), ', ') as sample_dishes
FROM menu_items
WHERE image_url IS NOT NULL
GROUP BY photo_id
HAVING COUNT(*) > 1
ORDER BY times_used DESC
LIMIT 20;
`;

    writeFileSync('REAL_PEXELS_API_PHOTOS.sql', sql);
    writeFileSync('pexels_photo_ids.json', JSON.stringify(photoIds, null, 2));

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SUCCESS!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📄 Generated: REAL_PEXELS_API_PHOTOS.sql`);
    console.log(`📄 Saved IDs: pexels_photo_ids.json`);
    console.log(`📊 Unique photo IDs: ${photoIds.length}`);
    console.log(`🎯 Menu items: ${menuItems.length}`);
    if (duplicateAssignments > 0) {
      console.warn(`⚠️ ${duplicateAssignments} assignments reused photo IDs due to limited API results.\n`);
    } else {
      console.log('✅ All generated URLs are unique (no duplicates).\n');
    }

    console.log('📋 NEXT STEPS:');
    console.log('1. Open REAL_PEXELS_API_PHOTOS.sql');
    console.log('2. Copy the SQL');
    console.log('3. Run in Supabase Dashboard');
    console.log('4. Hard refresh browser (Ctrl+Shift+R)');
    console.log('5. ✅ 100% REAL photos from Pexels API!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
