# STEP 1: Copy Files to Your Project

## 📋 What This Step Does

Copies all EvolveDoc files from `evolvedoc-portable/` to your new project's `docs/` folder structure.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I'm setting up EvolveDoc in my new project. Please:

1. Copy all files from evolvedoc-portable/ to my project's docs/ folder
2. Create the following folder structure in docs/:
   - docs/core-system/
   - docs/master-prompts/
   - docs/troubleshooting/
   - docs/scripts/
   - docs/guides/
   - docs/all-docs/ (empty folder for now)
3. Copy files to their respective folders:
   - core-system/ files → docs/core-system/
   - master-prompts/ files → docs/master-prompts/
   - troubleshooting/ files → docs/troubleshooting/
   - scripts/ files → docs/scripts/
   - guides/ files → docs/guides/
4. Copy template files to project root:
   - `.cursorrules.template` → `.cursorrules` (IMPORTANT: This sets up quality gates)
   - `QUALITY_GATES_CHECKLIST.md` → project root (for reference)
   - `package.json.scripts.template` → keep in docs/ or project root (for reference)
5. Copy TROUBLESHOOTING.md from troubleshooting/ to project root (optional)
6. Confirm all files are copied correctly

My project path is: [YOUR_PROJECT_PATH]
My project structure: [DESCRIBE YOUR PROJECT STRUCTURE]
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] `docs/core-system/` folder exists with 4 files
- [ ] `docs/master-prompts/` folder exists with all MASTER_*.md files
- [ ] `docs/troubleshooting/` folder exists with 3 files
- [ ] `docs/scripts/` folder exists with sync-docs.ps1
- [ ] `docs/guides/` folder exists with guide files
- [ ] `docs/all-docs/` empty folder created
- [ ] **`.cursorrules` copied to project root from `.cursorrules.template`**
- [ ] **`QUALITY_GATES_CHECKLIST.md` copied to project root (for reference)**
- [ ] All files copied without errors

---

## 📝 Notes

- The `docs/all-docs/` folder will be populated in STEP 4
- **IMPORTANT:** Copying `.cursorrules.template` to `.cursorrules` sets up mandatory quality gates that prevent commit failures
- You can skip copying TROUBLESHOOTING.md to root if you prefer it in `docs/troubleshooting/`
- Keep the `integration-steps/` folder for reference (or delete after setup)
- After copying `.cursorrules`, customize it for your tech stack in STEP 3

---

## ➡️ Next Step

Once files are copied, proceed to:
**STEP_2_UPDATE_REFERENCES.md** - Update project names and paths

