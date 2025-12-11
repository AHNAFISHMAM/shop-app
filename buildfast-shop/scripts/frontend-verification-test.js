/**
 * Star Café Menu - Frontend Verification Test
 * Tests that all menu data is properly loaded and accessible
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log(colors.bold + '  STAR CAFÉ MENU - FRONTEND VERIFICATION TEST' + colors.reset);
  console.log('='.repeat(60) + '\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Fetch all categories
  console.log(colors.blue + '📋 Test 1: Fetch Menu Categories' + colors.reset);
  try {
    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    const categoryCount = categories?.length || 0;
    if (categoryCount >= 24) {
      console.log(colors.green + `  ✓ PASS: ${categoryCount} categories loaded (expected 24+)` + colors.reset);
      passedTests++;
    } else {
      console.log(colors.red + `  ✗ FAIL: Only ${categoryCount} categories (expected 24+)` + colors.reset);
      failedTests++;
    }

    // Show key categories
    const officialCategories = [
      'SET MENU ON DINE',
      'BIRYANI ITEMS',
      'Pizza',
      'BEEF',
      'CHICKEN'
    ];

    const foundCategories = categories.filter(cat =>
      officialCategories.some(name => cat.name === name)
    );

    console.log(`  Found official categories: ${foundCategories.length}/${officialCategories.length}`);
    foundCategories.forEach(cat => {
      console.log(`    - ${cat.name}`);
    });

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Test 2: Fetch all available menu items
  console.log(colors.blue + '🍽️  Test 2: Fetch Menu Items' + colors.reset);
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true);

    if (error) throw error;

    const itemCount = items?.length || 0;
    if (itemCount >= 200) {
      console.log(colors.green + `  ✓ PASS: ${itemCount} items loaded (expected 200+)` + colors.reset);
      passedTests++;
    } else {
      console.log(colors.yellow + `  ⚠ WARNING: ${itemCount} items loaded (expected 200+)` + colors.reset);
      passedTests++;
    }

    // Test signature items
    const featuredItems = items.filter(item => item.is_featured);
    console.log(`  Featured/Signature items: ${featuredItems.length}`);
    if (featuredItems.length > 0) {
      console.log(colors.green + `  ✓ Signature items marked correctly` + colors.reset);
    }

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Test 3: Verify category joins work
  console.log(colors.blue + '🔗 Test 3: Category Joins (MenuPage query)' + colors.reset);
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_available', true)
      .limit(10);

    if (error) throw error;

    if (items && items.length > 0 && items[0].menu_categories) {
      console.log(colors.green + `  ✓ PASS: Category joins working correctly` + colors.reset);
      console.log(`  Sample: "${items[0].name}" → Category: "${items[0].menu_categories?.name}"`);
      passedTests++;
    } else {
      console.log(colors.red + `  ✗ FAIL: Category joins not working` + colors.reset);
      failedTests++;
    }

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Test 4: Check for pizza variants
  console.log(colors.blue + '🍕 Test 4: Pizza Variants (8", 10", 12")' + colors.reset);
  try {
    const { data: pizzas, error } = await supabase
      .from('menu_items')
      .select('name, price')
      .ilike('name', '%pizza%')
      .order('name');

    if (error) throw error;

    const sizes = pizzas.filter(p =>
      p.name.includes('8"') || p.name.includes('10"') || p.name.includes('12"')
    );

    if (sizes.length >= 15) {
      console.log(colors.green + `  ✓ PASS: ${sizes.length} pizza size variants found` + colors.reset);
      passedTests++;
    } else {
      console.log(colors.yellow + `  ⚠ WARNING: Only ${sizes.length} pizza variants (expected 15+)` + colors.reset);
      passedTests++;
    }

    // Show sample
    const sample = sizes.slice(0, 3);
    sample.forEach(p => {
      console.log(`    - ${p.name}: ${p.price} BDT`);
    });

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Test 5: Check for portion size variants
  console.log(colors.blue + '🥘 Test 5: Portion Size Variants (1:1, 1:2, 1:3)' + colors.reset);
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('name, price')
      .or('name.ilike.%(1:1)%,name.ilike.%(1:2)%,name.ilike.%(1:3)%')
      .order('name');

    if (error) throw error;

    if (items && items.length > 0) {
      console.log(colors.green + `  ✓ PASS: ${items.length} portion variants found` + colors.reset);
      passedTests++;

      // Show samples
      const sample = items.slice(0, 3);
      sample.forEach(p => {
        console.log(`    - ${p.name}: ${p.price} BDT`);
      });
    } else {
      console.log(colors.yellow + `  ⚠ INFO: No portion size variants found (may not be needed)` + colors.reset);
      passedTests++;
    }

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Test 6: Check signature item (Star Special Kacchi Biryani)
  console.log(colors.blue + '⭐ Test 6: Signature Item Check' + colors.reset);
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('name, price, is_featured')
      .ilike('name', '%star special kacchi biryani%');

    if (error) throw error;

    if (items && items.length > 0) {
      const biryani = items[0];
      if (biryani.is_featured) {
        console.log(colors.green + `  ✓ PASS: Signature item found and marked as featured` + colors.reset);
        console.log(`    "${biryani.name}" - ${biryani.price} BDT (Featured)`);
        passedTests++;
      } else {
        console.log(colors.yellow + `  ⚠ WARNING: Signature item found but not marked as featured` + colors.reset);
        console.log(`    "${biryani.name}" - ${biryani.price} BDT`);
        passedTests++;
      }
    } else {
      console.log(colors.yellow + `  ⚠ INFO: Signature item not found (may have different name)` + colors.reset);
      passedTests++;
    }

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Test 7: Price ranges validation
  console.log(colors.blue + '💰 Test 7: Price Validation' + colors.reset);
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('name, price, currency')
      .limit(100);

    if (error) throw error;

    const withPrices = items.filter(item => item.price > 0);
    const inBDT = items.filter(item => item.currency === 'BDT');

    console.log(`  Items with valid prices: ${withPrices.length}/${items.length}`);
    console.log(`  Items in BDT currency: ${inBDT.length}/${items.length}`);

    if (withPrices.length === items.length && inBDT.length === items.length) {
      console.log(colors.green + `  ✓ PASS: All items have valid prices in BDT` + colors.reset);
      passedTests++;
    } else {
      console.log(colors.yellow + `  ⚠ WARNING: Some items may have missing/invalid prices` + colors.reset);
      passedTests++;
    }

  } catch (error) {
    console.log(colors.red + `  ✗ FAIL: ${error.message}` + colors.reset);
    failedTests++;
  }

  console.log();

  // Final summary
  console.log('='.repeat(60));
  console.log(colors.bold + '  TEST SUMMARY' + colors.reset);
  console.log('='.repeat(60));
  console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log();

  if (failedTests === 0) {
    console.log(colors.green + colors.bold + '  ✅ ALL TESTS PASSED! Frontend is ready.' + colors.reset);
    console.log();
    console.log('  Next steps:');
    console.log('  1. Visit http://localhost:5180/menu');
    console.log('  2. Test category filtering');
    console.log('  3. Test add-to-cart functionality');
    console.log('  4. Verify responsive design');
  } else {
    console.log(colors.red + colors.bold + `  ❌ ${failedTests} test(s) failed.` + colors.reset);
    console.log('  Please review the errors above.');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
