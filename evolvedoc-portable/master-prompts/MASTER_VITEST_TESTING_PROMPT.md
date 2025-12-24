# 🧪 Master Vitest Testing Prompt

> **Comprehensive guide for Vitest test configuration, patterns, and best practices**

---

## 📋 Table of Contents

1. [Vitest Overview](#vitest-overview)
2. [Basic Configuration](#basic-configuration)
3. [Test Setup File](#test-setup-file)
4. [Mocking Patterns](#mocking-patterns)
5. [React Testing](#react-testing)
6. [Coverage Configuration](#coverage-configuration)
7. [Cross-Platform Setup](#cross-platform-setup)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## 1. Vitest Overview

### Why Vitest?

- **Vite-Native:** Uses Vite for fast test execution
- **Fast HMR:** Instant test re-runs
- **TypeScript Support:** Native TypeScript support
- **Jest Compatible:** Similar API to Jest
- **ESM First:** Modern ES modules support

### Key Features

- Fast execution (2-10x faster than Jest)
- Built-in coverage
- Watch mode with HMR
- TypeScript support out of the box
- React Testing Library integration

---

## 2. Basic Configuration

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Cross-platform path resolution for Windows compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Global test APIs (describe, it, expect)
    environment: 'jsdom', // Browser-like environment
    setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Windows path handling - explicit extensions
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 3. Test Setup File

### `src/test/setup.ts`

```typescript
/**
 * Test Setup File
 *
 * Global test configuration, mocks, and utilities.
 */

import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver

// Mock window.scrollTo
window.scrollTo = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear()
  sessionStorageMock.clear()
  vi.clearAllMocks()
})
```

---

## 4. Mocking Patterns

### Mock Functions

```typescript
import { vi } from 'vitest'

// Mock a function
const mockFn = vi.fn()

// Mock with implementation
const mockFn = vi.fn(() => 'return value')

// Mock async function
const mockAsyncFn = vi.fn(async () => {
  return Promise.resolve('value')
})
```

### Mock Modules

```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock with factory
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    loading: false,
  }),
}))
```

### Mock API Calls

```typescript
import { vi } from 'vitest'

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  } as Response)
)
```

---

## 5. React Testing

### Component Testing

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByText('Click me')
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing with Context

```typescript
import { render } from '@testing-library/react'
import { AuthContext } from '@/contexts/AuthContext'

const renderWithAuth = (component: React.ReactElement) => {
  const mockUser = { id: '1', email: 'test@example.com' }
  
  return render(
    <AuthContext.Provider value={{ user: mockUser, loading: false }}>
      {component}
    </AuthContext.Provider>
  )
}
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
})
```

---

## 6. Coverage Configuration

### Coverage Setup

```typescript
test: {
  coverage: {
    provider: 'v8', // or 'istanbul'
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
      '**/mockData/**',
      'dist/',
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
    ],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
}
```

### Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

---

## 7. Cross-Platform Setup

### Windows Compatibility

**Key Settings:**
```typescript
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Cross-platform path resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use path.resolve for setupFiles
setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],

// Explicit extensions
extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
```

### Path Aliases

**Match with Vite config:**
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

---

## 8. Common Patterns

### Test Utilities

```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Async Testing

```typescript
it('fetches data', async () => {
  const { result, waitFor } = renderHook(() => useData())
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined()
  })
  
  expect(result.current.data).toEqual({ id: 1 })
})
```

### Snapshot Testing

```typescript
it('matches snapshot', () => {
  const { container } = render(<Component />)
  expect(container).toMatchSnapshot()
})
```

---

## 9. Troubleshooting

### Common Issues

**"Cannot find module" errors:**
- Verify path aliases match Vite config
- Check `resolve.extensions` includes needed extensions
- Ensure test files are in `include` pattern

**Mocks not working:**
- Check `vi.mock()` is called before imports
- Verify mock paths match actual import paths
- Use `vi.resetAllMocks()` in `beforeEach` if needed

**Coverage not generating:**
- Install coverage provider: `npm install -D @vitest/coverage-v8`
- Check `coverage.exclude` patterns
- Verify test files are running

**Windows path issues:**
- Use `path.resolve()` for all paths
- Use `fileURLToPath` for ES module paths
- Check file extensions are explicit

---

## 10. Best Practices

✅ **Do:**
- Use `globals: true` for cleaner test code
- Set up mocks in `setup.ts` for common APIs
- Use path aliases matching Vite config
- Write descriptive test names
- Clean up after tests

❌ **Don't:**
- Mock everything (test real behavior when possible)
- Skip cleanup in `afterEach`
- Ignore coverage thresholds
- Use `any` types in tests
- Forget Windows compatibility

---

## 11. Integration with Other Tools

### Vite
- Share Vite config with Vitest
- Use same path aliases
- Share plugins when possible

### TypeScript
- Use same tsconfig.json
- Match path mappings
- Enable strict mode

### ESLint
- Configure for test files
- Allow test globals
- Disable unnecessary rules

---

**Reference:** Use this prompt when setting up Vitest testing infrastructure or writing tests.

