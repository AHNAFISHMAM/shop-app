# 🧪 MASTER TESTING PROMPT
## Production-Grade Testing Strategies and Patterns

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to testing React applications with **Vitest** and **React Testing Library** for the **Star Café** application. It covers unit testing, integration testing, component testing, mocking strategies, test organization, and coverage targets based on actual codebase implementations.

**Applicable to:**
- Unit tests for utilities and hooks
- Component tests with React Testing Library
- Integration tests for features
- Mocking Supabase and React Query
- Test organization and structure
- Coverage targets and reporting
- E2E test patterns (when applicable)

---

## 🎯 CORE PRINCIPLES

### 1. **Test User Behavior**
- **Test What Users See**: Focus on user interactions, not implementation details
- **Accessibility First**: Test with accessibility in mind (roles, labels, ARIA)
- **Realistic Scenarios**: Test real user flows, not edge cases only
- **User-Centric Assertions**: Assert on visible outcomes (text, roles, labels)

### 2. **Test Organization**
- **Test Files Co-located**: Keep tests near source files (`Component.test.tsx` next to `Component.tsx`)
- **Clear Test Names**: Descriptive test names that explain what's being tested
- **Arrange-Act-Assert**: Follow AAA pattern consistently
- **Isolated Tests**: Each test should be independent (no shared state)

### 3. **Maintainability**
- **DRY Principle**: Reuse test utilities and setup
- **Mock Strategically**: Mock external dependencies, not internal logic
- **Keep Tests Simple**: One assertion per test when possible
- **Update Tests with Code**: Update tests when code changes

### 4. **Performance**
- **Fast Tests**: Tests should run quickly (< 1 second per test ideally)
- **Parallel Execution**: Tests should be able to run in parallel
- **No Side Effects**: Tests shouldn't affect each other

---

## 🔍 PHASE 1: TEST SETUP

### Step 1.1: Vitest Configuration (Real from Codebase)

**Complete Vitest Config:**
```typescript
// vitest.config.ts

/**
 * Vitest Configuration
 * 
 * Test runner configuration for unit, component, and integration tests.
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// @ts-ignore - Version mismatch between vite and vitest types (known issue)
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
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
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 1.2: Test Setup File (Real from Codebase)

**Complete Test Setup:**
```typescript
// src/test/setup.ts

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

### Step 1.3: Test Utilities (Real from Codebase)

**Complete Test Utilities:**
```typescript
// src/test/utils.tsx

/**
 * Test Utilities
 * 
 * Custom render function and test helpers with all providers.
 */

import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { type ReactElement } from 'react'
// @ts-ignore - JSX component without types
import { AuthProvider } from '../contexts/AuthContext'
// @ts-ignore - JSX component without types
import { ThemeProvider } from '../contexts/ThemeContext'

/**
 * Create a test query client with no retries and immediate garbage collection
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialEntries?: string[]
}

/**
 * Render component with all providers (Router, Query, Auth, Theme)
 * 
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />)
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { renderWithProviders as render }
```

### Step 1.4: Mock Utilities (Real from Codebase)

**Supabase Mock Utilities:**
```typescript
// src/test/mocks/supabase.ts

/**
 * Supabase Mock Utilities
 * 
 * Helpers for mocking Supabase client in tests.
 */

import { vi } from 'vitest'

/**
 * Create a mock Supabase query chain
 */
export function createMockQuery(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data, error }),
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
      order: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data, error }),
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data, error }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data, error }),
    }),
  }
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn().mockReturnValue(createMockQuery(null)),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
    }),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}
```

**React Query Mock Utilities:**
```typescript
// src/test/mocks/react-query.ts

/**
 * React Query Mock Utilities
 * 
 * Helpers for mocking React Query hooks in tests.
 */

import { vi } from 'vitest'

/**
 * Mock useQuery hook
 */
export function mockUseQuery(data: unknown, isLoading = false, error: unknown = null) {
  return vi.fn().mockReturnValue({
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: vi.fn().mockResolvedValue({ data, error }),
  })
}

/**
 * Mock useMutation hook
 */
export function mockUseMutation() {
  return vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ data: null, error: null }),
    isLoading: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  })
}
```

**Centralized Test Exports:**
```typescript
// src/test/index.ts

/**
 * Test Utilities - Centralized Exports
 */

export * from './utils'
export * from './mocks/supabase'
export * from './mocks/react-query'
```

### Step 1.5: Test Setup Checklist

- [ ] Vitest configured with jsdom environment
- [ ] Test setup file created with global mocks
- [ ] Test utilities created (`renderWithProviders`)
- [ ] Mock utilities created (Supabase, React Query)
- [ ] Coverage thresholds configured (80% minimum)
- [ ] Path aliases configured (`@/` → `src/`)
- [ ] Test timeouts configured (10s default)

---

## 🛠️ PHASE 2: UNIT TESTING

### Step 2.1: Utility Function Tests (Real from Codebase)

**Validation Utilities Tests:**
```typescript
// src/lib/validation.test.ts

/**
 * Validation Utilities Tests
 * 
 * Unit tests for validation functions.
 */

import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validatePostalCode,
  validateAmount,
  validateRequired,
  validateLength,
} from './validation'

describe('validateEmail', () => {
  it('should return null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
    expect(validateEmail('user.name@domain.co.uk')).toBeNull()
  })

  it('should return error for invalid email', () => {
    expect(validateEmail('invalid')).toBe('Please enter a valid email address')
    expect(validateEmail('invalid@')).toBe('Please enter a valid email address')
    expect(validateEmail('@example.com')).toBe('Please enter a valid email address')
    expect(validateEmail('')).toBe('Please enter a valid email address')
  })
})

describe('validatePassword', () => {
  it('should return null for valid password (8+ chars)', () => {
    expect(validatePassword('password123')).toBeNull()
    expect(validatePassword('SecurePass!')).toBeNull()
  })

  it('should return error for short password', () => {
    expect(validatePassword('short')).toBe('Password must be at least 8 characters')
    expect(validatePassword('')).toBe('Password must be at least 8 characters')
  })
})

describe('validateName', () => {
  it('should return null for valid name', () => {
    expect(validateName('John Doe')).toBeNull()
    expect(validateName('Ahnaf Ishmam')).toBeNull()
  })

  it('should return error for invalid name', () => {
    expect(validateName('')).toBe('Name is required')
    expect(validateName('A')).toBe('Name must be at least 2 characters')
  })
})

describe('validatePhone', () => {
  it('should return null for valid phone', () => {
    expect(validatePhone('+1234567890')).toBeNull()
    expect(validatePhone('123-456-7890')).toBeNull()
  })

  it('should return error for invalid phone', () => {
    expect(validatePhone('123')).toBe('Please enter a valid phone number')
    expect(validatePhone('')).toBe('Please enter a valid phone number')
  })
})

describe('validatePostalCode', () => {
  it('should return null for valid postal code', () => {
    expect(validatePostalCode('12345')).toBeNull()
    expect(validatePostalCode('12345-6789')).toBeNull()
  })

  it('should return error for invalid postal code', () => {
    expect(validatePostalCode('123')).toBe('Please enter a valid postal code')
    expect(validatePostalCode('')).toBe('Please enter a valid postal code')
  })
})

describe('validateAmount', () => {
  it('should return null for valid amount', () => {
    expect(validateAmount(100)).toBeNull()
    expect(validateAmount(0.01)).toBeNull()
  })

  it('should return error for invalid amount', () => {
    expect(validateAmount(-1)).toBe('Amount must be greater than 0')
    expect(validateAmount(0)).toBe('Amount must be greater than 0')
  })
})

describe('validateRequired', () => {
  it('should return null for non-empty value', () => {
    expect(validateRequired('value')).toBeNull()
    expect(validateRequired(0)).toBeNull()
    expect(validateRequired(false)).toBeNull()
  })

  it('should return error for empty value', () => {
    expect(validateRequired('')).toBe('This field is required')
    expect(validateRequired(null)).toBe('This field is required')
    expect(validateRequired(undefined)).toBe('This field is required')
  })
})

describe('validateLength', () => {
  it('should return null for valid length', () => {
    expect(validateLength('test', 2, 10)).toBeNull()
    expect(validateLength('test', 4, 4)).toBeNull()
  })

  it('should return error for invalid length', () => {
    expect(validateLength('a', 2, 10)).toBe('Must be between 2 and 10 characters')
    expect(validateLength('toolongstring', 2, 10)).toBe('Must be between 2 and 10 characters')
  })
})
```

**Calculation Utilities Tests:**
```typescript
// src/pages/Checkout/utils/calculations.test.ts

/**
 * Checkout Calculations Tests
 * 
 * Unit tests for checkout calculation utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTotalItemsCount,
  calculateSubtotal,
  calculateShipping,
  calculateTax,
  calculateGrandTotal,
  type CartItem,
} from './calculations'
import { SHIPPING_THRESHOLD, SHIPPING_FEE, DEFAULT_TAX_RATE } from '../constants'

describe('calculateTotalItemsCount', () => {
  it('should sum all item quantities', () => {
    const items: CartItem[] = [
      { id: '1', quantity: 2 },
      { id: '2', quantity: 3 },
      { id: '3', quantity: 1 },
    ]

    expect(calculateTotalItemsCount(items)).toBe(6)
  })

  it('should return 0 for empty array', () => {
    expect(calculateTotalItemsCount([])).toBe(0)
  })
})

describe('calculateSubtotal', () => {
  it('should calculate subtotal from item prices and quantities', () => {
    const items: CartItem[] = [
      {
        id: '1',
        quantity: 2,
        price: 10,
        resolvedProduct: { price: 10 },
      },
      {
        id: '2',
        quantity: 1,
        price: 20,
        resolvedProduct: { price: 20 },
      },
    ]

    expect(calculateSubtotal(items)).toBe(40) // (2 * 10) + (1 * 20)
  })

  it('should handle string prices', () => {
    const items: CartItem[] = [
      {
        id: '1',
        quantity: 1,
        price: '10.50',
        resolvedProduct: { price: '10.50' },
      },
    ]

    expect(calculateSubtotal(items)).toBe(10.5)
  })

  it('should return 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0)
  })
})

describe('calculateShipping', () => {
  it('should return 0 when subtotal exceeds threshold', () => {
    expect(calculateShipping(SHIPPING_THRESHOLD + 1)).toBe(0)
    expect(calculateShipping(SHIPPING_THRESHOLD)).toBe(0)
  })

  it('should return shipping fee when subtotal is below threshold', () => {
    expect(calculateShipping(SHIPPING_THRESHOLD - 1)).toBe(SHIPPING_FEE)
    expect(calculateShipping(0)).toBe(SHIPPING_FEE)
  })
})

describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    const subtotal = 100
    const shipping = 10
    const expectedTax = (subtotal + shipping) * DEFAULT_TAX_RATE

    expect(calculateTax(subtotal, shipping)).toBe(expectedTax)
  })

  it('should return 0 when subtotal and shipping are 0', () => {
    expect(calculateTax(0, 0)).toBe(0)
  })
})

describe('calculateGrandTotal', () => {
  it('should sum subtotal, shipping, tax, and subtract discount', () => {
    const subtotal = 100
    const shipping = 10
    const tax = 8.8
    const discount = 10

    const expected = subtotal + shipping + tax - discount
    expect(calculateGrandTotal(subtotal, shipping, tax, discount)).toBe(expected)
  })

  it('should handle zero discount', () => {
    const subtotal = 100
    const shipping = 10
    const tax = 8.8

    expect(calculateGrandTotal(subtotal, shipping, tax, 0)).toBe(subtotal + shipping + tax)
  })
})
```

### Step 2.2: Hook Tests (Real from Codebase)

**useToggle Hook Tests:**
```typescript
// src/hooks/useToggle.test.ts

/**
 * useToggle Hook Tests
 * 
 * Unit tests for useToggle hook.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToggle } from './useToggle'

describe('useToggle', () => {
  beforeEach(() => {
    // Reset before each test
  })

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useToggle(false))

    expect(result.current[0]).toBe(false)
  })

  it('should initialize with true', () => {
    const { result } = renderHook(() => useToggle(true))

    expect(result.current[0]).toBe(true)
  })

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1].toggle()
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1].toggle()
    })

    expect(result.current[0]).toBe(false)
  })

  it('should set to true', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1].setTrue()
    })

    expect(result.current[0]).toBe(true)
  })

  it('should set to false', () => {
    const { result } = renderHook(() => useToggle(true))

    act(() => {
      result.current[1].setFalse()
    })

    expect(result.current[0]).toBe(false)
  })

  it('should maintain state across renders', () => {
    const { result, rerender } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1].setTrue()
    })

    rerender()

    expect(result.current[0]).toBe(true)
  })
})
```

**Hook Test with React Query:**
```typescript
// src/hooks/useProfile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import { createTestQueryClient } from '../test/utils'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase')
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}))

describe('useProfile', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('should fetch profile data', async () => {
    const mockProfile = { id: 'test-user-id', email: 'test@example.com' }
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    } as any)

    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockProfile)
  })

  it('should handle errors', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error fetching profile' },
          }),
        }),
      }),
    } as any)

    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
```

### Step 2.3: Unit Test Checklist

- [ ] Utility functions tested (validation, calculations, etc.)
- [ ] Hooks tested with proper mocking (React Query, Supabase)
- [ ] Error cases covered
- [ ] Edge cases covered (empty arrays, null values, etc.)
- [ ] Tests are isolated and independent
- [ ] Tests use `act()` for state updates
- [ ] Tests use `waitFor()` for async operations

---

## 🧩 PHASE 3: COMPONENT TESTING

### Step 3.1: Simple Component Test

**Button Component Test:**
```typescript
// src/components/ui/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply variant classes', () => {
    const { container } = render(<Button variant="primary">Click me</Button>)
    expect(container.firstChild).toHaveClass('bg-primary')
  })
})
```

### Step 3.2: Form Component Test

**Login Form Test:**
```typescript
// src/pages/public/Login.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { Login } from './Login'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Login', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      isLoading: false,
    } as any)
  })

  it('should render login form', () => {
    render(<Login />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
  })

  it('should call login on form submit', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ error: null })
    
    render(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({
      error: new Error('Invalid login credentials'),
    })

    render(<Login />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })
})
```

### Step 3.3: Component Test Checklist

- [ ] Component renders correctly
- [ ] User interactions tested (click, type, etc.)
- [ ] Props handled correctly
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Accessibility tested (roles, labels, ARIA)
- [ ] Uses `userEvent` for interactions
- [ ] Uses `waitFor` for async updates

---

## 🔗 PHASE 4: INTEGRATION TESTING

### Step 4.1: Feature Integration Test

**Dashboard Integration Test:**
```typescript
// src/pages/protected/Dashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import { Dashboard } from './Dashboard'
import { useAuth } from '../../contexts/AuthContext'
import { useProgressStats } from '../../hooks/useProgressStats'

vi.mock('../../contexts/AuthContext')
vi.mock('../../hooks/useProgressStats')

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: { full_name: 'Test User' },
      isLoading: false,
    } as any)

    vi.mocked(useProgressStats).mockReturnValue({
      data: {
        checklist_completed: 5,
        checklist_total: 10,
        modules_completed: 2,
        modules_total: 5,
      },
      isLoading: false,
    } as any)
  })

  it('should display user greeting', () => {
    render(<Dashboard />)
    expect(screen.getByText(/test user/i)).toBeInTheDocument()
  })

  it('should display progress stats', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/5.*10/i)).toBeInTheDocument() // Checklist progress
      expect(screen.getByText(/2.*5/i)).toBeInTheDocument() // Module progress
    })
  })

  it('should show loading state', () => {
    vi.mocked(useProgressStats).mockReturnValue({
      isLoading: true,
    } as any)

    render(<Dashboard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

### Step 4.2: Integration Test Checklist

- [ ] Feature flows tested end-to-end
- [ ] Multiple components work together
- [ ] API interactions mocked correctly
- [ ] State management tested
- [ ] Navigation tested
- [ ] Error boundaries tested

---

## 🎭 PHASE 5: MOCKING STRATEGIES

### Step 5.1: Mock Supabase (Real from Codebase)

**Using Mock Utilities:**
```typescript
import { vi } from 'vitest'
import { createMockQuery, createMockSupabaseClient } from '../test/mocks/supabase'

// In your test file
vi.mock('../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}))

// Or create specific mocks
const mockProfile = { id: '1', email: 'test@example.com' }
vi.mocked(supabase.from).mockReturnValue(
  createMockQuery(mockProfile, null)
)
```

### Step 5.2: Mock React Query (Real from Codebase)

**Using Mock Utilities:**
```typescript
import { mockUseQuery, mockUseMutation } from '../test/mocks/react-query'

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: mockUseQuery({ data: mockData, isLoading: false }),
    useMutation: mockUseMutation(),
  }
})
```

### Step 5.3: Mock Contexts

**Mock Auth Context:**
```typescript
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { full_name: 'Test User' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))
```

### Step 5.4: Mocking Checklist

- [ ] External dependencies mocked (Supabase, APIs)
- [ ] React Query mocked appropriately
- [ ] Contexts mocked correctly
- [ ] Mocks reset between tests (`beforeEach`)
- [ ] Mock data is realistic
- [ ] Error cases mocked

---

## 📊 PHASE 6: TEST COVERAGE

### Step 6.1: Coverage Targets

**Coverage Configuration (from vitest.config.ts):**
```typescript
coverage: {
  provider: 'v8',
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
}
```

### Step 6.2: Coverage Commands

```bash
# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- src/lib/validation.test.ts

# View coverage report
open coverage/index.html
```

### Step 6.3: Coverage Checklist

- [ ] Coverage thresholds set (80% minimum)
- [ ] Coverage reports generated (HTML, JSON, text)
- [ ] Coverage reviewed regularly
- [ ] Critical paths have high coverage (>90%)
- [ ] Coverage exclusions configured correctly

---

## 🎯 SUCCESS CRITERIA

Testing implementation is complete when:

1. ✅ **Unit Tests**: All utilities and hooks tested
2. ✅ **Component Tests**: All components tested with user interactions
3. ✅ **Integration Tests**: Key features tested end-to-end
4. ✅ **Coverage**: >80% coverage achieved
5. ✅ **Mocks**: External dependencies properly mocked
6. ✅ **CI/CD**: Tests run in CI pipeline
7. ✅ **Maintainability**: Tests are maintainable and clear
8. ✅ **Accessibility**: Tests use accessible queries
9. ✅ **Performance**: Tests run quickly (< 1s per test)

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- Test implementation details (internal state, props structure)
- Over-mock internal logic
- Write tests that are too complex
- Skip testing error cases
- Ignore accessibility in tests
- Write flaky tests (time-dependent, random)
- Use `data-testid` excessively (prefer accessible queries)
- Test third-party library code
- Share state between tests

### ✅ Do:

- Test user behavior (what users see and interact with)
- Mock external dependencies only
- Keep tests simple and focused
- Test error and edge cases
- Use accessibility queries (`getByRole`, `getByLabelText`)
- Write stable, deterministic tests
- Use semantic queries when possible
- Test your own code, not library code
- Isolate tests (no shared state)

---

## 📝 TEST NAMING CONVENTIONS

**Good Test Names:**
```typescript
// ✅ GOOD - Descriptive test names
describe('validateEmail', () => {
  it('should return null for valid email address', () => {})
  it('should return error message for invalid email format', () => {})
  it('should return error message for empty string', () => {})
})

// ✅ GOOD - User-focused test names
describe('LoginForm', () => {
  it('should allow user to login with valid credentials', () => {})
  it('should display error when email is invalid', () => {})
  it('should disable submit button while loading', () => {})
})
```

**Bad Test Names:**
```typescript
// ❌ BAD - Vague test names
describe('validateEmail', () => {
  it('works', () => {})
  it('test 1', () => {})
  it('should work', () => {})
})
```

---

## 📚 REFERENCE

### Files in Codebase

- **Vitest Config**: `vitest.config.ts` - Complete Vitest configuration
- **Test Setup**: `src/test/setup.ts` - Global test setup and mocks
- **Test Utils**: `src/test/utils.tsx` - `renderWithProviders` and helpers
- **Supabase Mocks**: `src/test/mocks/supabase.ts` - Supabase mock utilities
- **React Query Mocks**: `src/test/mocks/react-query.ts` - React Query mock utilities
- **Test Index**: `src/test/index.ts` - Centralized test exports

### Example Tests

- **Validation Tests**: `src/lib/validation.test.ts` - Validation utility tests
- **Calculation Tests**: `src/pages/Checkout/utils/calculations.test.ts` - Checkout calculation tests
- **Hook Tests**: `src/hooks/useToggle.test.ts` - Custom hook tests

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This master prompt should be followed for ALL testing work in the Star Café application.**
