# STEP 4: Initialize EvolveDoc System

## 📋 What This Step Does

Initializes the EvolveDoc system by running the sync script to populate `docs/all-docs/` folder and set up the complete structure.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I need to initialize the EvolveDoc system in my project. Please:

1. Run the sync script to populate docs/all-docs/ folder:
   powershell -ExecutionPolicy Bypass -File docs\scripts\sync-docs.ps1

2. Verify that docs/all-docs/ folder now contains:
   - All master prompts
   - Core system files
   - INDEX.md file
   - Guides

3. If the script fails, help me fix any issues

4. Confirm the system is ready to use

My project path: [YOUR_PROJECT_PATH]
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] `docs/all-docs/` folder populated with files
- [ ] All master prompts in `docs/all-docs/`
- [ ] Core system files in `docs/all-docs/`
- [ ] `docs/all-docs/INDEX.md` exists
- [ ] Sync script ran without errors
- [ ] File count matches expected (check INDEX.md)

---

## 🔧 Manual Alternative (If Script Fails)

If the PowerShell script doesn't work, you can manually:

1. Copy all files from `docs/master-prompts/` to `docs/all-docs/`
2. Copy files from `docs/core-system/` to `docs/all-docs/`
3. Copy files from `docs/guides/` to `docs/all-docs/`
4. Create `docs/all-docs/INDEX.md` listing all files

---

## 📝 Notes

- The `docs/all-docs/` folder is used by Cursor's `@Folders` feature
- This folder should stay in sync with source files
- Re-run sync script after any manual changes to source files

---

## ➡️ Next Step

Once system is initialized, proceed to:
**STEP_5_VERIFY_SETUP.md** - Verify everything works correctly

