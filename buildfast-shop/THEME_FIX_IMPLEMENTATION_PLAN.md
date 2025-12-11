# Theme Fix Implementation Plan

## Phase 1: Research Complete ✅

### Components Identified with Hardcoded Dark Colors:

1. **admin/ImageUploadModal.jsx** - 1 instance
   - Line 210: `bg-black bg-opacity-70` → `bg-[var(--bg-main)]/70`

2. **admin/BulkImageAssignment.jsx** - 3 instances
   - Line 635: `bg-black bg-opacity-70` → `bg-[var(--bg-main)]/70`
   - Line 839: `text-white` on red button → `text-black`
   - Line 1143: `text-white` on red button → `text-black`

3. **ExperiencePulse.jsx** - 3 instances
   - Line 80: `text-white` → `text-[var(--text-main)]`
   - Line 110: `text-white` → `text-[var(--text-main)]`
   - Line 133: `text-white` → `text-[var(--text-main)]`

4. **order/CustomDropdown.jsx** - 1 instance
   - Line 140: `bg-[#0A0A0A]` → `bg-[var(--bg-main)]`

5. **menu/ChefsPicks.jsx** - 1 instance
   - Line 73: `text-white` → `text-[var(--text-main)]`

6. **admin/CustomerProfileDrawer.jsx** - 8 instances
   - Line 170: `bg-[#06060B] text-white` → `bg-[var(--bg-main)] text-[var(--text-main)]`
   - Line 182: `text-white/70 hover:text-white` → `text-[var(--text-main)]/70 hover:text-[var(--text-main)]`
   - Line 189: `text-white/60 hover:text-white` → `text-[var(--text-main)]/60 hover:text-[var(--text-main)]`
   - Line 205: `text-white` → `text-[var(--text-main)]`
   - Line 251: `bg-black/30 text-white` → `bg-[var(--bg-main)]/30 text-[var(--text-main)]`
   - Line 288: `text-white` → `text-[var(--text-main)]`
   - Line 296: `text-white` → `text-[var(--text-main)]`
   - Line 327: `text-white` → `text-[var(--text-main)]`

7. **RecentlyViewed.jsx** - 2 instances
   - Line 168: `text-white` on red badge → `text-black`
   - Line 212: `text-white` on red badge → `text-black`

8. **ProductRatingSummary.jsx** - 1 instance
   - Line 113: `text-white` on blue button → `text-black`

9. **BackgroundManager.jsx** - 4 instances
   - Line 333: `text-white bg-black/50` → `text-[var(--text-main)] bg-[var(--bg-main)]/50`
   - Line 406: `text-white bg-black/70` → `text-[var(--text-main)] bg-[var(--bg-main)]/70`
   - Line 461: `text-white bg-black/50` → `text-[var(--text-main)] bg-[var(--bg-main)]/50`
   - Line 486: `text-white bg-black/70` → `text-[var(--text-main)] bg-[var(--bg-main)]/70`

10. **AdminRoute.jsx** - 1 instance
    - Line 46: `text-white` → `text-[var(--text-main)]`

## Phase 2: Implementation

### Strategy:
- Replace all hardcoded dark colors with theme variables
- Use `bg-[var(--bg-main)]` for backgrounds
- Use `text-[var(--text-main)]` for text
- Use `text-black` for colored buttons (red, blue) for better contrast
- Preserve all existing functionality and structure
- No size or content changes

### Total Fixes: 26 instances across 10 components

