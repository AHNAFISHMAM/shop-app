# 🚀 Master Vite Configuration Prompt

> **Comprehensive guide for Vite build tool configuration, optimization, and best practices**

---

## 📋 Table of Contents

1. [Core Configuration](#core-configuration)
2. [Development Server](#development-server)
3. [Build Optimization](#build-optimization)
4. [Code Splitting](#code-splitting)
5. [Path Aliases](#path-aliases)
6. [Plugin Integration](#plugin-integration)
7. [Performance Tuning](#performance-tuning)
8. [Windows Compatibility](#windows-compatibility)
9. [Common Patterns](#common-patterns)

---

## 1. Core Configuration

### Basic Vite Config Structure

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
```

### Path Aliases Setup

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './src/components'),
    '@/lib': path.resolve(__dirname, './src/lib'),
    '@/utils': path.resolve(__dirname, './src/utils'),
    '@/hooks': path.resolve(__dirname, './src/hooks'),
    '@/pages': path.resolve(__dirname, './src/pages'),
    '@/features': path.resolve(__dirname, './src/features'),
    '@/shared': path.resolve(__dirname, './src/shared'),
  },
}
```

**TypeScript Path Mapping (tsconfig.json):**
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

---

## 2. Development Server

### Production-Ready Dev Server Config

```typescript
server: {
  port: 5177,
  strictPort: false, // Try another port if 5177 is taken
  watch: {
    usePolling: true, // Enable polling for better file watching on Windows
    interval: 100, // Check for changes every 100ms
  },
  hmr: {
    overlay: true, // Show errors as overlay
    timeout: 30000, // HMR connection timeout (30s)
    protocol: 'ws', // Use WebSocket protocol
    clientPort: undefined, // Use same port as server
  },
  cors: true,
  host: true, // Listen on all addresses (for network access)
}
```

### Windows Compatibility

**Key Settings:**
- `usePolling: true` - Required for reliable file watching on Windows
- `interval: 100` - Balance between responsiveness and CPU usage
- `host: true` - Allows access from other devices on network

---

## 3. Build Optimization

### Optimized Build Configuration

```typescript
build: {
  sourcemap: true, // Enable source maps for debugging
  minify: 'esbuild', // Fast minification
  cssMinify: true,
  chunkSizeWarningLimit: 600, // Warn if chunk exceeds 600KB
  target: 'es2020', // Target modern browsers for smaller bundles
  reportCompressedSize: true, // Report compressed sizes
  rollupOptions: {
    output: {
      // Optimize chunk file names
      chunkFileNames: 'assets/[name]-[hash].js',
      entryFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',
    },
  },
}
```

---

## 4. Code Splitting

### Manual Chunk Splitting Strategy

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // Vendor chunks - core React libraries
        if (id.includes('node_modules')) {
          // React core
          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('scheduler')
          ) {
            return 'vendor-react'
          }
          // UI libraries
          if (
            id.includes('framer-motion') ||
            id.includes('react-hot-toast') ||
            id.includes('react-helmet') ||
            id.includes('@radix-ui')
          ) {
            return 'vendor-ui'
          }
          // Data/API libraries
          if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
            return 'vendor-data'
          }
          // Payment libraries
          if (id.includes('@stripe') || id.includes('stripe')) {
            return 'vendor-payment'
          }
          // Date utilities
          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'vendor-utils'
          }
          // Other node_modules
          return 'vendor-other'
        }
        // Admin pages chunk
        if (
          id.includes('/pages/admin/') ||
          id.includes('/pages/Admin') ||
          id.includes('/pages/Kitchen')
        ) {
          return 'admin'
        }
        // Admin components chunk
        if (id.includes('/components/Admin') || id.includes('/components/admin/')) {
          return 'admin-components'
        }
      },
    },
  },
}
```

**Benefits:**
- Smaller initial bundle size
- Better caching (vendor chunks change less frequently)

### Bundle Analyzer Integration

```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    mode === 'analyze' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  // ... rest of config
}))

// package.json script
// "build:analyze": "vite build --mode analyze"
```

### OptimizeDeps Configuration

```typescript
optimizeDeps: {
  force: false, // Only force when needed (e.g., after dependency updates)
  include: [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    '@tanstack/react-query',
    'framer-motion',
    'react-hot-toast',
  ],
  exclude: [
    // Exclude large dependencies that don't need pre-bundling
  ],
},
```

**When to use `force: true`:**
- After updating dependencies
- When experiencing HMR issues
- When new dependencies aren't being detected
- Parallel loading of chunks
- Admin code separated from main app

---

## 5. Plugin Integration

### React Plugin

```typescript
import react from '@vitejs/plugin-react'

plugins: [
  react({
    // Fast Refresh options
    fastRefresh: true,
    // Babel options if needed
    babel: {
      plugins: [],
    },
  }),
]
```

### Bundle Analyzer (Conditional)

```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    mode === 'analyze' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
}))
```

**Usage:**
```bash
npm run build:analyze  # Builds with analyzer
```

---

## 6. Performance Tuning

### Optimize Dependencies

```typescript
optimizeDeps: {
  force: false, // Only force when needed
  include: [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    '@tanstack/react-query',
    'framer-motion',
    'react-hot-toast',
  ],
}
```

**When to use `force: true`:**
- After major dependency updates
- When HMR stops working
- When seeing "module not found" errors

---

## 7. Windows Compatibility

### File Watching

```typescript
server: {
  watch: {
    usePolling: true, // Required for Windows
    interval: 100,
  },
}
```

### Path Resolution

```typescript
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

## 8. Common Patterns

### Environment-Specific Configs

```typescript
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  return {
    // Dev-specific config
    server: isDev ? {
      port: 5177,
      // ... dev config
    } : undefined,
    
    // Prod-specific config
    build: isProd ? {
      minify: 'esbuild',
      // ... prod config
    } : undefined,
  }
})
```

### Proxy Configuration

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### CSS Configuration

```typescript
css: {
  devSourcemap: true, // Source maps in dev
  modules: {
    localsConvention: 'camelCase',
  },
}
```

---

## 9. Environment Variables

### Vite Environment Variables Pattern

**Critical:** In Vite projects, use `import.meta.env` instead of `process.env`.

**Real Example from buildfast-shop:**

```typescript
// ❌ INCORRECT - process.env doesn't work in Vite
const isDev = process.env.NODE_ENV === 'development'

// ✅ CORRECT - Use import.meta.env
const isDev = import.meta.env.DEV ?? false

// ✅ CORRECT - With fallback
const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development'

// ✅ CORRECT - Environment-specific checks
if (import.meta.env.DEV) {
  console.log('Development mode')
}

// ✅ CORRECT - Production checks
if (import.meta.env.PROD) {
  // Production-only code
}
```

**Environment Variable Access:**

```typescript
// ✅ CORRECT - Accessing Vite env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ✅ CORRECT - With type safety
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
```

**Type Definitions:**

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Best Practices:**
- ✅ Always prefix client-side env vars with `VITE_`
- ✅ Use `import.meta.env.DEV` for development checks
- ✅ Use `import.meta.env.PROD` for production checks
- ✅ Never use `process.env` in Vite projects
- ✅ Define types in `vite-env.d.ts` for autocomplete
- ✅ Use nullish coalescing (`??`) for safe defaults

**Common Patterns:**

```typescript
// ✅ CORRECT - Conditional logging
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}

// ✅ CORRECT - API endpoint selection
const apiUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://api.production.com'

// ✅ CORRECT - Feature flags
const enableAnalytics = import.meta.env.PROD

// ✅ CORRECT - Error handling
const apiKey = import.meta.env.VITE_API_KEY
if (!apiKey) {
  throw new Error('VITE_API_KEY is required')
}
```

---

## 10. Complete Example

### Full Production-Ready Config

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  
  server: {
    port: 5177,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
      timeout: 30000,
      protocol: 'ws',
      clientPort: undefined,
    },
    cors: true,
    host: true,
  },
  
  optimizeDeps: {
    force: false,
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'framer-motion',
      'react-hot-toast',
    ],
  },
  
  build: {
    sourcemap: true,
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    target: 'es2020',
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react'
            }
            if (
              id.includes('framer-motion') ||
              id.includes('react-hot-toast') ||
              id.includes('react-helmet') ||
              id.includes('@radix-ui')
            ) {
              return 'vendor-ui'
            }
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'vendor-data'
            }
            if (id.includes('@stripe') || id.includes('stripe')) {
              return 'vendor-payment'
            }
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'vendor-utils'
            }
            return 'vendor-other'
          }
          if (
            id.includes('/pages/admin/') ||
            id.includes('/pages/Admin') ||
            id.includes('/pages/Kitchen')
          ) {
            return 'admin'
          }
          if (id.includes('/components/Admin') || id.includes('/components/admin/')) {
            return 'admin-components'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
}))
```

---

## 10. Troubleshooting

### Common Issues

**HMR not working:**
- Check `usePolling: true` for Windows
- Verify `host: true` for network access
- Increase `timeout` if needed

**Slow builds:**
- Check `optimizeDeps.include` for large dependencies
- Review `manualChunks` strategy
- Use `build:analyze` to identify large chunks

**Path resolution errors:**
- Verify `resolve.alias` matches `tsconfig.json` paths
- Check `resolve.extensions` includes all needed extensions
- Use absolute paths with `path.resolve`

**Windows file watching issues:**
- Always use `usePolling: true`
- Set appropriate `interval` (100ms recommended)
- Check antivirus exclusions

---

## 11. Best Practices

✅ **Do:**
- Use path aliases for cleaner imports
- Split vendor chunks for better caching
- Enable source maps in development
- Configure polling for Windows compatibility
- Use bundle analyzer to optimize chunks

❌ **Don't:**
- Over-split chunks (keep it reasonable)
- Force optimizeDeps unless necessary
- Skip source maps in production (if debugging needed)
- Ignore Windows compatibility if team uses Windows

---

## 12. Integration with Other Tools

### TypeScript
- Ensure `tsconfig.json` paths match Vite aliases
- Use `moduleResolution: "bundler"` for Vite

### ESLint
- Configure import resolver for path aliases
- Use `eslint-plugin-import` with alias support

### Testing (Vitest)
- Share Vite config with Vitest
- Use same path aliases in test config

---

**Reference:** This prompt should be used when setting up or optimizing Vite configuration in your project.

