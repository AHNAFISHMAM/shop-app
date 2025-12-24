# Quick Start - Manual Parallel Processing

## 🚀 3-Step Process

### Step 1: Generate Batches
```bash
npm run batch:generate
```

This creates:
- `parallel-batches/batch-1.txt` - Files for batch 1
- `parallel-batches/batch-2.txt` - Files for batch 2
- `parallel-batches/process-batch-1.ps1` - Processing script
- (etc.)

### Step 2: Choose Your Method

#### Option A: Sequential (Safest)
```powershell
.\parallel-batches\process-batch-1.ps1
.\parallel-batches\process-batch-2.ps1
.\parallel-batches\process-batch-3.ps1
```

#### Option B: Parallel Terminals (Fastest)
Open 4 PowerShell terminals:
- Terminal 1: `.\parallel-batches\process-batch-1.ps1`
- Terminal 2: `.\parallel-batches\process-batch-2.ps1`
- Terminal 3: `.\parallel-batches\process-batch-3.ps1`
- Terminal 4: `.\parallel-batches\process-batch-4.ps1`

#### Option C: Multiple Cursor Windows
1. Open `parallel-batches/batch-1.txt` → Fix files listed
2. Open `parallel-batches/batch-2.txt` → Fix files listed
3. Use VS Code multi-cursor for pattern fixes

### Step 3: Verify
```bash
npm run typecheck:count  # Check remaining errors
npm run typecheck        # Final verification
```

## 💡 Pro Tips

1. **Always run auto-fix first:**
   ```bash
   npm run fix:auto
   npm run fix:type-imports
   ```

2. **Keep watch mode running:**
   ```bash
   npm run typecheck:watch:preserve
   ```

3. **Use VS Code multi-cursor:**
   - Search pattern → Alt+Enter → Replace
   - Fixes 10-20 instances in seconds

4. **Fix by error type:**
   - TS6133 (unused) → TS2322 (mismatch) → TS2345 (argument)

## 📊 Expected Results

- **Time:** 10-20 minutes (vs 2-4 hours baseline)
- **Speedup:** 10-15x faster
- **Errors fixed:** 100% (with auto-fix handling 30-40%)

## 📖 Full Documentation

- `docs/MANUAL_PARALLEL_WORKFLOW.md` - Complete guide
- `docs/MULTI_AGENT_WORKAROUND.md` - Why not multi-agent
- `docs/AGENT_QUICK_REFERENCE.md` - Quick reference

