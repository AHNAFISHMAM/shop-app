/**
 * Sticky Sidebar Diagnostic Utility
 * 
 * Run this diagnostic to identify issues preventing sticky positioning from working.
 * 
 * Usage in browser console:
 * import { runStickySidebarDiagnostics } from './utils/stickySidebarDiagnostics';
 * runStickySidebarDiagnostics();
 * 
 * Or copy the function body and paste directly into console.
 */

export interface DiagnosticResult {
  sidebar: {
    position: string;
    top: string;
    zIndex: string;
    height: string;
    maxHeight: string;
    overflow: string;
    inlineStyle: string;
    issues: string[];
  };
  parents: Array<{
    level: number;
    tag: string;
    className: string;
    overflow: string;
    overflowY: string;
    position: string;
    height: string;
    maxHeight: string;
    transform: string;
    issues: string[];
  }>;
  height: {
    sidebarHeight: number;
    viewportHeight: number;
    sidebarTop: number;
    availableHeight: number;
    hasEnoughSpace: boolean;
    maxHeightSet: boolean;
  };
  scrollContainer: {
    found: boolean;
    element?: Element;
    overflow?: string;
    overflowY?: string;
  };
  stickyTest: {
    initialTop: number;
    afterScrollTop: number;
    moved: number;
    isSticky: boolean;
  } | null;
}

export function runStickySidebarDiagnostics(): DiagnosticResult | null {
  const sidebar = document.querySelector('aside[class*="sticky"], aside[style*="position: sticky"]');
  
  if (!sidebar) {
    console.error('❌ Sidebar not found');
    console.log('Looking for: aside[class*="sticky"] or aside[style*="position: sticky"]');
    return null;
  }

  console.log('🔍 STICKY SIDEBAR DIAGNOSTICS');
  console.log('==============================');

  // 1. Check sidebar itself
  const sidebarStyle = window.getComputedStyle(sidebar);
  const sidebarIssues: string[] = [];
  
  if (sidebarStyle.position !== 'sticky') {
    sidebarIssues.push(`⚠️ position is "${sidebarStyle.position}", expected "sticky"`);
  }
  if (!sidebarStyle.top || sidebarStyle.top === 'auto') {
    sidebarIssues.push(`⚠️ top is "${sidebarStyle.top}", should have a value`);
  }
  if (sidebarStyle.transform !== 'none') {
    sidebarIssues.push(`⚠️ transform is "${sidebarStyle.transform}", should be "none"`);
  }
  if (sidebarStyle.willChange !== 'auto') {
    sidebarIssues.push(`⚠️ willChange is "${sidebarStyle.willChange}", should be "auto"`);
  }
  
  const sidebarInfo = {
    position: sidebarStyle.position,
    top: sidebarStyle.top,
    zIndex: sidebarStyle.zIndex,
    height: sidebarStyle.height,
    maxHeight: sidebarStyle.maxHeight,
    overflow: sidebarStyle.overflow,
    inlineStyle: (sidebar as HTMLElement).style.cssText,
    issues: sidebarIssues.length > 0 ? sidebarIssues : ['✅ OK']
  };
  
  console.log('\n1️⃣ Sidebar Element:');
  console.table(sidebarInfo);

  // 2. Check all parent containers
  console.log('\n2️⃣ Parent Containers:');
  let parent = sidebar.parentElement;
  const parents: DiagnosticResult['parents'] = [];
  let level = 1;
  
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    const rect = parent.getBoundingClientRect();
    const issues: string[] = [];
    
    if (style.overflow !== 'visible' && style.overflow !== 'clip') {
      issues.push(`⚠️ overflow: ${style.overflow}`);
    }
    if (style.overflowY !== 'visible' && style.overflowY !== 'clip') {
      issues.push(`⚠️ overflowY: ${style.overflowY}`);
    }
    if (style.transform !== 'none') {
      issues.push(`⚠️ transform: ${style.transform}`);
    }
    if (style.willChange !== 'auto') {
      issues.push(`⚠️ willChange: ${style.willChange}`);
    }
    if (style.display === 'flex' || style.display === 'grid') {
      issues.push(`ℹ️ display: ${style.display}`);
    }
    if (style.height === 'auto' && !style.minHeight || parseFloat(style.height) < parseFloat(sidebarStyle.height)) {
      issues.push(`⚠️ parent height (${style.height}) may be less than sidebar height`);
    }
    
    parents.push({
      level,
      tag: parent.tagName,
      className: parent.className.substring(0, 50),
      overflow: style.overflow,
      overflowY: style.overflowY,
      position: style.position,
      height: style.height,
      maxHeight: style.maxHeight,
      transform: style.transform !== 'none' ? 'YES' : 'NO',
      issues: issues.length > 0 ? issues : ['✅ OK']
    });
    
    parent = parent.parentElement;
    level++;
  }
  
  console.table(parents);

  // 3. Check height constraints
  console.log('\n3️⃣ Height Analysis:');
  const sidebarHeight = sidebar.getBoundingClientRect().height;
  const viewportHeight = window.innerHeight;
  const sidebarTop = parseFloat(sidebarStyle.top) || 0;
  const availableHeight = viewportHeight - sidebarTop;
  
  const heightInfo = {
    sidebarHeight: sidebarHeight,
    viewportHeight: viewportHeight,
    sidebarTop: sidebarTop,
    availableHeight: availableHeight,
    hasEnoughSpace: sidebarHeight <= availableHeight,
    maxHeightSet: sidebarStyle.maxHeight !== 'none'
  };
  
  console.table(heightInfo);

  // 4. Check scroll container
  console.log('\n4️⃣ Scroll Container:');
  const scrollContainer = sidebar.closest('[style*="overflow"], .overflow-auto, .overflow-scroll, .overflow-hidden');
  let scrollContainerInfo: DiagnosticResult['scrollContainer'];
  
  if (scrollContainer) {
    console.warn('⚠️ Found scroll container:', scrollContainer);
    const scrollStyle = window.getComputedStyle(scrollContainer);
    scrollContainerInfo = {
      found: true,
      element: scrollContainer,
      overflow: scrollStyle.overflow,
      overflowY: scrollStyle.overflowY
    };
    console.table(scrollContainerInfo);
  } else {
    console.log('✅ No problematic scroll container found');
    scrollContainerInfo = { found: false };
  }

  // 5. Check if actually sticky
  console.log('\n5️⃣ Sticky Behavior Test:');
  const initialTop = sidebar.getBoundingClientRect().top;
  const initialScrollY = window.scrollY;
  
  // Scroll down
  window.scrollBy(0, 100);
  
  setTimeout(() => {
    const afterScrollTop = sidebar.getBoundingClientRect().top;
    const moved = Math.abs(afterScrollTop - initialTop);
    const isSticky = moved < 10 && afterScrollTop <= sidebarTop + 10;
    
    const stickyTestInfo = {
      initialTop: initialTop,
      afterScrollTop: afterScrollTop,
      moved: moved,
      isSticky: isSticky
    };
    
    console.table(stickyTestInfo);
    
    if (isSticky) {
      console.log('✅ Sidebar is sticky!');
    } else {
      console.warn('❌ Sidebar is NOT sticky. Check parent container issues above.');
    }
    
    // Scroll back
    window.scrollTo(0, initialScrollY);
    
    console.log('\n✅ Diagnostics complete. Review the issues above.');
  }, 100);

  return {
    sidebar: sidebarInfo,
    parents,
    height: heightInfo,
    scrollContainer: scrollContainerInfo,
    stickyTest: null // Will be set in setTimeout
  };
}

/**
 * Standalone script version for direct console paste
 */
export const diagnosticScript = `
(function diagnoseStickySidebar() {
  const sidebar = document.querySelector('aside[class*="sticky"], aside[style*="position: sticky"]');
  if (!sidebar) {
    console.error('❌ Sidebar not found');
    return;
  }

  console.log('🔍 STICKY SIDEBAR DIAGNOSTICS');
  console.log('==============================');

  // 1. Check sidebar itself
  const sidebarStyle = window.getComputedStyle(sidebar);
  console.log('\\n1️⃣ Sidebar Element:');
  console.log({
    position: sidebarStyle.position,
    top: sidebarStyle.top,
    zIndex: sidebarStyle.zIndex,
    height: sidebarStyle.height,
    maxHeight: sidebarStyle.maxHeight,
    overflow: sidebarStyle.overflow,
    inlineStyle: sidebar.style.cssText
  });

  // 2. Check all parent containers
  console.log('\\n2️⃣ Parent Containers:');
  let parent = sidebar.parentElement;
  const parents = [];
  let level = 1;
  
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    const issues = [];
    
    if (style.overflow !== 'visible' && style.overflow !== 'clip') {
      issues.push(\`⚠️ overflow: \${style.overflow}\`);
    }
    if (style.overflowY !== 'visible' && style.overflowY !== 'clip') {
      issues.push(\`⚠️ overflowY: \${style.overflowY}\`);
    }
    if (style.transform !== 'none') {
      issues.push(\`⚠️ transform: \${style.transform}\`);
    }
    if (style.willChange !== 'auto') {
      issues.push(\`⚠️ willChange: \${style.willChange}\`);
    }
    if (style.display === 'flex' || style.display === 'grid') {
      issues.push(\`ℹ️ display: \${style.display}\`);
    }
    
    parents.push({
      level,
      tag: parent.tagName,
      className: parent.className.substring(0, 50),
      overflow: style.overflow,
      overflowY: style.overflowY,
      position: style.position,
      height: style.height,
      maxHeight: style.maxHeight,
      transform: style.transform !== 'none' ? 'YES' : 'NO',
      issues: issues.length > 0 ? issues : ['✅ OK']
    });
    
    parent = parent.parentElement;
    level++;
  }
  
  console.table(parents);

  // 3. Check height constraints
  console.log('\\n3️⃣ Height Analysis:');
  const sidebarHeight = sidebar.getBoundingClientRect().height;
  const viewportHeight = window.innerHeight;
  const sidebarTop = parseFloat(sidebarStyle.top) || 0;
  const availableHeight = viewportHeight - sidebarTop;
  
  console.log({
    sidebarHeight: \`\${sidebarHeight}px\`,
    viewportHeight: \`\${viewportHeight}px\`,
    sidebarTop: \`\${sidebarTop}px\`,
    availableHeight: \`\${availableHeight}px\`,
    hasEnoughSpace: sidebarHeight <= availableHeight,
    maxHeightSet: sidebarStyle.maxHeight !== 'none'
  });

  // 4. Check scroll container
  console.log('\\n4️⃣ Scroll Container:');
  const scrollContainer = sidebar.closest('[style*="overflow"], .overflow-auto, .overflow-scroll, .overflow-hidden');
  if (scrollContainer) {
    console.warn('⚠️ Found scroll container:', scrollContainer);
    const scrollStyle = window.getComputedStyle(scrollContainer);
    console.log({
      element: scrollContainer,
      overflow: scrollStyle.overflow,
      overflowY: scrollStyle.overflowY
    });
  } else {
    console.log('✅ No problematic scroll container found');
  }

  // 5. Check if actually sticky
  console.log('\\n5️⃣ Sticky Behavior Test:');
  const initialTop = sidebar.getBoundingClientRect().top;
  const initialScrollY = window.scrollY;
  window.scrollBy(0, 100);
  setTimeout(() => {
    const afterScrollTop = sidebar.getBoundingClientRect().top;
    const moved = Math.abs(afterScrollTop - initialTop);
    const isSticky = moved < 10 && afterScrollTop <= sidebarTop + 10;
    console.log({
      initialTop: \`\${initialTop}px\`,
      afterScrollTop: \`\${afterScrollTop}px\`,
      moved: \`\${moved}px\`,
      isSticky: isSticky
    });
    if (isSticky) {
      console.log('✅ Sidebar is sticky!');
    } else {
      console.warn('❌ Sidebar is NOT sticky. Check parent container issues above.');
    }
    window.scrollTo(0, initialScrollY);
    console.log('\\n✅ Diagnostics complete. Check the issues above.');
  }, 100);
})();
`;

