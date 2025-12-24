# ✅ Quality Gates Setup Checklist

> **Prevent commit failures by setting up quality gates during development**

---

## 🎯 Purpose

This checklist ensures your project has mandatory quality gates configured to catch TypeScript and linting errors **during development**, not at commit time.

**Why this matters:**
- Prevents surprise commit failures
- Catches errors early (faster feedback)
- Ensures code quality from the start
- Makes development smoother

---

## ✅ Setup Checklist

### 1. `.cursorrules` Configuration

- [ ] `.cursorrules` file exists in project root
- [ ] Section 3: "Speed > Perfection (WITH Quality Gates)" is present
- [ ] Section 6: "Mandatory Quality Checks (After Each Page/Component)" is present
- [ ] Section 11: "TYPESCRIPT ERROR FIXING WORKFLOW (MANDATORY DURING DEVELOPMENT)" is present
- [ ] Section 13: "DEVELOPMENT CHECKLIST (MANDATORY)" is present

**How to verify:**
```bash
# Check if file exists
ls .cursorrules

# Search for key sections
grep -i "Section 13" .cursorrules
grep -i "Development Checklist" .cursorrules
grep -i "Mandatory Quality Checks" .cursorrules
```

**If missing:** Copy `.cursorrules.template` from `evolvedoc-portable/` to your project root.

---

### 2. `package.json` Scripts

- [ ] `typecheck` script exists (or `typecheck:fast`)
- [ ] `lint:fix` script exists
- [ ] `format` script exists
- [ ] `typecheck:watch` script exists (recommended)

**Required scripts:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:fast": "tsc --noEmit --skipLibCheck",
    "typecheck:watch": "tsc --noEmit --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

**How to verify:**
```bash
# Check if scripts exist
npm run typecheck --help
npm run lint:fix --help
npm run format --help
```

**If missing:** Add scripts to `package.json` (see `package.json.scripts.template` for reference).

---

### 3. Pre-Commit Hooks

- [ ] Husky is installed (`package.json` devDependencies)
- [ ] `.husky/pre-commit` file exists
- [ ] `lint-staged` is configured in `package.json`
- [ ] `lint-staged` runs on TypeScript/JavaScript files

**Required configuration:**

**package.json:**
```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^15.2.11"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

**.husky/pre-commit:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**How to verify:**
```bash
# Check if Husky is installed
npm list husky

# Check if lint-staged is configured
grep "lint-staged" package.json

# Check if pre-commit hook exists
ls .husky/pre-commit
```

**If missing:**
```bash
# Install Husky
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky init

# Create pre-commit hook
echo 'npx lint-staged' > .husky/pre-commit
chmod +x .husky/pre-commit
```

---

## 🧪 Test Quality Gates

### Test TypeScript Check
```bash
npm run typecheck
# OR
npm run typecheck:fast
```

**Expected:** Should run without errors (or show existing errors to fix)

### Test Linting
```bash
npm run lint:fix
```

**Expected:** Should auto-fix linting issues

### Test Formatting
```bash
npm run format
```

**Expected:** Should format all code files

### Test Pre-Commit Hook
```bash
# Make a test commit
git add .
git commit -m "test: verify pre-commit hooks"
```

**Expected:** Pre-commit hook should run and check staged files

---

## 📋 Development Workflow

### After Building Each Page/Component

**MANDATORY STEPS:**
1. ✅ Run `npm run typecheck` (or `typecheck:fast`)
   - Fix all TypeScript errors immediately
   - Don't accumulate errors

2. ✅ Run `npm run lint:fix`
   - Auto-fixes most linting issues
   - Fix remaining warnings if critical

3. ✅ Run `npm run format`
   - Ensures consistent code formatting

### During Active Development

**RECOMMENDED:**
- Keep `npm run typecheck:watch` running in background terminal
- Fix errors as they appear (real-time feedback)
- Don't let errors accumulate

### Before Committing

**VERIFY:**
- ✅ All TypeScript errors fixed (0 errors)
- ✅ All linting issues resolved
- ✅ Code formatted
- ✅ Pre-commit hooks will pass

---

## ⚠️ Common Issues

### Issue: "typecheck command not found"
**Solution:** Add `typecheck` script to `package.json`

### Issue: "lint:fix command not found"
**Solution:** Add `lint:fix` script to `package.json` and ensure ESLint is installed

### Issue: "Pre-commit hook not running"
**Solution:** 
- Verify Husky is installed: `npm list husky`
- Verify `.husky/pre-commit` exists and is executable
- Run `npx husky install` if needed

### Issue: "Too many errors to fix"
**Solution:**
- Fix incrementally (don't accumulate)
- Use `typecheck:watch` for real-time feedback
- Fix errors as you build, not all at once

---

## 📖 Reference Files

- **`.cursorrules.template`** - Template with quality gates built-in
- **`package.json.scripts.template`** - Required npm scripts
- **`STEP_1_COPY_FILES.md`** - Instructions to copy `.cursorrules.template`
- **`STEP_5_VERIFY_SETUP.md`** - Verification steps

---

## ✅ Success Criteria

Your quality gates are properly set up when:

- ✅ `.cursorrules` includes all mandatory sections
- ✅ All required scripts exist in `package.json`
- ✅ Pre-commit hooks are configured and working
- ✅ You can run `npm run typecheck`, `lint:fix`, and `format` successfully
- ✅ Pre-commit hook runs on test commits
- ✅ You run quality checks after each page/component

---

**Remember:** Quality gates during development prevent commit failures. Fast development + type safety = no surprises at commit time.

**Last Updated:** 2025-01-27  
**Version:** 1.2.0

