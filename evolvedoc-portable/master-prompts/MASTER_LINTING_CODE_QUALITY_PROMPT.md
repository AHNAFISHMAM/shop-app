# 📋 MASTER LINTING & CODE QUALITY PROMPT
## Production-Ready Linting Configuration and Best Practices

---

## 📋 OVERVIEW

This master prompt provides a comprehensive guide for setting up ESLint, Prettier, and maintaining code quality across production applications. It covers ESLint flat config, TypeScript integration, React-specific rules, and real-world patterns from production codebases.

**Applicable to:**
- ESLint 9+ flat config setup
- TypeScript linting configuration
- React and React Hooks rules
- Prettier integration
- Code quality enforcement
- Pre-commit hooks setup
- CI/CD integration

---

## 🎯 CORE PRINCIPLES

### 1. **Type Safety First**
- TypeScript handles type checking - disable redundant rules
- Use `@typescript-eslint/no-explicit-any: 'warn'` to catch `any` types
- Allow `_` prefix for intentionally unused variables

### 2. **React Best Practices**
- Disable `react/prop-types` for TypeScript projects
- Enable React Hooks exhaustive-deps checking
- Allow constant exports in React Refresh

### 3. **Developer Experience**
- Use `warn` instead of `error` for non-critical issues
- Allow intentional unused variables with `_` prefix
- Provide clear, actionable error messages

### 4. **Consistency**
- Enforce Prettier formatting
- Consistent rules across file types
- Proper globals configuration per environment

---

## 🔍 PHASE 1: ESLINT FLAT CONFIG SETUP

### Step 1.1: Basic Configuration Structure

**Real Example from buildfast-shop:**

```javascript
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  { ignores: ['dist', '.tsbuildinfo'] },
  // ... file-specific configs
]
```

### Step 1.2: TypeScript/TSX Configuration

**Real Example from buildfast-shop:**

```javascript
{
  files: ['**/*.{ts,tsx}'],
  ignores: ['scripts/**', '*.config.ts', '*.config.js', 'tailwind.config.js', 'eslint.config.js', 'supabase/**', '**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 2022,
    globals: {
      ...globals.browser,
      React: 'readonly',
      JSX: 'readonly',
      NodeJS: 'readonly',
    },
    parserOptions: {
      ecmaVersion: 'latest',
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
      project: './tsconfig.json',
    },
  },
  settings: { react: { version: '18.3' } },
  plugins: {
    react,
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    '@typescript-eslint': tseslint,
    prettier: prettierPlugin,
  },
  rules: {
    ...js.configs.recommended.rules,
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
    ...reactHooks.configs.recommended.rules,
    ...tseslint.configs.recommended.rules,
    ...prettierConfig.rules,
    'no-undef': 'off', // TypeScript handles this
    'react/prop-types': 'off', // TypeScript handles prop validation
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'warn',
  },
}
```

### Step 1.3: Test Files Configuration

**Real Example from buildfast-shop:**

```javascript
{
  files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}', '**/setup.ts'],
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 2022,
    globals: {
      ...globals.node,
      ...globals.browser,
    },
    parserOptions: {
      ecmaVersion: 'latest',
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
      project: './tsconfig.json',
    },
  },
  rules: {
    'no-undef': 'off', // Test files can use globals
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

### Step 1.4: Config Files Configuration

**Real Example from buildfast-shop:**

```javascript
{
  files: ['postcss.config.js', 'tailwind.config.js', 'vite.config.ts', 'vitest.config.ts'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
    sourceType: 'module',
  },
  rules: {
    ...js.configs.recommended.rules,
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
}
```

### Step 1.5: Script Files Configuration

**Real Example from buildfast-shop:**

```javascript
// ES Module scripts
{
  files: ['scripts/**/*.js', 'scripts/**/*.mjs'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_', 
      varsIgnorePattern: '^_' 
    }],
  },
}

// CommonJS scripts
{
  files: ['scripts/**/*.js'], // Specific CommonJS files
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
    sourceType: 'commonjs',
  },
}
```

---

## 🔍 PHASE 2: KEY RULES EXPLAINED

### Rule 1: `no-undef: 'off'` for TypeScript

**Why:** TypeScript's type checker already handles undefined variable detection.

```javascript
'no-undef': 'off', // TypeScript handles this
```

### Rule 2: `react/prop-types: 'off'` for TypeScript

**Why:** TypeScript interfaces provide better type checking than PropTypes.

```javascript
'react/prop-types': 'off', // TypeScript handles prop validation
```

### Rule 3: Unused Variables Pattern

**Why:** Sometimes variables are intentionally unused (e.g., destructuring, future use).

```javascript
'@typescript-eslint/no-unused-vars': [
  'warn',
  { 
    argsIgnorePattern: '^_',  // Allow _prefix
    varsIgnorePattern: '^_',
  },
]
```

**Usage:**
```typescript
// ✅ Good: Explicitly mark as unused
const [_categories, setCategories] = useState([])
const { data, _error } = await fetchData() // error intentionally unused
```

### Rule 4: `@typescript-eslint/no-explicit-any: 'warn'`

**Why:** Warn instead of error to allow gradual migration, but still catch issues.

```javascript
'@typescript-eslint/no-explicit-any': 'warn',
```

### Rule 5: React Refresh Configuration

**Why:** Allow constant exports for shared constants while maintaining Fast Refresh.

```javascript
'react-refresh/only-export-components': [
  'warn',
  { allowConstantExport: true },
]
```

---

## 🔍 PHASE 3: PRETTIER INTEGRATION

### Step 3.1: Prettier Configuration

```javascript
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

// In plugins:
plugins: {
  prettier: prettierPlugin,
}

// In rules:
rules: {
  ...prettierConfig.rules, // Disable conflicting ESLint rules
  'prettier/prettier': 'warn', // Warn on formatting issues
}
```

### Step 3.2: Auto-Fix on Save

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  }
}
```

---

## 🔍 PHASE 4: PRE-COMMIT HOOKS

### Step 4.1: Husky Setup

```bash
npm install --save-dev husky lint-staged
npx husky init
```

### Step 4.2: lint-staged Configuration

**package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Step 4.3: Pre-commit Hook

**.husky/pre-commit:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

---

## 🔍 PHASE 5: CI/CD INTEGRATION

### Step 5.1: GitHub Actions Example

```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
```

---

## 🎯 SUCCESS CRITERIA

Linting setup is complete when:

1. ✅ **Zero Errors**: All linting errors resolved
2. ✅ **Warnings Managed**: Non-blocking warnings documented
3. ✅ **Type Safety**: TypeScript strict mode enabled
4. ✅ **Formatting**: Prettier auto-fixes on save
5. ✅ **Pre-commit**: Hooks prevent bad commits
6. ✅ **CI/CD**: Automated checks in pipeline
7. ✅ **Documentation**: Rules documented and understood

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- Use `error` for formatting issues (use `warn`)
- Disable important rules without justification
- Mix legacy and flat config formats
- Skip pre-commit hooks
- Ignore TypeScript errors
- Use `any` types without good reason

### ✅ Do:

- Use `warn` for non-critical issues
- Allow `_` prefix for unused variables
- Configure proper globals per file type
- Enable pre-commit hooks
- Fix TypeScript errors before committing
- Replace `any` with `unknown` and type guards

---

## 📚 REFERENCE

**Real Examples:**
- `buildfast-shop/eslint.config.js` - Complete production configuration
- `buildfast-shop/package.json` - Scripts and lint-staged setup

**Key Patterns:**
- TypeScript-specific rules for `.ts/.tsx` files
- React-specific rules for components
- Test file exceptions
- Config file handling
- Script file handling

---

**This master prompt should be followed for ALL linting and code quality setup.**

