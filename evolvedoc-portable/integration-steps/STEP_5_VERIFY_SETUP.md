# STEP 5: Verify Setup

## 📋 What This Step Does

Verifies that EvolveDoc is correctly set up and ready to use in your project.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I need to verify that EvolveDoc is correctly set up in my project. Please:

1. Check that all required folders exist:
   - docs/core-system/
   - docs/master-prompts/
   - docs/troubleshooting/
   - docs/scripts/
   - docs/guides/
   - docs/all-docs/

2. Verify file counts:
   - Core system files: 4 files
   - Master prompts: [COUNT] files
   - Troubleshooting: 3 files
   - Scripts: 1 file
   - Guides: 2+ files
   - All-docs: Should match master-prompts + core + guides

3. Test Cursor @Folders access:
   - Can I use @docs/all-docs in Cursor?
   - Are files accessible?

4. Check for any remaining old project references

5. Verify quality gates are set up:
   - Check that `.cursorrules` exists in project root
   - Verify `.cursorrules` includes Section 13 (Development Checklist)
   - Verify `.cursorrules` includes Section 6 (Mandatory Quality Checks)
   - Check that `package.json` has required scripts: `typecheck`, `lint:fix`, `format`
   - Verify pre-commit hooks are configured (check for `.husky/pre-commit` or `lint-staged` in package.json)

6. Provide a final setup summary

My project path: [YOUR_PROJECT_PATH]
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] All folders exist and have correct files
- [ ] File counts match expected numbers
- [ ] `docs/all-docs/` is populated
- [ ] Cursor can access `@docs/all-docs`
- [ ] No old project references found
- [ ] **Quality gates verified:**
  - [ ] `.cursorrules` exists in project root
  - [ ] `.cursorrules` includes Section 13 (Development Checklist)
  - [ ] `.cursorrules` includes Section 6 (Mandatory Quality Checks)
  - [ ] `package.json` has `typecheck` script
  - [ ] `package.json` has `lint:fix` script
  - [ ] `package.json` has `format` script
  - [ ] Pre-commit hooks configured (Husky + lint-staged)
- [ ] Setup summary provided

---

## 🧪 Test EvolveDoc

Try using EvolveDoc:

1. **Test Cursor @Folders:**
   ```
   @Folders docs/all-docs
   @docs/core-system/DOCUMENTATION_EVOLUTION_SYSTEM.md
   
   Explain how EvolveDoc works
   ```

2. **Test Master Prompt:**
   ```
   @docs/master-prompts/MASTER_TYPESCRIPT_PATTERNS_PROMPT.md
   
   Help me fix TypeScript errors in my code
   ```

3. **Test Troubleshooting:**
   ```
   @docs/troubleshooting/TROUBLESHOOTING.md
   
   I'm having an issue with [something]
   ```

---

## 📝 Notes

- If Cursor can't access `@docs/all-docs`, check folder permissions
- Make sure you're in the project root when using @Folders
- EvolveDoc will start learning from your code changes automatically

---

## ✅ Setup Complete!

If all checks pass, EvolveDoc is ready to use!

**Next Steps:**
- Start coding - EvolveDoc will learn from your changes
- Use master prompts when implementing features
- Check troubleshooting logs if issues arise
- **Run quality checks after each page/component:** `npm run typecheck`, `npm run lint:fix`, `npm run format`

---

## 📖 Learn More

- **System Overview:** `docs/core-system/DOCUMENTATION_EVOLUTION_SYSTEM.md`
- **Usage Guide:** `docs/guides/MASTER_PROMPTS_USAGE_GUIDE.md`
- **Troubleshooting:** `docs/troubleshooting/TROUBLESHOOTING.md`

