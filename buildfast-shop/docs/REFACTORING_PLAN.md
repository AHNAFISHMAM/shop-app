# 🔧 Code Refactoring Plan

## Overview

This document tracks the systematic refactoring of large files (>300 lines) to improve maintainability, testability, and code organization.

## Priority Order

Based on file size and dependency analysis:

### Critical Priority (>1000 lines)
1. **Checkout.jsx** - 2,509 lines ⚠️ CRITICAL
2. **AdminMenuItems.jsx** - 2,384 lines ⚠️ CRITICAL
3. **OrderHistory.jsx** - 1,609 lines ⚠️ HIGH
4. **AdminReservations.jsx** - 1,173 lines ⚠️ HIGH

### Medium Priority (500-1000 lines)
5. **AdminOrders.jsx** - 931 lines
6. **AdminDiscountCodes.jsx** - 912 lines
7. **AdminCustomers.jsx** - 842 lines
8. **AdminSettings.jsx** - 813 lines
9. **MenuPage.jsx** - 812 lines
10. **ProductDetail.jsx** - 707 lines
11. **ReservationsPage.jsx** - 668 lines
12. **AdminFeatureFlags.jsx** - 552 lines
13. **OrderPage.jsx** - 523 lines
14. **AdminGallery.jsx** - 514 lines

## Refactoring Strategy

### Principles
1. **Single Responsibility**: Each file handles ONE specific responsibility
2. **Feature-Based Organization**: Group related files by feature/domain
3. **Backward Compatibility**: Maintain existing import paths using index.ts re-exports
4. **Dependency-Based Order**: Refactor dependencies BEFORE dependents
5. **Target Size**: Keep files under 300 lines (flexible based on complexity)

### File Structure Pattern

```
src/pages/
  [FeatureName]/
    index.tsx              # Main page component (~200-400 lines)
    components/            # Feature-specific components
      [ComponentName].tsx
    sections/              # Page sections
      [SectionName].tsx
    hooks/                 # Feature-specific hooks
      use[FeatureName].ts
    utils/                 # Feature-specific utilities
      [utility].ts
    types.ts               # Feature-specific types
    constants.ts           # Feature-specific constants
```

## Progress Tracking

### Phase 12: Code Refactoring & File Organization

- [ ] Phase 12.1: Audit Complete
- [ ] Phase 12.2: Prioritization Complete
- [ ] Phase 12.3: Dependency Analysis - In Progress
- [ ] Phase 12.4: Refactoring Strategy - Documented
- [ ] Phase 12.5: Implementation - Pending

## Notes

- All refactoring maintains backward compatibility
- Each refactored file will have an index.ts for re-exports
- Performance optimizations (React.memo, useMemo, useCallback) applied during refactoring
- JSDoc comments added to extracted functions/components

