# Agent Quick Reference - TypeScript Workflow

## ⚠️ Multi-Agent Mode Note

**Cursor's multi-agent mode is unstable on Windows.** Use manual parallel processing instead:
- See `docs/MANUAL_PARALLEL_WORKFLOW.md` for complete guide
- Use `npm run batch:generate` to create batches
- Process batches in parallel terminals or multiple Cursor windows

## ⚡ Mandatory Workflow (All Agents)

### Step 1: Verify Setup (First Time)
```bash
npm run verify:setup
```
Ensures all optimizations are configured.

### Step 2: Error Analysis (ALWAYS FIRST)
```bash
npm run typecheck:group    # Get error breakdown
npm run typecheck:by-type  # Prioritize by error type
npm run typecheck:by-file  # Group by file for parallel
```

### Step 3: Auto-Fix (ALWAYS BEFORE MANUAL)
```bash
npm run fix:auto          # Fixes 30-40% automatically
npm run fix:type-imports  # Optimize type-only imports
```

### Step 4: Watch Mode (KEEP RUNNING)
```bash
# Standard optimized watch
npm run typecheck:watch:preserve

# OR for large codebases (project references)
npm run typecheck:build:watch
```

### Step 5: Parallel Processing (For Batch Fixes)
```bash
npm run fix:parallel  # Generate batch commands
# Run generated batches in separate terminals
```

## 🚀 Available Optimizations

### Performance Scripts
- `typecheck:watch:preserve` - Optimized watch (faster)
- `typecheck:build:watch` - Project references watch (modular)
- `typecheck:fast` - Quick validation (skips libs)
- `typecheck:group` - Error breakdown
- `typecheck:by-type` - Prioritize fixes
- `typecheck:by-file` - Group for parallel

### Auto-Fix Scripts
- `fix:auto` - Common patterns (30-40% errors)
- `fix:type-imports` - Convert to type-only imports
- `fix:parallel` - Generate batch commands

### Helper Functions
- `asUpdate(table, data)` - Type-safe Supabase updates
- `asInsert(table, data)` - Type-safe Supabase inserts
- Location: `src/lib/supabase-helpers.ts`

## 📈 Expected Performance

- **10-30x faster** than baseline
- **30-40% errors** fixed automatically
- **Modular compilation** (only changed modules)
- **Optimized watch mode** (preserveWatchOutput)

## 🎯 Error Priority Order

1. **TS6133** (Unused vars) - Quick wins
2. **TS2322** (Type mismatch) - Most common
3. **TS2345** (Argument type) - Pattern-based
4. **TS7006** (Implicit any) - Add types
5. **TS18046** (Null checks) - Add guards
6. **TS2339** (Property missing) - Add to type
7. **TS7053** (Index signature) - Add signature

## 💡 VS Code Multi-Cursor

For pattern-based fixes:
1. Search pattern (e.g., `.update\(.*as\s+Updates<`)
2. `Alt+Enter` to select all matches
3. Replace with helper function
4. Fixes 10-20 instances in seconds

## 📖 Full Documentation

- `docs/TYPESCRIPT_QUICK_FIX_GUIDE.md` - Quick fix patterns
- `docs/PARALLEL_FIXING_WORKFLOW.md` - Parallel workflow
- `docs/SPEED_OPTIMIZATIONS.md` - All optimizations
- `.cursorrules` Section 11 - Complete workflow

## ⚠️ Pre-Commit Enforcement

- All files auto-linted/formatted before commit
- TypeScript errors block commits
- Use `npm run lint:fix` and `npm run format` to fix

## 🔄 Multi-Terminal Workflow

**Recommended setup:**
- Terminal 1: `typecheck:watch:preserve` (watch)
- Terminal 2: `typecheck:fast` (quick checks)
- Terminal 3: Error analysis
- Terminal 4: Auto-fix
- Terminals 5-8: Parallel batches

