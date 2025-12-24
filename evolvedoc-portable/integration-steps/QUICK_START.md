# 🚀 EvolveDoc Quick Start Guide

> **Copy-paste ready prompts for fast integration**

---

## Overview

This guide provides a quick summary of all integration steps. Each step has a detailed file with copy-paste prompts.

---

## Integration Steps Summary

### Step 1: Copy Files
**File:** `STEP_1_COPY_FILES.md`

Copy all EvolveDoc files from `evolvedoc-portable/` to your project's `docs/` folder.

**Quick Prompt:**
```
Copy all files from evolvedoc-portable/ to my project's docs/ folder, creating the proper folder structure.
```

---

### Step 2: Update References
**File:** `STEP_2_UPDATE_REFERENCES.md`

Update all project-specific references (app names, file paths).

**Quick Prompt:**
```
Find and replace in all .md files:
- "Star Café" → "[YOUR_APP_NAME]"
- "buildfast-shop" → "[YOUR_PROJECT_NAME]"
- Update all file paths
```

---

### Step 3: Customize Stack
**File:** `STEP_3_CUSTOMIZE_STACK.md`

Customize master prompts for your tech stack.

**Quick Prompt:**
```
Review and customize master prompts for my tech stack:
- Backend: [YOUR_BACKEND]
- Frontend: [YOUR_FRONTEND]
- Database: [YOUR_DATABASE]
- Auth: [YOUR_AUTH]
```

---

### Step 4: Initialize System
**File:** `STEP_4_INITIALIZE_SYSTEM.md`

Run sync script to populate `docs/all-docs/` folder.

**Quick Command:**
```powershell
powershell -ExecutionPolicy Bypass -File docs\scripts\sync-docs.ps1
```

---

### Step 5: Verify Setup
**File:** `STEP_5_VERIFY_SETUP.md`

Verify everything is set up correctly.

**Quick Prompt:**
```
Verify EvolveDoc setup:
- Check all folders exist
- Verify file counts
- Test Cursor @Folders access
- Check for old references
- Verify quality gates are configured
```

---

### Step 6: Set Up Quality Gates
**File:** `QUALITY_GATES_CHECKLIST.md` (reference)

Ensure quality gates are properly configured to prevent commit failures.

**Quick Checklist:**
```
1. Verify .cursorrules includes Section 13 (Development Checklist)
2. Verify package.json has required scripts (typecheck, lint:fix, format)
3. Verify pre-commit hooks are configured (Husky + lint-staged)
4. Test quality checks: npm run typecheck && npm run lint:fix && npm run format
```

---

## Complete Integration Prompt

**Copy this entire prompt for full integration:**

```
I'm integrating EvolveDoc into my new project. Please:

STEP 1: Copy all files from evolvedoc-portable/ to docs/ folder with proper structure

STEP 2: Update all project references:
- "Star Café" → "[YOUR_APP_NAME]"
- "buildfast-shop" → "[YOUR_PROJECT_NAME]"
- Update file paths

STEP 3: Customize for my tech stack:
- Backend: [YOUR_BACKEND]
- Frontend: [YOUR_FRONTEND]
- Database: [YOUR_DATABASE]

STEP 4: Run sync script to initialize docs/all-docs/

STEP 5: Verify setup and test Cursor @Folders access

STEP 6: Verify quality gates are configured (see QUALITY_GATES_CHECKLIST.md)

My project details:
- App Name: [YOUR_APP_NAME]
- Project Name: [YOUR_PROJECT_NAME]
- Project Path: [YOUR_PROJECT_PATH]
- Tech Stack: [YOUR_TECH_STACK]
```

---

## File Structure After Integration

```
your-project/
├── docs/
│   ├── core-system/          ← Core EvolveDoc files
│   ├── master-prompts/        ← All master prompts
│   ├── troubleshooting/       ← Troubleshooting system
│   ├── scripts/              ← Sync scripts
│   ├── guides/               ← Usage guides
│   └── all-docs/             ← Synced files (for Cursor)
└── TROUBLESHOOTING.md        ← Optional root index
```

---

## Next Steps After Integration

1. **Start coding** - EvolveDoc learns automatically
2. **Use master prompts** - Reference them when implementing features
3. **Check troubleshooting** - If issues arise after 3 failed attempts
4. **⚠️ IMPORTANT:** Ensure `.cursorrules` includes mandatory quality gates (Section 13) to prevent commit failures

---

## Need Help?

- **Detailed Steps:** See individual STEP_*.md files
- **System Overview:** `../core-system/DOCUMENTATION_EVOLUTION_SYSTEM.md`
- **Usage Guide:** `../guides/MASTER_PROMPTS_USAGE_GUIDE.md`

---

**Version:** 1.2.0  
**Last Updated:** 2025-01-27

