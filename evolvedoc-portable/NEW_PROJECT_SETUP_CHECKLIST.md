# ✅ New Project Setup Checklist

> **Complete checklist to prevent common issues when setting up a new project with EvolveDoc**

**Use this checklist when:** Starting a new project or integrating EvolveDoc into an existing project

---

## 📋 Pre-Setup Verification

### Before You Start

- [ ] Node.js installed (v18+ recommended)
- [ ] Git initialized in project
- [ ] Project folder structure created
- [ ] EvolveDoc files copied to project

---

## 🔧 Step 1: Quality Gates Setup

### `.cursorrules` Configuration

- [ ] `.cursorrules` file exists in project root
- [ ] Section 13 (Development Checklist) is present
- [ ] Section 6 (Mandatory Quality Checks) is present
- [ ] Section 11 (TypeScript Workflow) is present
- [ ] Quality gates are marked as MANDATORY

**Verification:**
```bash
# Check if .cursorrules exists and has required sections
grep -q "DEVELOPMENT CHECKLIST" .cursorrules && echo "✓ Section 13 found"
grep -q "Mandatory Quality Checks" .cursorrules && echo "✓ Section 6 found"
grep -q "TypeScript Error Fixing" .cursorrules && echo "✓ Section 11 found"
```

---

## 📦 Step 2: Package.json Scripts

### Required Scripts

- [ ] `typecheck` - Basic type checking
- [ ] `typecheck:fast` - Fast type checking (skips libs)
- [ ] `typecheck:watch` - Watch mode for development
- [ ] `typecheck:watch:preserve` - Optimized watch mode
- [ ] `typecheck:build` - Project references build
- [ ] `typecheck:build:watch` - Project references watch
- [ ] `typecheck:group` - Group errors by type
- [ ] `typecheck:by-file` - Group errors by file
- [ ] `typecheck:by-type` - Group errors with suggestions
- [ ] `lint` - Run ESLint
- [ ] `lint:fix` - Auto-fix ESLint issues
- [ ] `format` - Format code with Prettier
- [ ] `format:check` - Check formatting

**Verification:**
```bash
# Test each script
npm run typecheck:fast
npm run lint:fix
npm run format
```

---

## 🛠️ Step 3: TypeScript Configuration

### Base Configuration

- [ ] `tsconfig.json` exists
- [ ] `tsconfig.base.json` exists (if using multi-config)
- [ ] `strict: true` is enabled
- [ ] `incremental: true` is enabled
- [ ] Path aliases configured (`@/*` etc.)
- [ ] Path aliases match Vite config (if using Vite)

**Verification:**
```bash
# Run typecheck
npm run typecheck:fast

# Should complete without errors (0 errors for new project)
```

**Check Path Aliases Match:**
```typescript
// vite.config.ts and tsconfig.json should have matching paths
// vite.config.ts:
resolve: { alias: { '@': path.resolve(__dirname, './src') } }

// tsconfig.json:
"paths": { "@/*": ["./src/*"] }
```

---

## 🔍 Step 4: ESLint Configuration

### Flat Config Setup

- [ ] `eslint.config.js` exists (not `.eslintrc.*`)
- [ ] Using ESLint 9+ (flat config format)
- [ ] TypeScript parser configured
- [ ] React plugins configured (if using React)
- [ ] Prettier integration configured
- [ ] Test files have separate config
- [ ] Scripts/config files have separate config

**Verification:**
```bash
# Run linting
npm run lint

# Should complete without blocking errors
# Warnings are OK, but should be minimal
```

**Check Config Format:**
```javascript
// Should be array-based (flat config)
export default [
  { ignores: ['dist'] },
  // ... configs
]
```

---

## ⚡ Step 5: Vite Configuration (if using Vite)

### Required Settings

- [ ] Path aliases configured
- [ ] Windows compatibility enabled (`usePolling: true`)
- [ ] HMR configured properly
- [ ] Build optimization configured
- [ ] Code splitting configured (if needed)

**Verification:**
```bash
# Start dev server
npm run dev

# Should start without errors
# HMR should work when files change
```

**Check Windows Compatibility:**
```typescript
// vite.config.ts should have:
server: {
  watch: {
    usePolling: true, // Required for Windows
    interval: 100,
  },
}
```

---

## 🧪 Step 6: Testing Setup (if using Vitest)

### Vitest Configuration

- [ ] `vitest.config.ts` exists
- [ ] Test setup file exists (`src/test/setup.ts`)
- [ ] Path aliases match main config
- [ ] Cross-platform path resolution (Windows compatible)
- [ ] Coverage configured (if needed)

**Verification:**
```bash
# Run tests
npm run test

# Should complete without errors
```

**Check Windows Compatibility:**
```typescript
// Should use path.resolve for cross-platform
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

setupFiles: [path.resolve(__dirname, './src/test/setup.ts')]
```

---

## 🪝 Step 7: Pre-Commit Hooks

### Husky Setup

- [ ] Husky installed (`npm install --save-dev husky`)
- [ ] Husky initialized (`npx husky init`)
- [ ] `.husky/pre-commit` file exists
- [ ] `lint-staged` configured in `package.json`
- [ ] Pre-commit hook runs `lint-staged`

**Verification:**
```bash
# Make a small change
echo "test" >> test.txt

# Try to commit
git add test.txt
git commit -m "test"

# Should run lint-staged automatically
# Should format/lint files before commit
```

**Check Pre-Commit Hook:**
```bash
# .husky/pre-commit should contain:
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

**Check lint-staged Config:**
```json
// package.json should have:
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

---

## 📁 Step 8: Project Structure

### Folder Organization

- [ ] Feature-based structure (if applicable)
- [ ] Shared components in `/components`
- [ ] Feature code in `/features`
- [ ] Utilities in `/lib` or `/utils`
- [ ] Types properly organized

**Verification:**
```bash
# Check structure
ls -la src/

# Should have clear organization:
# - components/ (shared UI)
# - features/ (domain-specific)
# - lib/ (utilities)
# - hooks/ (shared hooks)
# - pages/ (route handlers)
```

---

## 🔧 Step 9: Error Analysis Scripts

### Script Files

- [ ] `scripts/group-errors.js` exists (or template copied)
- [ ] `scripts/errors-by-file.js` exists
- [ ] `scripts/errors-by-type.js` exists
- [ ] Scripts are executable (if needed)
- [ ] Scripts work with npm scripts

**Verification:**
```bash
# Test error analysis (should work even with 0 errors)
npm run typecheck:group
npm run typecheck:by-file
npm run typecheck:by-type

# Should complete without errors
```

---

## 🪟 Step 10: Windows Compatibility (if on Windows)

### Windows-Specific Checks

- [ ] Vite polling enabled (`usePolling: true`)
- [ ] Path resolution uses `path.resolve()`
- [ ] ES module paths use `fileURLToPath`
- [ ] PowerShell scripts have execution policy bypass
- [ ] Git hooks work (Git Bash or WSL)

**Verification:**
```bash
# Test file watching
npm run dev
# Change a file - should hot reload

# Test path resolution
npm run typecheck
# Should work without path errors
```

**Check PowerShell Scripts:**
```powershell
# Scripts should use:
powershell -ExecutionPolicy Bypass -File script.ps1
```

---

## ✅ Step 11: Final Verification

### Complete System Check

- [ ] **TypeScript:** `npm run typecheck:fast` - 0 errors
- [ ] **Linting:** `npm run lint:fix` - No blocking errors
- [ ] **Formatting:** `npm run format` - Code formatted
- [ ] **Tests:** `npm run test` - All tests pass (if applicable)
- [ ] **Build:** `npm run build` - Builds successfully
- [ ] **Pre-commit:** Make test commit - Hooks run correctly

**Complete Verification Command:**
```bash
# Run all checks
npm run typecheck:fast && \
npm run lint:fix && \
npm run format && \
npm run test && \
npm run build && \
echo "✅ All checks passed!"
```

---

## 🚨 Common Issues to Watch For

### TypeScript Issues

- [ ] No `any` types (use proper types)
- [ ] No implicit `any` (strict mode catches this)
- [ ] Path aliases work (`@/` imports resolve)
- [ ] No unused variables (TS6133)

### ESLint Issues

- [ ] Using flat config (not legacy `.eslintrc`)
- [ ] Prettier conflicts resolved
- [ ] React hooks rules enabled
- [ ] TypeScript rules enabled

### Vite Issues

- [ ] HMR works (files update on change)
- [ ] Path aliases match TypeScript
- [ ] Windows file watching works (polling enabled)

### Pre-Commit Issues

- [ ] Hooks run automatically
- [ ] Can bypass with `--no-verify` (for emergencies)
- [ ] Hooks don't block on warnings (only errors)

---

## 📝 Quick Reference

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server
npm run typecheck:watch        # Watch mode for types

# Quality Checks
npm run typecheck:fast         # Quick type check
npm run lint:fix              # Auto-fix linting
npm run format                # Format code

# Error Analysis
npm run typecheck:group       # Group errors by type
npm run typecheck:by-file     # Group errors by file
npm run typecheck:by-type     # Errors with suggestions

# Testing
npm run test                  # Run tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report

# Build
npm run build                 # Production build
```

---

## 🎯 Success Criteria

Your project is properly set up when:

✅ **TypeScript:** 0 errors, strict mode enabled  
✅ **ESLint:** No blocking errors, auto-fix works  
✅ **Pre-commit:** Hooks run automatically  
✅ **Quality Gates:** Enforced during development  
✅ **Windows:** File watching and paths work (if on Windows)  
✅ **Scripts:** Error analysis tools available  
✅ **Structure:** Clear, organized folder structure  

---

## 📚 Reference Documents

- **Quality Gates:** `QUALITY_GATES_CHECKLIST.md`
- **Integration Steps:** `integration-steps/QUICK_START.md`
- **Windows Issues:** `troubleshooting/WINDOWS_COMPATIBILITY.md`
- **Master Prompts:** `master-prompts/MASTER_*.md`

---

## 🆘 If Something Fails

1. **Check the relevant master prompt** for your issue
2. **Review troubleshooting guide** (`WINDOWS_COMPATIBILITY.md`)
3. **Verify checklist items** above
4. **Check EvolveDoc version** (should be 1.3.0+)

---

**Version:** 1.3.0  
**Last Updated:** 2025-01-27  
**Use this checklist:** Every time you set up a new project with EvolveDoc

