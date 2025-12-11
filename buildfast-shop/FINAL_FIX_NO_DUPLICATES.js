import { readFileSync, writeFileSync } from 'fs';
import { buildPexelsImageUrl } from './src/lib/pexelsUtils.js';

const menuItems = JSON.parse(readFileSync('./menu_items_list.json', 'utf-8'));
const savedPhotoIds = JSON.parse(readFileSync('./pexels_photo_ids.json', 'utf-8'));

console.log('════════════════════════════════════════════════════════');
console.log('🔴 ROOT CAUSE: Same photos used for different pizza sizes');
console.log('════════════════════════════════════════════════════════');
console.log('Examples from your console:');
console.log('  - Meat Masala Pizza 8": 825661');
console.log('  - Meat Masala Pizza 10": 825661 ❌ DUPLICATE');
console.log('  - Meat Masala Pizza 12": 825661 ❌ DUPLICATE');
console.log('  - BBQ Chicken Pizza 8": 825661 ❌ DUPLICATE');
console.log('');
console.log('✅ SOLUTION: Every item gets unique photo ID');
console.log('════════════════════════════════════════════════════════\n');

console.log(`📊 Menu items: ${menuItems.length}`);
console.log(`📸 Available photo IDs: ${savedPhotoIds.length}`);

// Sort menu items by name to ensure consistency
const sortedItems = [...menuItems].sort((a, b) => a.name.localeCompare(b.name));

// GUARANTEE: Each item gets a different photo ID
// We have 231 photos for 203 items - more than enough!

let sql = `-- ════════════════════════════════════════════════════════
-- FINAL FIX: ZERO DUPLICATES GUARANTEED
-- ════════════════════════════════════════════════════════
-- Generated: ${new Date().toISOString()}
-- Strategy: Sequential assignment - every item gets unique ID
-- Photo IDs: ${savedPhotoIds.length} available
-- Menu Items: ${menuItems.length}
-- Result: ZERO duplicates guaranteed
-- ════════════════════════════════════════════════════════

UPDATE menu_items
SET image_url =
  CASE
`;

const photoIdUsage = new Map();
const usedPhotoIds = new Set();

sortedItems.forEach((item, index) => {
  // Simply assign photos sequentially - guaranteed unique
  const photoId = savedPhotoIds[index % savedPhotoIds.length];

  if (usedPhotoIds.has(photoId)) {
    throw new Error(`Photo ID ${photoId} is being reused. Ensure pexels_photo_ids.json has >= menu item count.`);
  }

  usedPhotoIds.add(photoId);

  // Track usage for verification
  if (!photoIdUsage.has(photoId)) {
    photoIdUsage.set(photoId, []);
  }
  photoIdUsage.get(photoId).push(item.name);

  // Generate URL
  const url = buildPexelsImageUrl(photoId, { width: 800, height: 600 });
  sql += `    WHEN id = '${item.id}' THEN '${url}'\n`;
});

sql += `    ELSE NULL
  END;

-- ════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════

-- Should show: 203 items, 203 unique photo IDs, 0 duplicates
SELECT
  COUNT(*) as total_items,
  COUNT(DISTINCT SUBSTRING(image_url FROM 'photos/(\\\\d+)/')) as unique_photo_ids,
  COUNT(*) - COUNT(DISTINCT SUBSTRING(image_url FROM 'photos/(\\\\d+)/')) as duplicates
FROM menu_items;

-- Show any photo IDs used more than once (should be empty!)
SELECT
  SUBSTRING(image_url FROM 'photos/(\\\\d+)/') as photo_id,
  COUNT(*) as times_used,
  STRING_AGG(name, ' | ') as items_using_this_photo
FROM menu_items
WHERE image_url IS NOT NULL
GROUP BY photo_id
HAVING COUNT(*) > 1
ORDER BY times_used DESC;

-- Show examples to verify different pizzas have different photos
SELECT
  name,
  SUBSTRING(image_url FROM 'photos/(\\\\d+)/') as photo_id
FROM menu_items
WHERE name LIKE '%Pizza%'
ORDER BY name;
`;

writeFileSync('FINAL_FIX_NO_DUPLICATES.sql', sql);

// Verify locally
console.log('\n📋 LOCAL VERIFICATION:');
console.log('════════════════════════════════════════════════════════');

const duplicatePhotos = Array.from(photoIdUsage.entries()).filter(([id, items]) => items.length > 1);

if (duplicatePhotos.length === 0) {
  console.log('✅ SUCCESS! NO DUPLICATES FOUND!');
  console.log(`✅ All ${sortedItems.length} items have unique photo IDs`);
} else {
  console.log(`❌ WARNING: ${duplicatePhotos.length} photo IDs used multiple times:`);
  duplicatePhotos.forEach(([photoId, items]) => {
    console.log(`   Photo ${photoId} used ${items.length} times:`);
    items.forEach(name => console.log(`      - ${name}`));
  });
}

console.log('\n════════════════════════════════════════════════════════');
console.log('✅ GENERATED: FINAL_FIX_NO_DUPLICATES.sql');
console.log('════════════════════════════════════════════════════════');
console.log('');
console.log('📋 NEXT STEPS (CRITICAL):');
console.log('1. Open FINAL_FIX_NO_DUPLICATES.sql');
console.log('2. Copy ALL the SQL');
console.log('3. Go to Supabase Dashboard → SQL Editor');
console.log('4. PASTE and RUN the SQL');
console.log('5. HARD REFRESH browser (Ctrl+Shift+R)');
console.log('6. Check console - should see different photo IDs\n');

console.log('🎯 GUARANTEE:');
console.log('   Every single item will have a DIFFERENT photo ID');
console.log('   No more 825661 used 5 times!');
console.log('   No more 2714722 used 6 times!\n');
