# TypeScript Quick Fix Guide

## 🚀 Performance Optimizations Applied

### 1. Incremental Compilation
- **Enabled**: `incremental: true` in `tsconfig.json`
- **Benefit**: 2-3x faster subsequent compilations
- **How it works**: Only rechecks changed files

### 2. Watch Mode
```bash
npm run typecheck:watch
```
- Runs in background, shows errors instantly
- **Tip**: Keep this running in a separate terminal

### 3. Fast Mode
```bash
npm run typecheck:fast
```
- Skips library type checking
- Use for quick validation during development

## 📊 Error Analysis Scripts

### Count Total Errors
```bash
npm run typecheck:count
```

### Show Only Errors
```bash
npm run typecheck:errors
```

## 🛠️ Helper Functions for Faster Fixes

### Using `asUpdate()` Helper

**Before:**
```typescript
.update({ is_available: !item.is_available } as Updates<'menu_items'>)
```

**After (Cleaner):**
```typescript
import { asUpdate } from '../../lib/supabase-helpers'

.update(asUpdate('menu_items', { is_available: !item.is_available }))
```

**Benefits:**
- Less boilerplate
- Type-safe
- Reusable pattern

### Using `asInsert()` Helper

```typescript
import { asInsert } from '../../lib/supabase-helpers'

.insert(asInsert('menu_items', {
  name: 'Pizza',
  price: 10,
  category_id: 'cat-123'
}))
```

## 🎯 Batch Fixing Strategy

### 1. Fix by Error Type
```bash
# Get error breakdown
npm run typecheck:errors | Group-Object { ($_ -split 'error TS')[1].Split(')')[0] } | Sort-Object Count -Descending
```

### 2. Priority Order
1. **TS2322** (Type mismatch) - Most common
2. **TS2345** (Argument type) - Common
3. **TS6133** (Unused vars) - Quick wins
4. **TS7006** (Implicit any) - Add types
5. **TS18046** (Null checks) - Add guards

### 3. Fix by File Pattern
- Admin pages first (most errors)
- Components second
- Utils last

## 💡 Quick Fix Patterns

### Pattern 1: Supabase Updates
```typescript
// ❌ Before
.update({ field: value } as Updates<'table'>)

// ✅ After
import { asUpdate } from '@/lib/supabase-helpers'
.update(asUpdate('table', { field: value }))
```

### Pattern 2: Error Handling
```typescript
// ❌ Before
catch (err) {
  toast.error(err.message)
}

// ✅ After
catch (err) {
  toast.error(err instanceof Error ? err.message : String(err))
}
```

### Pattern 3: Type Guards
```typescript
// ❌ Before
const count = (result as any).count || 0

// ✅ After
const count = 'count' in result ? (result as { count?: number }).count || 0 : 0
```

## 📈 Expected Speed Improvements

- **First run**: Same speed (baseline)
- **Subsequent runs**: 2-3x faster (incremental)
- **Watch mode**: Instant feedback (0s delay)
- **Fast mode**: 50% faster (skips libs)

## 🔧 Workflow Recommendations

1. **Start watch mode** in background terminal
2. **Fix errors one file at a time**
3. **Use VS Code quick fixes** (`Cmd/Ctrl + .`)
4. **Batch fix by error type** for efficiency
5. **Use helper functions** to reduce boilerplate

## 📝 Example: Migrating to Helpers

```typescript
// Find all Supabase updates
// Search: .update\(.*as Updates

// Replace pattern:
// OLD: .update({ ... } as Updates<'table'>)
// NEW: .update(asUpdate('table', { ... }))
```

