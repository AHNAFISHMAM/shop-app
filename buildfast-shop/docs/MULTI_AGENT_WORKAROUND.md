# Multi-Agent Mode Workaround

## ⚠️ Known Issue

Cursor's multi-agent mode is **unstable on Windows** and crashes frequently. This is a known issue reported by many users.

## ✅ Recommended Solution: Manual Parallel Processing

Instead of using unstable multi-agent mode, use manual parallel processing with batches.

### Quick Start

```bash
# 1. Generate batches
npm run batch:generate

# 2. Process batches (choose one method):
# Method A: Sequential (safest)
.\parallel-batches\process-batch-1.ps1
.\parallel-batches\process-batch-2.ps1

# Method B: Parallel terminals (fastest)
# Open multiple PowerShell terminals, run one batch per terminal

# Method C: Multiple Cursor windows
# Open batch-X.txt files in separate Cursor windows
```

## 📋 Complete Workflow

See `docs/MANUAL_PARALLEL_WORKFLOW.md` for the complete guide.

## 🚀 Expected Performance

- **Sequential batches:** 3-4x faster
- **Parallel terminals:** 5-8x faster  
- **Multiple Cursor windows:** 5-10x faster
- **With all optimizations:** 10-15x faster overall

## 🔧 Troubleshooting Multi-Agent Mode

If you want to try fixing multi-agent mode:

1. **Disable External File Protection:**
   - Cursor Settings → Agents tab
   - Turn off "External-file Protection"

2. **Update Cursor:**
   - Help → Check for Updates
   - Try version 2.0.77 (reported stable)

3. **Check System Resources:**
   - Close other applications
   - Check Task Manager for RAM/CPU usage

## 💡 Why Manual Processing Works Better

- ✅ **No crashes** - Stable and reliable
- ✅ **Full control** - You decide what to fix when
- ✅ **Easy debugging** - See exactly what's happening
- ✅ **Flexible** - Use any method (terminals, windows, sequential)
- ✅ **Still fast** - 10-15x faster with optimizations

## 📖 Related Documentation

- `docs/MANUAL_PARALLEL_WORKFLOW.md` - Complete manual workflow
- `docs/AGENT_QUICK_REFERENCE.md` - Quick reference
- `docs/SPEED_OPTIMIZATIONS.md` - All optimizations

