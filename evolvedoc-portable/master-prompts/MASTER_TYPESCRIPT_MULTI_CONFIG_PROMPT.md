# 📘 Master TypeScript Multi-Config Prompt

> **Comprehensive guide for TypeScript project references, multi-config setups, and performance optimization**

---

## 📋 Table of Contents

1. [Why Multi-Config?](#why-multi-config)
2. [Base Configuration](#base-configuration)
3. [Project References](#project-references)
4. [Path Mapping](#path-mapping)
5. [Performance Optimizations](#performance-optimizations)
6. [Incremental Builds](#incremental-builds)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## 1. Why Multi-Config?

### Benefits

- **Faster Compilation:** Only recompile changed modules
- **Better Organization:** Separate configs for different parts of app
- **Incremental Builds:** 2-3x faster subsequent runs
- **Modular Compilation:** Compile only what changed
- **Type Safety:** Stricter checks where needed, relaxed where appropriate

### When to Use

- Large codebases (>50 files)
- Mixed TypeScript/JavaScript codebases
- Admin vs public code separation
- Component libraries within project
- Need for different strictness levels

---

## 2. Base Configuration

### `tsconfig.base.json` - Foundation

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Performance Optimizations */
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "preserveWatchOutput": true,
    "maxNodeModuleJsDepth": 1,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Strict Type-Checking Options */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* Additional Checks */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"]
    },

    /* Interop Constraints */
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 3. Project References

### Main `tsconfig.json`

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "./tsconfig.components.json" },
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.admin.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### Component Config `tsconfig.components.json`

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/components",
    "rootDir": "./src/components"
  },
  "include": ["src/components"],
  "references": [
    { "path": "./tsconfig.lib.json" }
  ]
}
```

### Library Config `tsconfig.lib.json`

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/lib",
    "rootDir": "./src/lib"
  },
  "include": ["src/lib"]
}
```

### Admin Config `tsconfig.admin.json`

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/admin",
    "rootDir": "./src/pages/admin"
  },
  "include": ["src/pages/admin"],
  "references": [
    { "path": "./tsconfig.components.json" },
    { "path": "./tsconfig.lib.json" }
  ]
}
```

### Node/Config Files `tsconfig.node.json`

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": false,
    "module": "ESNext",
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": [
    "vite.config.ts",
    "vitest.config.ts",
    "eslint.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "scripts/**/*"
  ]
}
```

---

## 4. Path Mapping

### Consistent Paths Across Configs

All configs should use the same path mappings:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

**Match with Vite aliases:**
```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './src/components'),
    // ... same paths
  }
}
```

---

## 5. Performance Optimizations

### Key Settings

```json
{
  "compilerOptions": {
    /* Incremental Compilation */
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    
    /* Watch Mode Optimization */
    "preserveWatchOutput": true,
    
    /* Dependency Optimization */
    "maxNodeModuleJsDepth": 1,
    "skipLibCheck": true,
    
    /* Module Resolution */
    "moduleResolution": "bundler", // Faster for Vite
    "isolatedModules": true, // Required for Vite
  }
}
```

### Build Commands

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "typecheck:watch:preserve": "tsc --noEmit --watch --preserveWatchOutput",
    "typecheck:build": "tsc --build",
    "typecheck:build:watch": "tsc --build --watch",
    "typecheck:fast": "tsc --noEmit --skipLibCheck"
  }
}
```

**Performance Comparison:**
- `typecheck:fast` - 50% faster (skips libs)
- `typecheck:build:watch` - 2-3x faster (project references)
- `typecheck:watch:preserve` - Optimized watch mode

---

## 6. Incremental Builds

### How It Works

1. **First Run:** Full compilation, creates `.tsbuildinfo`
2. **Subsequent Runs:** Only recompiles changed files
3. **Project References:** Only recompiles affected projects

### Build Info Files

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

**Add to `.gitignore`:**
```
.tsbuildinfo
dist/
```

### Clean Build

```bash
# Remove build info for fresh start
rm .tsbuildinfo
tsc --build --force
```

---

## 7. Common Patterns

### Mixed TS/JS Codebase

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false, // Gradually enable
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Strict vs Relaxed Configs

**Strict (for new code):**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Relaxed (for legacy code):**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

### Component Library Pattern

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist/components"
  },
  "include": ["src/components"]
}
```

---

## 8. Troubleshooting

### Common Issues

**"Cannot find module" errors:**
- Verify `baseUrl` and `paths` match
- Check `include`/`exclude` patterns
- Ensure project references are correct

**Slow compilation:**
- Enable `incremental: true`
- Use `skipLibCheck: true`
- Set `maxNodeModuleJsDepth: 1`
- Use project references

**Watch mode not updating:**
- Use `preserveWatchOutput: true`
- Check file watching permissions
- Restart TypeScript server

**Build info conflicts:**
- Delete `.tsbuildinfo` files
- Run `tsc --build --clean`
- Rebuild from scratch

---

## 9. Best Practices

✅ **Do:**
- Use project references for large codebases
- Enable incremental builds
- Match path aliases with Vite/other tools
- Use `composite: true` for referenced projects
- Keep base config minimal, extend for specifics

❌ **Don't:**
- Over-complicate with too many configs
- Mix `composite` and non-composite projects incorrectly
- Forget to update path mappings
- Skip `skipLibCheck` (performance hit)
- Ignore build info files in git

---

## 10. Integration with Tools

### Vite
- Use `moduleResolution: "bundler"`
- Match path aliases exactly
- Enable `isolatedModules: true`

### ESLint
- Configure TypeScript parser
- Use same path mappings
- Reference project configs

### Testing (Vitest)
- Share TypeScript config
- Use same path aliases
- Enable `allowJs` if needed

---

## 11. Migration Strategy

### Step 1: Create Base Config
```bash
# Copy existing tsconfig.json to tsconfig.base.json
cp tsconfig.json tsconfig.base.json
```

### Step 2: Update Main Config
```json
{
  "extends": "./tsconfig.base.json",
  "references": [
    { "path": "./tsconfig.components.json" }
  ]
}
```

### Step 3: Create Project Configs
- Start with one project (e.g., components)
- Test compilation
- Add more projects gradually

### Step 4: Update Build Scripts
```json
{
  "scripts": {
    "typecheck:build": "tsc --build",
    "typecheck:build:watch": "tsc --build --watch"
  }
}
```

---

**Reference:** Use this prompt when setting up TypeScript multi-config for large projects or when optimizing compilation performance.

