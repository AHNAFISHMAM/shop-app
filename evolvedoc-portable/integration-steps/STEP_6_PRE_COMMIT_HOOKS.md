# STEP 6: Set Up Pre-Commit Hooks

## 📋 What This Step Does

Sets up Husky and lint-staged to automatically run quality checks before commits, preventing broken code from being committed.

---

## 🚀 Copy This Prompt to Cursor/AI:

```
I need to set up pre-commit hooks for my project. Please:

1. Install Husky and lint-staged:
   - npm install --save-dev husky lint-staged

2. Initialize Husky:
   - npx husky init

3. Configure lint-staged in package.json:
   - Add lint-staged configuration for TypeScript, JavaScript, JSON, CSS, and Markdown files
   - Run eslint --fix and prettier --write for code files
   - Run prettier --write for other files

4. Update .husky/pre-commit hook:
   - Run lint-staged before commit
   - Optionally add typecheck (can be slow, consider making it optional)

5. Test the setup:
   - Make a small change
   - Try to commit
   - Verify hooks run correctly

My project structure:
- TypeScript files: src/**/*.{ts,tsx}
- JavaScript files: src/**/*.{js,jsx}
- Config files: *.{json,css,md}
```

---

## ✅ Verification Checklist

After running the prompt, verify:

- [ ] Husky installed and initialized
- [ ] `.husky/pre-commit` file exists
- [ ] `lint-staged` configured in `package.json`
- [ ] Pre-commit hook runs on commit attempt
- [ ] Linting and formatting run automatically
- [ ] Hooks can be bypassed with `--no-verify` if needed (for emergencies)

---

## 📝 Configuration Details

### package.json

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

### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Optional: Add TypeScript Check

**Note:** TypeScript checking can be slow. Consider making it optional or running it in watch mode during development instead.

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged first
npx lint-staged

# Optional: Run typecheck (can be slow)
# npm run typecheck:fast
```

---

## 🎯 Best Practices

✅ **Do:**
- Keep hooks fast (lint-staged only runs on staged files)
- Use `typecheck:fast` if adding typecheck to hooks
- Test hooks after setup
- Document how to bypass hooks (for emergencies)

❌ **Don't:**
- Run full typecheck in pre-commit (too slow)
- Run tests in pre-commit (use CI/CD instead)
- Block commits for warnings (only errors)
- Skip hooks setup (prevents broken commits)

---

## 🔧 Troubleshooting

### Hooks Not Running

**Windows:**
- Ensure Git Bash or WSL is used
- Check file permissions on `.husky/pre-commit`
- Run `chmod +x .husky/pre-commit` if needed

**All Platforms:**
- Verify Husky is initialized: `npx husky init`
- Check `.husky/pre-commit` exists and is executable
- Verify `lint-staged` is in `package.json`

### Slow Hooks

- Use `lint-staged` (only processes staged files)
- Use `typecheck:fast` instead of full typecheck
- Consider running typecheck in watch mode during development
- Move slow checks to CI/CD

### Bypassing Hooks

**For emergencies only:**
```bash
git commit --no-verify -m "Emergency commit"
```

**Note:** Only use when absolutely necessary. Pre-commit hooks prevent broken code from being committed.

---

## 📚 Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- Quality Gates Checklist: `QUALITY_GATES_CHECKLIST.md`

---

## ➡️ Next Step

Once pre-commit hooks are set up, proceed to:
**STEP_5_VERIFY_SETUP.md** - Verify entire setup including hooks

---

**Reference:** This step ensures quality gates are enforced at commit time, preventing broken code from entering the repository.

