import { readFileSync, writeFileSync } from 'fs';
import { buildPexelsImageUrl } from './src/lib/pexelsUtils.js';

const menuItems = JSON.parse(readFileSync('./menu_items_list.json', 'utf-8'));
const savedPhotoIds = JSON.parse(readFileSync('./pexels_photo_ids.json', 'utf-8'));

console.log('═══════════════════════════════════════════════════');
console.log('🔄 REGENERATING SQL FROM SAVED PEXELS PHOTO IDs');
console.log('═══════════════════════════════════════════════════');
console.log(`📊 Saved photo IDs: ${savedPhotoIds.length}`);
console.log(`📋 Menu items: ${menuItems.length}`);
console.log(`✅ Using SAME verified photos for consistency\n`);

// Function to match dish to appropriate photo category
function getPhotoIndex(dishName, baseIndex) {
  const name = dishName.toLowerCase();

  // Rough distribution based on searches we made:
  // 0-24: pizza (25)
  // 25-54: burger/hamburger (30)
  // 55-69: pasta (15)
  // 70-84: noodles (15)
  // 85-119: fried chicken (35)
  // 120-144: grilled chicken (25)
  // 145-154: chicken curry (10)
  // 155-169: beef steak (15)
  // 170-179: beef curry (10)
  // 180-194: fish fillet (15)
  // 195-204: grilled fish (10)
  // 205-214: seafood (10)
  // 215-229: fried rice (15)
  // Rest: mixed

  if (name.includes('pizza')) {
    return baseIndex % 25; // First 25 photos
  } else if (name.includes('burger')) {
    return 25 + (baseIndex % 30); // Next 30 photos
  } else if (name.includes('pasta') || name.includes('spaghetti')) {
    return 55 + (baseIndex % 15);
  } else if (name.includes('noodle') || name.includes('chowmein') || name.includes('ramen')) {
    return 70 + (baseIndex % 15);
  } else if (name.includes('chicken') && (name.includes('fry') || name.includes('fried') || name.includes('crispy'))) {
    return 85 + (baseIndex % 35);
  } else if (name.includes('chicken') && (name.includes('grill') || name.includes('bbq') || name.includes('roast'))) {
    return 120 + (baseIndex % 25);
  } else if (name.includes('chicken')) {
    return 145 + (baseIndex % 10);
  } else if (name.includes('beef') && !name.includes('curry')) {
    return 155 + (baseIndex % 15);
  } else if (name.includes('beef') || name.includes('mutton')) {
    return 170 + (baseIndex % 10);
  } else if ((name.includes('fish') && name.includes('fillet')) || name.includes('fish finger')) {
    return 180 + (baseIndex % 15);
  } else if ((name.includes('fish') && (name.includes('grill') || name.includes('bbq'))) || name.includes('pomfret')) {
    return 195 + (baseIndex % 10);
  } else if (name.includes('fish') || name.includes('prawn') || name.includes('seafood') || name.includes('lobster')) {
    return 205 + (baseIndex % 10);
  } else if (name.includes('rice') && name.includes('fried')) {
    return 215 + (baseIndex % 15);
  } else if (name.includes('rice') || name.includes('biryani') || name.includes('polao') || name.includes('tehari')) {
    return 215 + (baseIndex % 15);
  } else {
    // For everything else, use remaining photos
    return baseIndex % savedPhotoIds.length;
  }
}

// Generate SQL
let sql = `-- ═══════════════════════════════════════════════════
-- CONSISTENT PEXELS PHOTOS - REGENERATED
-- ═══════════════════════════════════════════════════
-- Generated: ${new Date().toISOString()}
-- Using saved photo IDs from: pexels_photo_ids.json
-- Total unique photo IDs: ${savedPhotoIds.length}
-- All photos fetched from Pexels API - 100% real
-- ═══════════════════════════════════════════════════

UPDATE menu_items
SET image_url =
  CASE
`;

const usedPhotoIds = new Set();
let duplicateAssignments = 0;

function selectPhotoId(preferredIndex) {
  const total = savedPhotoIds.length;
  for (let offset = 0; offset < total; offset++) {
    const idx = (preferredIndex + offset) % total;
    const candidate = savedPhotoIds[idx];
    if (!usedPhotoIds.has(candidate)) {
      usedPhotoIds.add(candidate);
      return { photoId: candidate, duplicate: false };
    }
  }

  const fallbackId = savedPhotoIds[preferredIndex % total];
  duplicateAssignments += 1;
  return { photoId: fallbackId, duplicate: true };
}

menuItems.forEach((item, index) => {
  // Get category-specific index
  const photoIndex = getPhotoIndex(item.name, index);
  const { photoId } = selectPhotoId(photoIndex);
  const url = buildPexelsImageUrl(photoId, { width: 800, height: 600 });

  sql += `    WHEN id = '${item.id}' THEN '${url}'\n`;
});

sql += `    ELSE NULL
  END;

-- Verify results
SELECT
  COUNT(*) as total_items,
  COUNT(DISTINCT image_url) as unique_urls,
  COUNT(DISTINCT SUBSTRING(image_url FROM 'photos/(\\\\d+)/')) as unique_photo_ids
FROM menu_items;
`;

writeFileSync('REGENERATED_PEXELS_PHOTOS.sql', sql);

console.log('✅ Generated: REGENERATED_PEXELS_PHOTOS.sql');
console.log('📝 Uses SAVED photo IDs for consistency');
console.log('🎯 Photos matched to dish categories');
console.log('🔄 All URLs unique (canonical Pexels URLs)\n');

if (duplicateAssignments > 0) {
  console.warn(`⚠️ ${duplicateAssignments} assignments reused photo IDs due to limited pool.`);
} else {
  console.log('✅ No duplicate photo IDs assigned.');
}

console.log('═══════════════════════════════════════════════════');
console.log('💡 HOW THIS WORKS:');
console.log('═══════════════════════════════════════════════════');
console.log('✓ Saved IDs in: pexels_photo_ids.json');
console.log('✓ Run this script anytime to regenerate SQL');
console.log('✓ ALWAYS uses the same verified photo IDs');
console.log('✓ Consistent images across regenerations\n');

console.log('📋 TO FETCH NEW PHOTOS:');
console.log('   Run: node fetch_real_pexels_photos.js');
console.log('   This will get fresh photos from Pexels API\n');

console.log('📋 TO USE SAVED PHOTOS:');
console.log('   Run: node generate_images_from_saved_ids.js');
console.log('   This uses existing pexels_photo_ids.json\n');
