# 🪟 Windows Compatibility Guide

> **Common Windows-specific issues and solutions for development tools**

---

## 📋 Table of Contents

1. [Path Resolution Issues](#path-resolution-issues)
2. [File Watching Problems](#file-watching-problems)
3. [Script Execution Policies](#script-execution-policies)
4. [PowerShell vs Bash](#powershell-vs-bash)
5. [Git Hooks on Windows](#git-hooks-on-windows)
6. [TypeScript Compilation](#typescript-compilation)
7. [Vite Development Server](#vite-development-server)
8. [Common Solutions](#common-solutions)

---

## 1. Path Resolution Issues

### Problem: Path Separators

**Windows uses backslashes (`\`), Unix uses forward slashes (`/`)**

**Solution: Use `path` module**

```typescript
// ❌ Bad (breaks on Windows)
const filePath = './src/components/Button.tsx'

// ✅ Good (cross-platform)
import path from 'node:path'
const filePath = path.resolve(__dirname, './src/components/Button.tsx')
```

### Problem: ES Module Path Resolution

**Solution: Use `fileURLToPath`**

```typescript
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Cross-platform path resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use in configs
setupFiles: [path.resolve(__dirname, './src/test/setup.ts')]
```

### Problem: Path Aliases Not Working

**Solution: Use absolute paths with `path.resolve`**

```typescript
// vite.config.ts
import path from 'node:path'

resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  // Explicit extensions for Windows
  extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
}
```

---

## 2. File Watching Problems

### Problem: Vite HMR Not Updating

**Solution: Enable Polling**

```typescript
// vite.config.ts
server: {
  watch: {
    usePolling: true, // Required for Windows
    interval: 100, // Check every 100ms
  },
}
```

### Problem: TypeScript Watch Mode Not Detecting Changes

**Solution: Use `preserveWatchOutput`**

```json
{
  "compilerOptions": {
    "preserveWatchOutput": true
  }
}
```

**Or use project references:**
```bash
npm run typecheck:build:watch
```

### Problem: File Changes Not Detected

**Solutions:**
1. **Check antivirus exclusions:**
   - Add project folder to antivirus exclusions
   - Add `node_modules` to exclusions

2. **Use polling:**
   ```typescript
   watch: {
     usePolling: true,
     interval: 100,
   }
   ```

3. **Check file permissions:**
   - Ensure you have read/write access
   - Run terminal as administrator if needed

---

## 3. Script Execution Policies

### Problem: PowerShell Scripts Blocked

**Error:** `Execution of scripts is disabled on this system`

**Solution: Bypass for current session**

```powershell
# Run once per session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

**Or run scripts directly:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-docs.ps1
```

### Problem: npm Scripts Failing

**Solution: Use cross-platform commands**

```json
{
  "scripts": {
    "typecheck:count": "powershell -Command \"tsc --noEmit 2>&1 | Select-String 'error TS' | Measure-Object | Select-Object -ExpandProperty Count\""
  }
}
```

**Or use cross-platform tools:**
- Use `cross-env` for environment variables
- Use `rimraf` instead of `rm -rf`
- Use `shx` for Unix commands

---

## 4. PowerShell vs Bash

### Command Differences

| Task | Bash | PowerShell |
|------|------|------------|
| Count lines | `wc -l` | `Measure-Object` |
| Filter text | `grep` | `Select-String` |
| Find files | `find` | `Get-ChildItem` |
| Remove dir | `rm -rf` | `Remove-Item -Recurse -Force` |

### Cross-Platform Scripts

**Use Node.js scripts instead:**
```javascript
// scripts/count-errors.js
import { execSync } from 'child_process'

const output = execSync('tsc --noEmit 2>&1', { encoding: 'utf-8' })
const errors = output.match(/error TS/g) || []
console.log(`Total errors: ${errors.length}`)
```

---

## 5. Git Hooks on Windows

### Problem: Husky Hooks Not Running

**Solution: Use Git Bash or WSL**

**Option 1: Git Bash**
```bash
# Install Git for Windows (includes Git Bash)
# Hooks will run in Git Bash automatically
```

**Option 2: WSL (Windows Subsystem for Linux)**
```bash
# Install WSL
wsl --install

# Run commands in WSL
wsl npm run prepare
```

**Option 3: Fix Permissions**
```powershell
# Make hook executable
icacls .husky\pre-commit /grant Everyone:RX
```

### Problem: Line Endings (CRLF vs LF)

**Solution: Configure Git**

```bash
# Set autocrlf for Windows
git config --global core.autocrlf true

# Or use .gitattributes
echo "* text=auto" > .gitattributes
```

---

## 6. TypeScript Compilation

### Problem: Slow Compilation

**Solutions:**

1. **Use incremental builds:**
   ```json
   {
     "compilerOptions": {
       "incremental": true,
       "tsBuildInfoFile": ".tsbuildinfo"
     }
   }
   ```

2. **Use project references:**
   ```bash
   npm run typecheck:build:watch
   ```

3. **Skip lib check:**
   ```bash
   npm run typecheck:fast
   ```

### Problem: Path Mapping Issues

**Solution: Match Vite and TypeScript paths**

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}

// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 7. Vite Development Server

### Problem: Port Already in Use

**Solution: Use `strictPort: false`**

```typescript
server: {
  port: 5177,
  strictPort: false, // Try another port if taken
}
```

### Problem: Network Access Not Working

**Solution: Enable `host: true`**

```typescript
server: {
  host: true, // Listen on all addresses
}
```

### Problem: HMR Disconnects

**Solutions:**

1. **Enable polling:**
   ```typescript
   watch: {
     usePolling: true,
     interval: 100,
   }
   ```

2. **Increase timeout:**
   ```typescript
   hmr: {
     timeout: 30000, // 30 seconds
   }
   ```

---

## 8. Common Solutions

### Quick Fixes Checklist

- [ ] Use `path.resolve()` for all file paths
- [ ] Enable polling in Vite config
- [ ] Use `fileURLToPath` for ES modules
- [ ] Set PowerShell execution policy
- [ ] Add project to antivirus exclusions
- [ ] Use Git Bash for hooks
- [ ] Match path aliases in Vite and TypeScript
- [ ] Use cross-platform npm scripts
- [ ] Enable incremental TypeScript builds

### Recommended Tools

**Cross-Platform Utilities:**
- `cross-env` - Environment variables
- `rimraf` - Remove directories
- `shx` - Unix commands on Windows
- `node:path` - Path operations
- `node:url` - URL/path utilities

**Windows-Specific:**
- Git Bash (for hooks)
- WSL (for Linux-like environment)
- Windows Terminal (better terminal)

---

## 9. Testing on Windows

### Vitest Configuration

```typescript
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
```

---

## 10. Best Practices

✅ **Do:**
- Always use `path.resolve()` for file paths
- Enable polling for file watching
- Use cross-platform npm scripts
- Test on Windows if team uses Windows
- Document Windows-specific requirements

❌ **Don't:**
- Hardcode path separators (`/` or `\`)
- Assume Unix commands work on Windows
- Skip Windows testing
- Ignore file watching issues
- Use platform-specific scripts without alternatives

---

**Reference:** Use this guide when encountering Windows-specific issues during development.

