# Parallel TypeScript Error Fixing Workflow

## 🚀 Multi-Terminal Setup

### Terminal 1: Watch Mode (Instant Feedback)
```bash
npm run typecheck:watch
```
**Purpose:** Real-time error detection as you fix files

### Terminal 2: Fast Validation
```bash
npm run typecheck:fast
```
**Purpose:** Quick checks without library validation

### Terminal 3: Error Analysis
```bash
npm run typecheck:group      # Get error breakdown
npm run typecheck:by-file    # Group by file
npm run typecheck:by-type    # Group by error type
```
**Purpose:** Understand error distribution and prioritize

### Terminal 4: Auto-Fix
```bash
npm run fix:auto             # Auto-fix common patterns
npm run lint:fix             # ESLint auto-fix
npm run format               # Prettier formatting
```
**Purpose:** Automated fixes for common patterns

### Terminal 5-8: Parallel File Processing
```bash
# After running: npm run fix:parallel
# Use generated scripts in separate terminals:
# - parallel-fix-commands.ps1 (Windows)
# - parallel-fix-commands.sh (Linux/Mac)
```
**Purpose:** Process multiple files simultaneously

---

## 📊 Error Analysis Workflow

### Step 1: Get Error Overview
```bash
npm run typecheck:group
```
**Output:**
- Error breakdown by type
- Top files with errors
- Detailed JSON report (`error-report.json`)

### Step 2: Prioritize by Error Type
```bash
npm run typecheck:by-type
```
**Output:**
- Errors sorted by fix priority
- Fix strategies for each error type
- Recommended fix order

### Step 3: Group by File for Parallel Processing
```bash
npm run typecheck:by-file
```
**Output:**
- Files sorted by error count
- Parallel processing batches (4 files per batch)

---

## 🔧 Automated Fixes

### Auto-Fix Common Patterns
```bash
npm run fix:auto
```
**Fixes:**
- ✅ Replace `as Updates<>` with `asUpdate()`
- ✅ Fix error handling (`err instanceof Error`)
- ✅ Fix null checks (`spice_level === null`)
- ✅ Fix `rows` attribute (string → number)

### Generate Parallel Fix Commands
```bash
npm run fix:parallel
```
**Output:**
- `parallel-fix-commands.ps1` (Windows)
- `parallel-fix-commands.sh` (Linux/Mac)
- Batch processing plan

---

## 🎯 Fix Priority Order

1. **TS6133** (Unused vars) - Quick wins, auto-removable
2. **TS2322** (Type mismatch) - Common, often simple fixes
3. **TS2345** (Argument type) - Pattern-based fixes
4. **TS7006** (Implicit any) - Add explicit types
5. **TS18046** (Null checks) - Add type guards
6. **TS2339** (Property missing) - Add to type or assertion
7. **TS7053** (Index signature) - Add index signature

---

## 💡 VS Code Multi-Cursor Strategies

### Pattern 1: Replace `as Updates<>` Pattern
1. **Search:** `.update\(.*as\s+Updates<`
2. **Select All:** `Alt+Enter` (select all matches)
3. **Multi-cursor:** All instances selected
4. **Replace:** Use `asUpdate()` helper
5. **Time:** Fixes 10-20 instances in seconds

### Pattern 2: Fix Error Handling
1. **Search:** `catch\s*\((\w+)\)\s*\{[^}]*\1\.message`
2. **Select All:** `Alt+Enter`
3. **Replace:** `$1 instanceof Error ? $1.message : String($1)`

### Pattern 3: Fix Null Checks
1. **Search:** `formData\.spice_level\s*===\s*['"]`
2. **Select All:** `Alt+Enter`
3. **Replace:** `formData.spice_level === null`

### Pattern 4: Fix Rows Attribute
1. **Search:** `rows=["'](\d+)["']`
2. **Select All:** `Alt+Enter`
3. **Replace:** `rows={$1}`

---

## 🔄 Parallel Processing Strategy

### Batch Processing
1. **Run:** `npm run fix:parallel`
2. **Review:** Generated batch files
3. **Execute:** Run batches in separate terminals
4. **Monitor:** Watch Terminal 1 for real-time feedback

### Example Workflow
```bash
# Terminal 1: Watch mode
npm run typecheck:watch

# Terminal 2: Analyze
npm run typecheck:by-type

# Terminal 3: Auto-fix
npm run fix:auto

# Terminal 4-7: Parallel batches
# (Run generated scripts from fix:parallel)
```

---

## 📈 Expected Speed Improvements

- **Sequential fixing:** 1x (baseline)
- **Parallel batches (4 files):** 3-4x faster
- **Auto-fix patterns:** 30-40% of errors fixed automatically
- **Multi-cursor editing:** 5-10x faster for pattern fixes
- **Watch mode:** Instant feedback (0s delay)

**Total speedup:** 5-10x faster overall

---

## 🎯 Best Practices

1. **Start with auto-fix:** Run `npm run fix:auto` first
2. **Fix by priority:** Use `typecheck:by-type` to prioritize
3. **Use watch mode:** Keep Terminal 1 running
4. **Batch process:** Use parallel terminals for file groups
5. **Multi-cursor:** Use VS Code for pattern-based fixes
6. **Verify frequently:** Check Terminal 1 after each batch

---

## 📝 Example Session

```bash
# 1. Get overview
npm run typecheck:group
# → 382 errors, 15 files

# 2. Auto-fix common patterns
npm run fix:auto
# → Fixed 45 errors automatically

# 3. Check remaining
npm run typecheck:count
# → 337 errors remaining

# 4. Prioritize
npm run typecheck:by-type
# → TS6133: 120 errors (quick wins)
# → TS2322: 95 errors (common)
# → TS2345: 67 errors (pattern-based)

# 5. Fix TS6133 (unused vars)
# → Use VS Code multi-cursor or auto-remove

# 6. Fix TS2322 (type mismatches)
# → Use parallel batches for files

# 7. Verify
npm run typecheck:watch
# → Monitor real-time progress
```

---

## 🚨 Troubleshooting

### Scripts not working?
- Ensure Node.js is installed
- Check file permissions (`chmod +x scripts/*.js`)
- Verify you're in `buildfast-shop/` directory

### Parallel processing too slow?
- Reduce batch size (edit `parallel-fix.js`)
- Use fewer terminals
- Focus on high-priority errors first

### Auto-fix breaking code?
- Review changes before committing
- Use `git diff` to check modifications
- Run `npm run typecheck` after fixes

