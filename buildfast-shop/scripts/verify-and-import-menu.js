/**
 * Verify Menu State and Import Star Café Official Menu
 * This script checks the current menu state and can import the official menu data
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read Supabase credentials from environment or .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMenuState() {
  console.log('\n🔍 Checking current menu state...\n');

  // Check categories
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('*');

  if (catError) {
    console.error('❌ Error fetching categories:', catError);
    return null;
  }

  // Check menu items
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('*');

  if (itemsError) {
    console.error('❌ Error fetching menu items:', itemsError);
    return null;
  }

  console.log(`📊 Current State:`);
  console.log(`   Categories: ${categories?.length || 0}`);
  console.log(`   Menu Items: ${items?.length || 0}`);
  console.log('');

  // Show category names
  if (categories && categories.length > 0) {
    console.log(`📁 Categories:`);
    categories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .forEach((cat, idx) => {
        const itemCount = items?.filter(item => item.category_id === cat.id).length || 0;
        console.log(`   ${idx + 1}. ${cat.name} (${itemCount} items)`);
      });
    console.log('');
  }

  return { categories, items };
}

async function runMigration() {
  console.log('\n🚀 Running Star Café Official Menu Import...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '060_star_cafe_official_menu_import.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute via RPC (note: this requires the SQL to be run via Supabase admin)
    console.log('⚠️  Note: This script can only verify the current state.');
    console.log('⚠️  To run the migration, please use one of these methods:\n');
    console.log('   Method 1: Supabase Dashboard SQL Editor');
    console.log('   1. Go to https://supabase.com/dashboard/project/shgwzqhwoamcvruztfuz/sql/new');
    console.log('   2. Copy the content from: supabase/migrations/060_star_cafe_official_menu_import.sql');
    console.log('   3. Paste and run it in the SQL Editor\n');
    console.log('   Method 2: Supabase CLI (when database is active)');
    console.log('   Run: npx supabase db push --include-all\n');

    return false;
  } catch (error) {
    console.error('❌ Error reading migration file:', error);
    return false;
  }
}

// Main execution
(async () => {
  console.log('════════════════════════════════════════════');
  console.log('   Star Café Menu Verification Tool');
  console.log('════════════════════════════════════════════');

  const state = await checkMenuState();

  if (state) {
    const { categories, items } = state;

    // Check if we need to import
    const needsImport = (categories?.length || 0) < 24 || (items?.length || 0) < 200;

    if (needsImport) {
      console.log('⚠️  Official menu data not yet imported');
      console.log(`   Expected: 24 categories, 200+ items`);
      console.log(`   Current:  ${categories?.length || 0} categories, ${items?.length || 0} items\n`);
      await runMigration();
    } else {
      console.log('✅ Official menu data appears to be loaded!');
      console.log('   All categories and items are present.\n');
    }
  }

  console.log('════════════════════════════════════════════\n');
})();
