# 🔍 Master ESLint Flat Config Prompt

> **Comprehensive guide for ESLint 9+ flat config format, multi-file configurations, and best practices**

---

## 📋 Table of Contents

1. [Flat Config Overview](#flat-config-overview)
2. [Basic Setup](#basic-setup)
3. [Multiple File Configurations](#multiple-file-configurations)
4. [TypeScript Integration](#typescript-integration)
5. [React Integration](#react-integration)
6. [Prettier Integration](#prettier-integration)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## 1. Flat Config Overview

### What Changed in ESLint 9+

- **Flat Config Format:** New `.eslint.config.js` (or `.mjs`) format
- **Array-Based:** Configs are arrays of objects
- **No Cascading:** Each config is independent
- **Better Performance:** Faster than legacy format
- **TypeScript Support:** Native TypeScript parser support

### Migration from Legacy

**Old format (.eslintrc.js):**
```javascript
module.exports = {
  extends: ['eslint:recommended'],
  rules: {},
}
```

**New format (eslint.config.js):**
```javascript
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    rules: {},
  },
]
```

---

## 2. Basic Setup

### Minimal Config

```javascript
import js from '@eslint/js'

export default [
  { ignores: ['dist', '.tsbuildinfo'] },
  js.configs.recommended,
]
```

### With TypeScript

```javascript
import js from '@eslint/js'
import globals from 'globals'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  { ignores: ['dist', '.tsbuildinfo'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
    },
  },
]
```

---

## 3. Multiple File Configurations

### Complete Multi-File Setup

```javascript
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
  // Global ignores
  { ignores: ['dist', '.tsbuildinfo'] },
  
  // ESLint config itself - ES module
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  
  // Config files using ES modules
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
  },
  
  // Scripts using ES modules
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  
  // Scripts using CommonJS
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'commonjs',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  
  // Test files configuration
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
      'no-undef': 'off', // Test files can use globals
      'react/jsx-no-target-blank': 'off',
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
  },
  
  // TypeScript/TSX configuration for source files
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
      'react/jsx-no-target-blank': 'off',
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
  },
  
  // JavaScript/JSX configuration for source files (legacy)
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['scripts/**', '*.config.js', 'tailwind.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'prettier/prettier': 'warn',
    },
  },
]
```

---

## 4. TypeScript Integration

### Parser Configuration

```javascript
import tsparser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'

{
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: 'latest',
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
      project: './tsconfig.json', // For type-aware rules
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
  },
  rules: {
    ...tseslint.configs.recommended.rules,
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

### Type-Aware Rules

**Requires `project` in parserOptions:**
```javascript
parserOptions: {
  project: './tsconfig.json',
  tsconfigRootDir: __dirname,
}
```

**Note:** Type-aware rules are slower but more accurate.

---

## 5. React Integration

### React Plugin Setup

```javascript
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

{
  files: ['**/*.{jsx,tsx}'],
  settings: {
    react: {
      version: '18.3', // Auto-detect
    },
  },
  plugins: {
    react,
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
    ...reactHooks.configs.recommended.rules,
    'react/prop-types': 'off', // TypeScript handles this
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

---

## 6. Prettier Integration

### Prettier Plugin Setup

```javascript
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

{
  plugins: {
    prettier: prettierPlugin,
  },
  rules: {
    ...prettierConfig.rules, // Disable conflicting ESLint rules
    'prettier/prettier': 'warn',
  },
}
```

**Important:** `eslint-config-prettier` must be last to override conflicting rules.

---

## 7. Common Patterns

### Ignore Patterns

```javascript
export default [
  { ignores: ['dist', '.tsbuildinfo', 'node_modules', 'coverage'] },
  // ... other configs
]
```

### File-Specific Rules

```javascript
{
  files: ['**/*.test.{ts,tsx}'],
  rules: {
    'no-undef': 'off', // Test files can use globals
  },
}
```

### Globals Configuration

```javascript
import globals from 'globals'

{
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      React: 'readonly',
    },
  },
}
```

---

## 8. Troubleshooting

### Common Issues

**"Cannot find module" errors:**
- Ensure ESLint 9+ is installed
- Check import syntax (ES modules)
- Verify plugin versions are compatible

**Rules not applying:**
- Check file patterns match
- Verify config order (later configs override earlier)
- Check ignores don't exclude files

**TypeScript errors:**
- Verify `project` path in parserOptions
- Check tsconfig.json exists
- Ensure TypeScript parser is installed

**Prettier conflicts:**
- Ensure `eslint-config-prettier` is last
- Check rule order in config array
- Verify Prettier plugin is configured

---

## 9. Best Practices

✅ **Do:**
- Use flat config format (ESLint 9+)
- Separate configs by file type
- Use shared base configs
- Enable Prettier integration
- Configure TypeScript parser properly

❌ **Don't:**
- Mix legacy and flat config
- Override rules unnecessarily
- Skip Prettier integration
- Ignore type-aware rules performance
- Forget to configure globals

---

## 9. Production Configuration Patterns

### Pattern 1: Proper Globals Configuration

**Real Example from buildfast-shop:**

```javascript
// TypeScript/TSX configuration
{
  files: ['**/*.{ts,tsx}'],
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
}
```

### Pattern 2: TypeScript-Specific Rules

**Real Example from buildfast-shop:**

```javascript
rules: {
  'no-undef': 'off', // TypeScript handles this
  'react/prop-types': 'off', // TypeScript handles prop validation
  '@typescript-eslint/no-unused-vars': [
    'warn',
    { 
      argsIgnorePattern: '^_',  // Allow _prefix for intentionally unused
      varsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-explicit-any': 'warn', // Warn, don't error
  'prettier/prettier': 'warn', // Warn for formatting
}
```

### Pattern 3: React Refresh Configuration

**Real Example from buildfast-shop:**

```javascript
'react-refresh/only-export-components': [
  'warn',
  { allowConstantExport: true }, // Allow constant exports
],
```

### Pattern 4: Multiple File Type Configurations

**Real Example from buildfast-shop:**

```javascript
// Config files using ES modules
{
  files: ['postcss.config.js', 'tailwind.config.js', 'vite.config.ts', 'vitest.config.ts'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
    sourceType: 'module',
  },
}

// Scripts using ES modules
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

// Scripts using CommonJS
{
  files: ['scripts/**/*.js'], // Specific CommonJS files
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
    sourceType: 'commonjs',
  },
}
```

### Pattern 5: Test Files Configuration

**Real Example from buildfast-shop:**

```javascript
// Test files configuration
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
    'no-undef': 'off', // Test files can use globals
    'react/jsx-no-target-blank': 'off',
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
  },
}
```

### Pattern 6: Unused Variable Handling

**Real Example from buildfast-shop:**

```javascript
// ✅ CORRECT - Prefix unused variables with _
rules: {
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_', // Ignore unused function parameters
      varsIgnorePattern: '^_', // Ignore unused variables
    },
  ],
  'no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
}
```

**Usage in Code:**

```typescript
// ✅ CORRECT - Unused catch parameter
try {
  await someAsyncOperation()
} catch (_error) {
  // Error is intentionally unused
  console.log('Operation failed')
}

// ✅ CORRECT - Unused function parameter
function handleEvent(_event: Event) {
  // Event parameter required by interface but not used
  doSomething()
}

// ✅ CORRECT - Unused variable in destructuring
const { data, _error } = await fetchData()
// Only using data, error intentionally unused

// ✅ CORRECT - Unused import
import { useState, _useEffect } from 'react'
// useEffect imported but not used (maybe for future use)
```

**Benefits:**
- ✅ Clear intent when variables are intentionally unused
- ✅ No ESLint warnings for legitimate unused vars
- ✅ Consistent pattern across codebase
- ✅ Better code readability
- ✅ Prevents accidental removal of required parameters

---

## 10. Migration Checklist

- [ ] Install ESLint 9+
- [ ] Convert `.eslintrc.*` to `eslint.config.js`
- [ ] Update all plugin imports
- [ ] Convert `extends` to array format
- [ ] Update `files` patterns
- [ ] Configure proper globals for each file type
- [ ] Set up TypeScript-specific rules
- [ ] Configure React Refresh rules
- [ ] Test with `npm run lint`
- [ ] Update CI/CD configs
- [ ] Update documentation

---

**Reference:** Use this prompt when setting up or migrating to ESLint 9+ flat config format.

