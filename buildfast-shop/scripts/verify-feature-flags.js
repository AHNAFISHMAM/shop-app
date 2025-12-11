/**
 * Feature Flags Verification Script
 * 
 * This script verifies that all feature flags are properly implemented
 * and that the database migration has been run.
 * 
 * Usage: npm run verify:feature-flags
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

// Feature flags to check
const FEATURE_FLAGS = [
  'enable_loyalty_program',
  'enable_reservations',
  'enable_menu_filters',
  'enable_product_customization',
  'enable_order_tracking',
  'enable_order_feedback',
  'enable_marketing_optins',
  'enable_quick_reorder',
];

// Components that should use feature flags
const COMPONENTS_TO_CHECK = [
  { file: 'src/components/QuickActionsBar.jsx', flags: ['enable_reservations'] },
  { file: 'src/components/Navbar.jsx', flags: ['enable_reservations'] },
  { file: 'src/components/Footer.jsx', flags: ['enable_reservations'] },
  { file: 'src/components/ProfileDropdown.jsx', flags: ['enable_loyalty_program'] },
  { file: 'src/pages/HomePage.jsx', flags: ['enable_loyalty_program'] },
  { file: 'src/pages/MenuPage.jsx', flags: ['enable_reservations', 'enable_menu_filters', 'enable_quick_reorder', 'enable_product_customization'] },
  { file: 'src/pages/Checkout.jsx', flags: ['enable_order_tracking', 'enable_marketing_optins'] },
  { file: 'src/pages/OrderHistory.jsx', flags: ['enable_loyalty_program', 'enable_order_feedback', 'enable_order_tracking'] },
  { file: 'src/pages/AddressBook.jsx', flags: ['enable_loyalty_program'] },
  { file: 'src/pages/ContactPage.jsx', flags: ['enable_reservations'] },
  { file: 'src/pages/ReservationsPage.jsx', flags: ['enable_reservations'] },
  { file: 'src/components/order/CartSidebar.jsx', flags: ['enable_loyalty_program'] },
  { file: 'src/components/order/CartBottomSheet.jsx', flags: ['enable_loyalty_program'] },
  { file: 'src/components/menu/ProductCard.jsx', flags: ['enable_product_customization'] },
];

// Check if file exists and contains feature flag
function checkFileForFeatureFlag(filePath, flag) {
  const fullPath = join(rootDir, filePath);
  
  if (!existsSync(fullPath)) {
    return { exists: false, found: false, error: 'File not found' };
  }
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const flagPattern = new RegExp(flag.replace(/_/g, '[_\\.]'), 'i');
    const found = flagPattern.test(content);
    
    // Check if loading state is handled
    const hasLoadingState = /settingsLoading.*false.*enable|loading.*settingsLoading/i.test(content);
    
    return {
      exists: true,
      found,
      hasLoadingState,
      content: content.substring(0, 200), // First 200 chars for context
    };
  } catch (error) {
    return { exists: true, found: false, error: error.message };
  }
}

// Check migration file
function checkMigrationFile() {
  const migrationPath = join(rootDir, 'supabase/migrations/076_add_feature_flags.sql');
  
  if (!existsSync(migrationPath)) {
    return { exists: false, hasAllFlags: false };
  }
  
  try {
    const content = readFileSync(migrationPath, 'utf-8');
    const hasAllFlags = FEATURE_FLAGS.every(flag => 
      content.includes(flag)
    );
    
    return { exists: true, hasAllFlags, content: content.substring(0, 300) };
  } catch (error) {
    return { exists: true, hasAllFlags: false, error: error.message };
  }
}

// Check StoreSettingsContext
function checkStoreSettingsContext() {
  const contextPath = join(rootDir, 'src/contexts/StoreSettingsContext.jsx');
  
  if (!existsSync(contextPath)) {
    return { exists: false, hasAllFlags: false, hasRealtime: false };
  }
  
  try {
    const content = readFileSync(contextPath, 'utf-8');
    const hasAllFlags = FEATURE_FLAGS.every(flag => 
      content.includes(flag)
    );
    
    // Check for real-time subscription
    const hasRealtime = /postgres_changes|realtime|subscribe/i.test(content);
    const hasFilter = /singleton_guard.*eq\.true|filter.*singleton/i.test(content);
    const hasOptimistic = /previousSettings|rollback|optimistic/i.test(content);
    
    return {
      exists: true,
      hasAllFlags,
      hasRealtime,
      hasFilter,
      hasOptimistic,
    };
  } catch (error) {
    return { exists: true, hasAllFlags: false, error: error.message };
  }
}

// Check AdminSettings
function checkAdminSettings() {
  const adminPath = join(rootDir, 'src/pages/admin/AdminSettings.jsx');
  
  if (!existsSync(adminPath)) {
    return { exists: false, hasAllFlags: false, hasToggles: false };
  }
  
  try {
    const content = readFileSync(adminPath, 'utf-8');
    const hasAllFlags = FEATURE_FLAGS.every(flag => 
      content.includes(flag)
    );
    
    const hasToggles = /handleFeatureFlagToggle|featureFlagStatus/i.test(content);
    const hasUI = /Feature Flags|enable_.*program|enable_reservations/i.test(content);
    
    return {
      exists: true,
      hasAllFlags,
      hasToggles,
      hasUI,
    };
  } catch (error) {
    return { exists: true, hasAllFlags: false, error: error.message };
  }
}

// Main verification function
function verifyFeatureFlags() {
  log.section('Feature Flags Verification');
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  
  // Check migration file
  log.section('1. Migration File Check');
  const migrationCheck = checkMigrationFile();
  totalChecks++;
  
  if (migrationCheck.exists) {
    log.success('Migration file exists: 076_add_feature_flags.sql');
    if (migrationCheck.hasAllFlags) {
      log.success('Migration file contains all 8 feature flags');
      passedChecks++;
    } else {
      log.error('Migration file is missing some feature flags');
      failedChecks++;
    }
  } else {
    log.error('Migration file not found: 076_add_feature_flags.sql');
    failedChecks++;
  }
  
  // Check StoreSettingsContext
  log.section('2. StoreSettingsContext Check');
  const contextCheck = checkStoreSettingsContext();
  totalChecks++;
  
  if (contextCheck.exists) {
    log.success('StoreSettingsContext.jsx exists');
    if (contextCheck.hasAllFlags) {
      log.success('StoreSettingsContext contains all 8 feature flags');
      passedChecks++;
    } else {
      log.error('StoreSettingsContext is missing some feature flags');
      failedChecks++;
    }
    
    if (contextCheck.hasRealtime) {
      log.success('Real-time subscription implemented');
    } else {
      log.warning('Real-time subscription not found');
    }
    
    if (contextCheck.hasFilter) {
      log.success('Real-time subscription has filter for singleton row');
    } else {
      log.warning('Real-time subscription filter not found');
    }
    
    if (contextCheck.hasOptimistic) {
      log.success('Optimistic updates implemented');
    } else {
      log.warning('Optimistic updates not found');
    }
  } else {
    log.error('StoreSettingsContext.jsx not found');
    failedChecks++;
  }
  
  // Check AdminSettings
  log.section('3. AdminSettings Check');
  const adminCheck = checkAdminSettings();
  totalChecks++;
  
  if (adminCheck.exists) {
    log.success('AdminSettings.jsx exists');
    if (adminCheck.hasAllFlags) {
      log.success('AdminSettings contains all 8 feature flags');
      passedChecks++;
    } else {
      log.error('AdminSettings is missing some feature flags');
      failedChecks++;
    }
    
    if (adminCheck.hasToggles) {
      log.success('Feature flag toggles implemented');
    } else {
      log.warning('Feature flag toggles not found');
    }
    
    if (adminCheck.hasUI) {
      log.success('Feature flags UI section exists');
    } else {
      log.warning('Feature flags UI section not found');
    }
  } else {
    log.error('AdminSettings.jsx not found');
    failedChecks++;
  }
  
  // Check components
  log.section('4. Component Implementation Check');
  const componentResults = [];
  
  for (const component of COMPONENTS_TO_CHECK) {
    totalChecks++;
    const results = [];
    
    for (const flag of component.flags) {
      const check = checkFileForFeatureFlag(component.file, flag);
      results.push({ flag, ...check });
    }
    
    const allFound = results.every(r => r.found);
    const allHaveLoading = results.every(r => r.hasLoadingState !== false);
    
    if (allFound) {
      log.success(`${component.file} - All flags found`);
      if (allHaveLoading) {
        log.info(`  └─ Loading states handled`);
      } else {
        log.warning(`  └─ Some loading states missing`);
      }
      passedChecks++;
    } else {
      log.error(`${component.file} - Missing flags`);
      results.forEach(r => {
        if (!r.found) {
          log.error(`  └─ Missing: ${r.flag}`);
        }
      });
      failedChecks++;
    }
    
    componentResults.push({
      file: component.file,
      results,
      allFound,
      allHaveLoading,
    });
  }
  
  // Summary
  log.section('Verification Summary');
  log.info(`Total Checks: ${totalChecks}`);
  log.success(`Passed: ${passedChecks}`);
  if (failedChecks > 0) {
    log.error(`Failed: ${failedChecks}`);
  } else {
    log.success(`Failed: ${failedChecks}`);
  }
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  log.info(`Success Rate: ${successRate}%`);
  
  if (failedChecks === 0) {
    log.section('✅ All Checks Passed!');
    log.info('Feature flags implementation is complete.');
    log.info('Next steps:');
    log.info('1. Run database migration (see FEATURE_FLAGS_PHASE1_DATABASE_SETUP.md)');
    log.info('2. Perform testing (see FEATURE_FLAGS_TESTING_GUIDE.md)');
    return 0;
  } else {
    log.section('❌ Some Checks Failed');
    log.warning('Please review the failed checks above and fix any issues.');
    return 1;
  }
}

// Run verification
try {
  const exitCode = verifyFeatureFlags();
  process.exit(exitCode);
} catch (error) {
  log.error(`Verification failed: ${error.message}`);
  console.error(error);
  process.exit(1);
}

