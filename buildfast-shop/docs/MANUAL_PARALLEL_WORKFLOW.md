# Manual Parallel Processing Workflow

## 🎯 Overview

Since Cursor's multi-agent mode is unstable on Windows, use this manual parallel processing approach for **5-10x faster** TypeScript error fixing.

## 🚀 Quick Start

### Step 1: Generate Batches
```powershell
.\scripts\parallel-batch-processor.ps1
```

This will:
- Analyze all TypeScript errors
- Group files by error count
- Create batches (4 files per batch)
- Generate processing scripts

### Step 2: Choose Processing Method

#### Method A: Sequential Processing (Safest)
```powershell
# Process one batch at a time
.\parallel-batches\process-batch-1.ps1
.\parallel-batches\process-batch-2.ps1
.\parallel-batches\process-batch-3.ps1
```

#### Method B: Parallel Terminals (Fastest)
Open multiple PowerShell terminals:
- **Terminal 1:** `.\parallel-batches\process-batch-1.ps1`
- **Terminal 2:** `.\parallel-batches\process-batch-2.ps1`
- **Terminal 3:** `.\parallel-batches\process-batch-3.ps1`
- **Terminal 4:** `.\parallel-batches\process-batch-4.ps1`

#### Method C: Multiple Cursor Windows (Most Flexible)
1. Open `parallel-batches\batch-1.txt` in Cursor Window 1
2. Open `parallel-batches\batch-2.txt` in Cursor Window 2
3. Fix errors in each window independently
4. Use VS Code multi-cursor for pattern fixes

## 📋 Complete Workflow

### Phase 1: Preparation
```bash
# 1. Get error overview
npm run typecheck:group

# 2. Auto-fix common patterns (30-40% errors)
npm run fix:auto
npm run fix:type-imports

# 3. Generate batches
.\scripts\parallel-batch-processor.ps1
```

### Phase 2: Processing

**For each batch:**

1. **Open files** from `batch-X.txt`
2. **Start watch mode** (if not already running):
   ```bash
   npm run typecheck:watch:preserve
   ```
3. **Fix errors** using:
   - VS Code multi-cursor (Alt+Enter for patterns)
   - Helper functions (`asUpdate`, `asInsert`)
   - Error priority order (TS6133 → TS2322 → TS2345, etc.)
4. **Verify** with watch mode (real-time feedback)

### Phase 3: Verification
```bash
# Check remaining errors
npm run typecheck:count

# Final verification
npm run typecheck

# Format and lint
npm run lint:fix
npm run format
```

## 💡 VS Code Multi-Cursor Strategies

### Pattern 1: Replace `as Updates<>`
1. **Search:** `.update\(.*as\s+Updates<`
2. **Alt+Enter** → Select all matches
3. **Replace:** Use `asUpdate()` helper
4. **Time:** Fixes 10-20 instances in seconds

### Pattern 2: Fix Error Handling
1. **Search:** `catch\s*\((\w+)\)\s*\{[^}]*\1\.message`
2. **Alt+Enter** → Select all
3. **Replace:** `$1 instanceof Error ? $1.message : String($1)`

### Pattern 3: Fix Null Checks
1. **Search:** `formData\.spice_level\s*===\s*['"]`
2. **Alt+Enter** → Select all
3. **Replace:** `formData.spice_level === null`

## 🎯 Error Priority Order

Fix errors in this order for maximum efficiency:

1. **TS6133** (Unused vars) - Quick wins, auto-removable
2. **TS2322** (Type mismatch) - Most common, use helpers
3. **TS2345** (Argument type) - Pattern-based fixes
4. **TS7006** (Implicit any) - Add explicit types
5. **TS18046** (Null checks) - Add type guards
6. **TS2339** (Property missing) - Add to types
7. **TS7053** (Index signature) - Add signatures

## 📊 Expected Performance

### Without Optimizations
- Sequential fixing: 1x (baseline)
- Time: 2-4 hours for 300+ errors

### With Manual Parallel Processing
- **Sequential batches:** 3-4x faster (30-60 minutes)
- **Parallel terminals:** 5-8x faster (15-30 minutes)
- **Multiple Cursor windows:** 5-10x faster (15-30 minutes)

### With All Optimizations
- Auto-fix: 30-40% errors fixed automatically
- Watch mode: Instant feedback
- Multi-cursor: 5-10x faster for patterns
- **Total: 10-15x faster overall** (10-20 minutes)

## 🔧 Troubleshooting

### Batch Scripts Not Working?
```powershell
# Check execution policy
Get-ExecutionPolicy

# If restricted, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Watch Mode Not Showing Updates?
- Use `typecheck:watch:preserve` instead of `typecheck:watch`
- Check terminal isn't minimized
- Restart watch mode if stuck

### Conflicts Between Batches?
- Process batches sequentially if conflicts occur
- Use `git status` to check for conflicts
- Merge carefully after each batch

## 📝 Best Practices

1. **Always run auto-fix first** (`fix:auto`, `fix:type-imports`)
2. **Keep watch mode running** in background
3. **Fix by error type** within each batch
4. **Use multi-cursor** for pattern-based fixes
5. **Verify after each batch** with `typecheck:count`
6. **Commit frequently** after each batch completes

## 🎉 Success Metrics

- **Before:** 300+ errors, 2-4 hours
- **After:** 0 errors, 10-20 minutes
- **Speedup:** 10-15x faster

## 📖 Related Documentation

- `docs/AGENT_QUICK_REFERENCE.md` - Quick reference
- `docs/SPEED_OPTIMIZATIONS.md` - All optimizations
- `docs/PARALLEL_FIXING_WORKFLOW.md` - Parallel workflow
- `.cursorrules` Section 11 - Complete workflow

