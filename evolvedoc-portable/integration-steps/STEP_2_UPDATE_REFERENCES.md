# STEP 2: Update Project References

## 📋 What This Step Does

Updates all project-specific references in EvolveDoc files (app names, file paths, etc.) to match your new project.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I need to update all project references in EvolveDoc files for my new project. Please:

1. Find and replace in ALL .md files in docs/ folder:
   - "Star Café" → "[YOUR_APP_NAME]"
   - "StarCafe" → "[YOUR_APP_NAME_NO_SPACES]"
   - "buildfast-shop" → "[YOUR_PROJECT_NAME]"
   - "buildfast-shop/src/" → "[YOUR_PROJECT_NAME]/src/"
   - "buildfast-shop/supabase/" → "[YOUR_PROJECT_NAME]/supabase/"

2. Update any other project-specific references you find

3. Show me a summary of what was changed

My new project details:
- App Name: [YOUR_APP_NAME]
- Project Name: [YOUR_PROJECT_NAME]
- Project Path: [YOUR_PROJECT_PATH]
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] All "Star Café" references replaced
- [ ] All "buildfast-shop" references replaced
- [ ] All file paths updated
- [ ] No old project references remain
- [ ] Summary of changes provided

---

## 🔍 Manual Check (Optional)

You can also manually verify by searching in VS Code:
- Press `Ctrl+Shift+F` (Find in Files)
- Search for: "Star Café", "buildfast-shop"
- Should find 0 results (or only in this integration-steps folder)

---

## 📝 Notes

- Some files may not have project-specific references (like CONCEPTS_COMPARISON.md)
- Keep integration-steps files unchanged (they're templates)
- If you're using a different tech stack, you'll customize more in STEP 3

---

## ➡️ Next Step

Once references are updated, proceed to:
**STEP_3_CUSTOMIZE_STACK.md** - Customize for your tech stack

