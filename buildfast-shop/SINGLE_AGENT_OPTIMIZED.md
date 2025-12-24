# Fix All TypeScript Errors - Optimized Single-Agent Workflow

Fix all TypeScript errors using optimized workflow. This single-agent approach achieves **10-30x speedup** through automation and optimizations.

## Phase 1: Auto-Fix (30-40% Errors - 2 minutes)

```bash
npm run fix:auto          # Auto-fixes common patterns
npm run fix:type-imports  # Optimize type-only imports
npm run lint:fix          # ESLint auto-fix
```

**What gets fixed automatically:**
- `as Updates<>` → `asUpdate()` helper
- Error handling patterns
- Null checks (`spice_level === null`)
- `rows` attribute types (string → number)

## Phase 2: Error Analysis (1 minute)

```bash
npm run typecheck:by-type  # Get prioritized error list
```

**Fix in this priority order:**
1. **TS6133** (Unused vars) - Quick wins, auto-removable
2. **TS2322** (Type mismatch) - Most common, use helpers
3. **TS2345** (Argument type) - Pattern-based fixes
4. **TS7006** (Implicit any) - Add explicit types
5. **TS18046** (Null checks) - Add type guards
6. **TS2339** (Property missing) - Add to types
7. **TS7053** (Index signature) - Add signatures

## Phase 3: Pattern-Based Fixes (VS Code Multi-Cursor)

**Fix 10-20 instances in seconds using multi-cursor:**

### Pattern 1: Replace `as Updates<>`
1. **Search:** `.update\(.*as\s+Updates<`
2. **Alt+Enter** → Select all matches
3. **Replace:** Use `asUpdate()` helper from `src/lib/supabase-helpers.ts`
4. **Time:** Fixes 10-20 instances in seconds

### Pattern 2: Fix Error Handling
1. **Search:** `catch\s*\((\w+)\)\s*\{[^}]*\1\.message`
2. **Alt+Enter** → Select all
3. **Replace:** `$1 instanceof Error ? $1.message : String($1)`
4. **Time:** Fixes 10-20 instances in seconds

### Pattern 3: Fix Null Checks
1. **Search:** `formData\.spice_level\s*===\s*['"]`
2. **Alt+Enter** → Select all
3. **Replace:** `formData.spice_level === null`
4. **Time:** Fixes multiple instances instantly

### Pattern 4: Fix Rows Attribute
1. **Search:** `rows=["'](\d+)["']`
2. **Alt+Enter** → Select all
3. **Replace:** `rows={$1}`
4. **Time:** Fixes multiple instances instantly

## Phase 4: File-by-File Fixes

```bash
npm run typecheck:by-file  # Get files sorted by error count
```

**For each file (focus on highest error count first):**
1. Open file in VS Code
2. Use **VS Code quick fixes** (`Ctrl+.` or `Cmd+.`)
3. Apply helper functions (`asUpdate`, `asInsert`)
4. Add explicit types where needed
5. Add type guards for null checks
6. Check watch mode terminal for instant feedback

## Required Patterns

### Helper Functions (MANDATORY)
```typescript
// ❌ DON'T USE:
.update({ field: value } as Updates<'table'>)

// ✅ USE INSTEAD:
import { asUpdate } from '@/lib/supabase-helpers'
.update(asUpdate('table', { field: value }))
```

### Error Handling (MANDATORY)
```typescript
// ❌ DON'T USE:
catch (err) {
  toast.error(err.message)
}

// ✅ USE INSTEAD:
catch (err) {
  toast.error(err instanceof Error ? err.message : String(err))
}
```

### Type Guards (MANDATORY)
```typescript
// ❌ DON'T USE:
const count = (result as any).count || 0

// ✅ USE INSTEAD:
const count = 'count' in result ? (result as { count?: number }).count || 0 : 0
```

## Performance Optimizations Used

### Watch Mode (Keep Running)
```bash
npm run typecheck:watch:preserve  # Optimized watch (background)
# OR for large codebases:
npm run typecheck:build:watch     # Project references watch
```

### Quick Validation
```bash
npm run typecheck:fast  # Quick check (skips libs, 50% faster)
```

### Speed Multipliers
- **Incremental compilation:** 2-3x faster subsequent runs
- **Project references:** 2-3x faster (modular compilation)
- **Auto-fix scripts:** 30-40% errors fixed automatically
- **VS Code multi-cursor:** 5-10x faster for patterns
- **Watch mode:** Instant feedback (0s delay)

## Complete Workflow

### Step 1: Setup (30 seconds)
```bash
npm run typecheck:watch:preserve  # Start watch mode (background)
```

### Step 2: Auto-Fix (2 minutes)
```bash
npm run fix:auto
npm run fix:type-imports
npm run lint:fix
```

### Step 3: Analysis (1 minute)
```bash
npm run typecheck:by-type  # Get priority list
```

### Step 4: Pattern Fixes (5-10 minutes)
- Use VS Code multi-cursor for patterns
- Fix 10-20 instances per pattern in seconds

### Step 5: File Fixes (10-20 minutes)
- Use `typecheck:by-file` to prioritize
- Fix files with most errors first
- Use watch mode for instant feedback

### Step 6: Verification (1 minute)
```bash
npm run typecheck        # Should show 0 errors
npm run lint:fix         # Auto-fix linting
npm run format           # Format code
```

## Expected Performance

**Time Breakdown:**
- Auto-fix: 2 minutes (30-40% errors)
- Pattern fixes: 5-10 minutes (multi-cursor)
- File fixes: 10-20 minutes (file-by-file)
- **Total: 15-30 minutes**

**Baseline (without optimizations):**
- Manual fixing: 2-4 hours
- **Speedup: 10-30x faster**

## Tips for Maximum Speed

1. **Keep watch mode running** - Instant feedback as you fix
2. **Use multi-cursor first** - Fix patterns before manual fixes
3. **Focus on quick wins** - TS6133 (unused vars) first
4. **Use VS Code quick fixes** - `Ctrl+.` for auto-fixes
5. **Fix by error type** - Batch similar errors together

## Troubleshooting

**Watch mode not updating?**
- Use `typecheck:watch:preserve` instead
- Check terminal isn't minimized

**Multi-cursor not working?**
- Make sure you're in VS Code (not Cursor editor)
- Use `Alt+Enter` to select all matches

**Still slow?**
- Run `npm run fix:auto` again
- Use `typecheck:fast` for quick validation
- Focus on one error type at a time

## Reference

- `.cursorrules` Section 11 - Complete workflow
- `docs/AGENT_QUICK_REFERENCE.md` - Quick reference
- `docs/SPEED_OPTIMIZATIONS.md` - All optimizations
- `docs/TYPESCRIPT_QUICK_FIX_GUIDE.md` - Fix patterns

---

**This single-agent workflow achieves 10-30x speedup through automation and optimizations.**

