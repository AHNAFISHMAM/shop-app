// ============================================================================
// ADMIN FIX: Clear Stale Cache Script
// ============================================================================
// Run this in your browser console (F12) to clear stale admin status cache
// ============================================================================

(function() {
  console.log('🔍 Checking for admin status cache entries...');
  
  const adminStatusKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('admin_status_')) {
      adminStatusKeys.push(key);
    }
  }
  
  if (adminStatusKeys.length === 0) {
    console.log('✅ No admin status cache entries found.');
    return;
  }
  
  console.log(`📋 Found ${adminStatusKeys.length} admin status cache entries:`);
  adminStatusKeys.forEach(key => {
    const value = sessionStorage.getItem(key);
    console.log(`  - ${key}: ${value}`);
  });
  
  // Ask for confirmation
  const shouldClear = confirm(
    `Found ${adminStatusKeys.length} admin status cache entries.\n\n` +
    `Click OK to clear them, or Cancel to keep them.\n\n` +
    `This will force a fresh admin status check on next page load.`
  );
  
  if (shouldClear) {
    adminStatusKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`🗑️  Cleared: ${key}`);
    });
    console.log('✅ All admin status cache entries cleared!');
    console.log('🔄 Reloading page to refresh admin status...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    console.log('❌ Cache clearing cancelled.');
  }
})();

