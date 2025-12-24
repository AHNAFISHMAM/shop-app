# ⚠️ MASTER ERROR HANDLING & LOGGING PROMPT
## Production-Grade Error Management and User Feedback

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to error handling, logging, and user feedback in production applications for the **Star Café** application. It covers error boundaries, error transformation, logging strategies, React Query error handling, Supabase error handling, form validation errors, network error handling, and user-friendly error messages based on actual codebase implementations.

**Applicable to:**
- Error boundaries (component-level and page-level)
- API error handling (Supabase, Edge Functions)
- Form validation errors
- Network error handling
- User-friendly error messages
- Error logging and tracking
- React Query error handling
- Async operation error handling
- Database error handling
- Error recovery and retry logic

---

## 🎯 CORE PRINCIPLES

### 1. **User-Friendly Errors**
- **Transform Technical Errors**: Convert technical errors to user-friendly messages
- **Actionable Messages**: Provide clear next steps for users
- **Context-Aware**: Show relevant error information without overwhelming users
- **No Information Leakage**: Don't expose sensitive information (API keys, stack traces, etc.)
- **Consistent Format**: Use consistent error message format across the app

### 2. **Error Logging**
- **Log with Context**: Include context (component, function, operation) in error logs
- **Development vs Production**: Different logging strategies for each environment
- **Error Tracking**: Integrate with error tracking services (Sentry, LogRocket, etc.)
- **Structured Logging**: Use structured log format for easier debugging
- **Error Categorization**: Categorize errors by type (network, validation, server, etc.)

### 3. **Error Recovery**
- **Retry Logic**: Retry transient errors automatically
- **Fallback UI**: Show fallback UI for errors (error boundaries)
- **Graceful Degradation**: Degrade gracefully on errors (app continues to work)
- **User Actions**: Provide clear actions for users (retry, go back, contact support)

### 4. **Security**
- **No Sensitive Data**: Never log or display sensitive information
- **Error Sanitization**: Sanitize error messages before displaying
- **Rate Limiting**: Handle rate limit errors gracefully
- **Authentication Errors**: Handle auth errors without exposing details

---

## 🔍 PHASE 1: ERROR HANDLER UTILITY

### Step 1.1: Error Handler Implementation

**Complete Error Handler (Real Example from Codebase):**
```typescript
// src/lib/error-handler.ts

import { logger } from '../utils/logger'

/**
 * Error information interface
 */
export interface ErrorInfo {
  message: string
  code?: string
  status?: number
  userMessage: string
  retryable: boolean
}

/**
 * Error map for user-friendly messages
 * Maps technical error codes/messages to user-friendly messages
 */
const ERROR_MAP: Record<string, Omit<ErrorInfo, 'message' | 'code' | 'status'>> = {
  'Network request failed': {
    userMessage: 'Please check your internet connection and try again.',
    retryable: true,
  },
  'Failed to fetch': {
    userMessage: 'Unable to connect to the server. Please check your internet connection.',
    retryable: true,
  },
  '401': {
    userMessage: 'Your session has expired. Please log in again.',
    retryable: false,
  },
  '403': {
    userMessage: "You don't have permission to perform this action.",
    retryable: false,
  },
  '404': {
    userMessage: 'The requested resource was not found.',
    retryable: false,
  },
  '500': {
    userMessage: 'Server error. Please try again later.',
    retryable: true,
  },
  '42P01': {
    userMessage: 'Database table not found. Please contact support.',
    retryable: false,
  },
  'PGRST116': {
    userMessage: 'Database relationship not found. Please contact support.',
    retryable: false,
  },
  '42501': {
    userMessage: 'Permission denied. Please ensure you are logged in.',
    retryable: false,
  },
}

/**
 * Error with code/status properties
 * Many error objects (Supabase, HTTP, etc.) have these properties
 */
interface ErrorWithCode extends Error {
  code?: string | number
  statusCode?: number
  status?: number
}

/**
 * Type guard to check if error has code/status properties
 */
function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    error instanceof Error &&
    ('code' in error || 'statusCode' in error || 'status' in error)
  )
}

/**
 * Extract error information from unknown error type
 *
 * @param error - The error object (unknown type)
 * @returns ErrorInfo with user-friendly message
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const message = error.message
    
    // Use type guard instead of 'as any'
    let code: string | number | undefined
    let status: number | undefined
    
    if (isErrorWithCode(error)) {
      code = error.code || error.statusCode
      status = error.status || error.statusCode
    }

    // Check error map for user-friendly messages
    for (const [key, info] of Object.entries(ERROR_MAP)) {
      if (message.includes(key) || code === key || status?.toString() === key) {
        return {
          message,
          code: code?.toString(),
          status: typeof status === 'number' ? status : undefined,
          userMessage: info.userMessage,
          retryable: info.retryable,
        }
      }
    }

    // Default error info
    return {
      message,
      code: code?.toString(),
      status: typeof status === 'number' ? status : undefined,
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
    }
  }

  // Unknown error type
  return {
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
  }
}

/**
 * Log error with context
 *
 * @param error - The error object
 * @param context - Context where error occurred (e.g., 'MenuPage.fetchMenu')
 */
export function logError(error: unknown, context?: string): void {
  const errorInfo = extractErrorInfo(error)
  const contextPrefix = context ? `[${context}]` : '[Error]'

  if (import.meta.env.DEV) {
    console.error(`${contextPrefix}`, {
      message: errorInfo.message,
      code: errorInfo.code,
      status: errorInfo.status,
      userMessage: errorInfo.userMessage,
      retryable: errorInfo.retryable,
      error,
    })
  }

  // In production, send to error tracking service (e.g., Sentry)
  if (import.meta.env.PROD) {
    // TODO: Integrate with error tracking service
    // Sentry.captureException(error, { tags: { context } })
  }
}

/**
 * Get user-friendly error message
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  return extractErrorInfo(error).userMessage
}

/**
 * Check if error is retryable
 *
 * @param error - The error object
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return extractErrorInfo(error).retryable
}

/**
 * Handle async errors with consistent logging and response format
 *
 * @param error - The error object
 * @param context - Context where error occurred
 * @param fallbackMessage - Fallback message if error.message is missing
 * @returns Standardized error response
 */
export function handleAsyncError(
  error: unknown,
  context: string,
  fallbackMessage = 'An unexpected error occurred'
): { success: false; error: string; code?: string | null; details?: unknown } {
  logError(error, context)

  const errorInfo = extractErrorInfo(error)

  return {
    success: false,
    error: errorInfo.userMessage || fallbackMessage,
    code: errorInfo.code || null,
    details: error,
  }
}

/**
 * Create a safe async wrapper that automatically handles errors
 *
 * @param asyncFn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function that returns { success, data/error }
 *
 * @example
 * ```typescript
 * const safeFetchUser = createSafeAsync(fetchUser, 'UserService.fetchUser')
 * const result = await safeFetchUser(userId)
 *
 * if (result.success) {
 *   console.log(result.data) // TypeScript knows data exists
 * } else {
 *   console.error(result.error) // TypeScript knows error exists
 * }
 * ```
 */
export function createSafeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  asyncFn: T,
  context: string
): (
  ...args: Parameters<T>
) => Promise<
  | { success: true; data: Awaited<ReturnType<T>> }
  | { success: false; error: string; code?: string | null; details?: unknown }
> {
  return async (...args: Parameters<T>) => {
    try {
      const data = (await asyncFn(...args)) as Awaited<ReturnType<T>>
      return { success: true, data }
    } catch (error) {
      return handleAsyncError(error, context, 'Operation failed')
    }
  }
}

/**
 * Handle database errors with specific error code handling
 *
 * @param error - The error object
 * @param context - Context where error occurred
 * @param options - Additional options
 * @returns Standardized error response
 */
export function handleDatabaseError(
  error: unknown,
  context: string,
  options: {
    onTableNotFound?: (error: unknown) => { success: false; error: string; code?: string }
    onPermissionDenied?: (error: unknown) => { success: false; error: string; code?: string }
  } = {}
): { success: false; error: string; code?: string } {
  const { onTableNotFound, onPermissionDenied } = options

  logError(error, context)

  const errorInfo = extractErrorInfo(error)

  // Handle specific error codes
  if (errorInfo.code === '42P01' || errorInfo.code === 'PGRST116') {
    // Table does not exist
    if (onTableNotFound) {
      return onTableNotFound(error)
    }
    return {
      success: false,
      error: errorInfo.userMessage,
      code: errorInfo.code,
    }
  }

  if (errorInfo.code === '42501') {
    // Permission denied
    if (onPermissionDenied) {
      return onPermissionDenied(error)
    }
    return {
      success: false,
      error: errorInfo.userMessage,
      code: errorInfo.code,
    }
  }

  return {
    success: false,
    error: errorInfo.userMessage,
    code: errorInfo.code,
  }
}

/**
 * Handle API errors with HTTP status code handling
 *
 * @param error - The error or response object
 * @param context - Context where error occurred
 * @returns Standardized error response
 */
export async function handleApiError(
  error: unknown,
  context: string
): Promise<{ success: false; error: string; status?: number; data?: unknown }> {
  // If it's a Response object, try to extract error message
  if (error instanceof Response) {
    try {
      const errorData = await error.json().catch(() => ({}))
      logError(error, context)

      const errorInfo = extractErrorInfo(error)

      return {
        success: false,
        error: errorInfo.userMessage || `API request failed with status ${error.status}`,
        status: error.status,
        data: errorData,
      }
    } catch (parseError) {
      logError(parseError, `${context}.parseError`)
      return {
        success: false,
        error: `API request failed with status ${error.status}`,
        status: error.status,
      }
    }
  }

  return handleAsyncError(error, context, 'API request failed')
}

/**
 * Create a safe async wrapper that automatically handles errors
 *
 * Type-safe version using `unknown` instead of `any` for better type safety.
 * The actual types are preserved via `Parameters<T>` and `ReturnType<T>`.
 *
 * @param asyncFn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function that returns { success, data/error }
 *
 * @example
 * ```typescript
 * // Wrap any async function
 * const safeFetchUser = createSafeAsync(fetchUser, 'UserService.fetchUser')
 *
 * // Use with discriminated union
 * const result = await safeFetchUser(userId)
 * if (result.success) {
 *   console.log(result.data) // TypeScript knows this is User type
 * } else {
 *   console.error(result.error) // TypeScript knows this is error string
 * }
 * ```
 */
export function createSafeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  asyncFn: T,
  context: string
): (
  ...args: Parameters<T>
) => Promise<
  | { success: true; data: Awaited<ReturnType<T>> }
  | { success: false; error: string; code?: string | null; details?: unknown }
> {
  return async (...args: Parameters<T>) => {
    try {
      const data = (await asyncFn(...args)) as Awaited<ReturnType<T>>
      return { success: true, data }
    } catch (error) {
      return handleAsyncError(error, context, 'Operation failed')
    }
  }
}
```

**Usage in Services (Real Example from buildfast-shop):**

```typescript
// ✅ CORRECT - Wrapping service functions
import { createSafeAsync } from '@/lib/error-handler'

async function fetchMenuItem(id: string): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  if (!data) throw new Error('Menu item not found')
  
  return data
}

// Create safe wrapper
const safeFetchMenuItem = createSafeAsync(fetchMenuItem, 'MenuService.fetchMenuItem')

// Usage in component
const result = await safeFetchMenuItem(itemId)

if (result.success) {
  // TypeScript knows result.data is MenuItem
  setMenuItem(result.data)
} else {
  // TypeScript knows result.error is string
  showError(result.error)
}
```

**Benefits:**
- ✅ Consistent error handling across all async operations
- ✅ Type-safe discriminated union return type
- ✅ Automatic error logging with context
- ✅ No need for try-catch in every function
- ✅ User-friendly error messages automatically applied
- ✅ Preserves original function types via generics

### Step 1.2: Logger Utility

**Logger Implementation (Real Example from Codebase):**
```typescript
// src/utils/logger.ts

const isDevelopment = import.meta.env.DEV

/**
 * Logger interface for type-safe logging
 */
export interface Logger {
  log: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  table: (...args: unknown[]) => void
  group: (label: string, fn: () => void) => void
}

/**
 * Log utility that only logs in development
 */
export const logger: Logger = {
  /**
   * Log informational messages (development only)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log error messages (always logs, but can be extended for error tracking)
   */
  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args)
    }
    // In production, could send to error tracking service
    // if (import.meta.env.PROD) {
    //   errorTrackingService.captureException(...args);
    // }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log info messages (development only)
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log table data (development only)
   */
  table: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.table(...args)
    }
  },

  /**
   * Log grouped messages (development only)
   */
  group: (label: string, fn: () => void): void => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },
}
```

### Step 1.3: Error Handler Checklist

- [ ] Error handler utility created
- [ ] Error map with user-friendly messages
- [ ] Logger utility for development/production
- [ ] Error extraction function
- [ ] Error logging function
- [ ] User-friendly error message function
- [ ] Retryable error check function
- [ ] Async error handler
- [ ] Database error handler
- [ ] API error handler
- [ ] Safe async wrapper

---

## 🛡️ PHASE 2: ERROR BOUNDARIES

### Step 2.1: Component Error Boundary

**Error Boundary Implementation (Real Example from Codebase):**
```typescript
// src/components/ErrorBoundary.tsx

import { Component, ReactNode, ErrorInfo } from 'react'
import { logger } from '../utils/logger'

export interface ErrorBoundaryProps {
  children: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isLightTheme: boolean
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private themeObserver: MutationObserver | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isLightTheme:
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('theme-light'),
    }
  }

  override componentDidMount() {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      this.setState({
        isLightTheme: document.documentElement.classList.contains('theme-light'),
      })
    }

    checkTheme()

    this.themeObserver = new MutationObserver(checkTheme)
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  override componentWillUnmount() {
    if (this.themeObserver) {
      this.themeObserver.disconnect()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    logger.error('Error caught by ErrorBoundary:', error)
    logger.error('Error Info:', errorInfo)

    // Store error info in state for display
    this.setState({
      error,
      errorInfo,
    })

    // In production, send to error tracking service
    // if (import.meta.env.PROD) {
    //   errorTrackingService.captureException(error, {
    //     contexts: { react: errorInfo }
    //   });
    // }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  override render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: this.state.isLightTheme
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(5, 5, 9, 0.95)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div
                className="mx-auto w-16 h-16 rounded-full bg-[var(--status-error-bg)] flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  className="w-8 h-8 text-[var(--color-red)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">
                Something went wrong
              </h1>
              <p className="text-[var(--text-muted)]">
                We&apos;re sorry, but something unexpected happened. Please try
                refreshing the page.
              </p>
            </div>

            {isDev && this.state.error && (
              <div className="text-left bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border-default)]">
                <p className="text-sm font-semibold text-[var(--color-red)] mb-2">
                  Error Details (Dev Only):
                </p>
                <p className="text-sm text-[var(--text-muted)] font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-[var(--text-muted)] cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-sm text-[var(--text-muted)] mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="min-h-[44px] px-6 py-2.5 bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label="Refresh page"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="min-h-[44px] px-6 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label="Go to home page"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

### Step 2.2: Page Error Boundary

**Page Error Boundary (Route-Aware) (Real Example from Codebase):**
```typescript
// src/components/PageErrorBoundary.tsx

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { logger } from '../utils/logger'

/**
 * Page Error Boundary Inner Component
 * Wraps ErrorBoundary with route-aware error handling.
 * Automatically resets error state on route change.
 */
class PageErrorBoundaryInner extends Component<
  { location: Location; children: ReactNode },
  {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
    location: Location
    isLightTheme: boolean
  }
> {
  private themeObserver: MutationObserver | null = null

  // ✅ CORRECT - Use proper types for React's getDerivedStateFromProps
  static getDerivedStateFromProps(
    props: { location: Location; children: ReactNode },
    state: { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; location: Location; isLightTheme: boolean }
  ): Partial<{ hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; location: Location }> | null {
    // Reset error state when location changes
    if (
      props.location?.pathname !== state.location?.pathname &&
      state.hasError
    ) {
      logger.log('Route changed, resetting error boundary')
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        location: props.location,
      }
    }
    return { location: props.location }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Page Error Boundary caught error:', error)
    logger.error('Error Info:', errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  // ... rest of implementation similar to ErrorBoundary
}

/**
 * Page Error Boundary Component
 * Wraps the inner component with useLocation hook.
 */
function PageErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <PageErrorBoundaryInner location={location}>
      {children}
    </PageErrorBoundaryInner>
  )
}

export default PageErrorBoundary
```

### Step 2.3: Error Boundary Usage

**Wrap App with Error Boundary:**
```typescript
// src/main.tsx
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
```

**Wrap Pages with Page Error Boundary:**
```typescript
// src/pages/MenuPage.tsx
import PageErrorBoundary from '../components/PageErrorBoundary'

function MenuPage() {
  return (
    <PageErrorBoundary>
      {/* Page content */}
    </PageErrorBoundary>
  )
}
```

### Step 2.4: Error Boundary Checklist

- [ ] Component error boundary created
- [ ] Page error boundary created (route-aware)
- [ ] Error logging in componentDidCatch
- [ ] Fallback UI with user actions
- [ ] Theme-aware styling
- [ ] Development error details
- [ ] Accessibility (ARIA, keyboard navigation)
- [ ] Error boundaries wrapped around app/pages

---

## 🔄 PHASE 3: REACT QUERY ERROR HANDLING

### Step 3.1: Query Error Handling

**Query with Error Handling:**
```typescript
// ✅ CORRECT - Handle errors in React Query
const { data, error, isLoading } = useQuery({
  queryKey: ['menuItems'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)

    if (error) {
      logError(error, 'useMenuItems')
      throw error // React Query will catch this
    }

    return data
  },
  onError: (error) => {
    const message = getUserFriendlyError(error)
    toast.error(message)
    logError(error, 'useMenuItems.onError')
  },
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('404') ||
        errorMessage.includes('400')
      ) {
        return false
      }
    }
    // Retry up to 2 times for other errors
    return failureCount < 2
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### Step 3.2: Mutation Error Handling

**Mutation with Error Handling:**
```typescript
// ✅ CORRECT - Handle errors in mutations
const mutation = useMutation({
  mutationFn: async (data: MenuItemInsert) => {
    const { data: result, error } = await supabase
      .from('menu_items')
      .insert(data)
      .select()
      .single()

    if (error) {
      logError(error, 'createMenuItem')
      throw error
    }

    return result
  },
  onError: (error) => {
    const message = getUserFriendlyError(error)
    toast.error(message)
    logError(error, 'createMenuItem.onError')
  },
  onSuccess: (data) => {
    toast.success('Menu item created successfully!')
    queryClient.invalidateQueries({ queryKey: ['menuItems'] })
  },
})
```

### Step 3.3: Global Error Handler

**Global Query Error Handler:**
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
import { getUserFriendlyError, logError } from './error-handler'
import toast from 'react-hot-toast'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        logError(error, 'Query.global')
        // Don't show toast for every query error - too noisy
        // Individual queries can show toasts if needed
      },
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase()
          if (
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('404') ||
            errorMessage.includes('400')
          ) {
            return false
          }
        }
        return failureCount < 2
      },
    },
    mutations: {
      onError: (error) => {
        const message = getUserFriendlyError(error)
        toast.error(message)
        logError(error, 'Mutation.global')
      },
    },
  },
})
```

### Step 3.4: React Query Error Handling Checklist

- [ ] Error handling in queryFn
- [ ] onError callbacks in queries
- [ ] onError callbacks in mutations
- [ ] Retry logic for transient errors
- [ ] User-friendly error messages
- [ ] Error logging with context
- [ ] Global error handlers
- [ ] Toast notifications for mutations

---

## 🗄️ PHASE 4: SUPABASE ERROR HANDLING

### Step 4.1: Supabase Query Error Handling

**Supabase Query with Error Handling:**
```typescript
// ✅ CORRECT - Handle Supabase errors
async function fetchMenuItems() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)

    if (error) {
      return handleDatabaseError(error, 'fetchMenuItems', {
        onTableNotFound: (err) => ({
          success: false,
          error: 'Menu is temporarily unavailable. Please try again later.',
          code: 'TABLE_NOT_FOUND',
        }),
        onPermissionDenied: (err) => ({
          success: false,
          error: 'You need to be logged in to view the menu.',
          code: 'PERMISSION_DENIED',
        }),
      })
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleAsyncError(error, 'fetchMenuItems', 'Failed to fetch menu items')
  }
}
```

### Step 4.2: Supabase RPC Error Handling

**RPC Function Error Handling:**
```typescript
// ✅ CORRECT - Handle RPC errors
async function createReservation(reservationData: ReservationData) {
  try {
    const { data, error } = await supabase.rpc('create_reservation', {
      _user_id: reservationData.userId,
      _customer_name: reservationData.customerName,
      // ... other params
    })

    if (error) {
      // RPC errors often have specific error messages
      if (error.code === 'P0001') {
        // PostgreSQL exception
        return {
          success: false,
          error: error.message || 'Reservation creation failed',
        }
      }

      return handleDatabaseError(error, 'createReservation')
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return handleAsyncError(error, 'createReservation', 'Failed to create reservation')
  }
}
```

### Step 4.3: Supabase Error Handling Checklist

- [ ] Check for error in Supabase responses
- [ ] Handle specific error codes (42P01, PGRST116, 42501)
- [ ] Handle RPC function errors
- [ ] Transform Supabase errors to user-friendly messages
- [ ] Log errors with context
- [ ] Return standardized error responses

---

## 📝 PHASE 5: FORM VALIDATION ERRORS

### Step 5.1: Form Error Display

**Form with Error Handling:**
```typescript
// ✅ CORRECT - Display form validation errors
function ReservationForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitError(null)

    // Client-side validation
    const validationErrors: Record<string, string> = {}
    if (!formData.customerName.trim()) {
      validationErrors.customerName = 'Name is required'
    }
    if (!formData.customerEmail.trim()) {
      validationErrors.customerEmail = 'Email is required'
    } else if (!isEmail(formData.customerEmail)) {
      validationErrors.customerEmail = 'Please enter a valid email'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Submit form
    try {
      const result = await createReservation(formData)
      if (!result.success) {
        setSubmitError(result.error)
        toast.error(result.error)
      } else {
        toast.success('Reservation created successfully!')
      }
    } catch (error) {
      const message = getUserFriendlyError(error)
      setSubmitError(message)
      toast.error(message)
      logError(error, 'ReservationForm.submit')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {errors.customerName && (
        <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
      )}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
          <p className="text-red-800 text-sm">{submitError}</p>
        </div>
      )}
    </form>
  )
}
```

### Step 5.2: Form Error Handling Checklist

- [ ] Client-side validation errors
- [ ] Server-side validation errors
- [ ] Field-level error display
- [ ] Form-level error display
- [ ] User-friendly error messages
- [ ] Error clearing on input change
- [ ] Toast notifications for errors

---

## 🌐 PHASE 6: NETWORK ERROR HANDLING

### Step 6.1: Network Error Detection

**Network Error Handling:**
```typescript
// ✅ CORRECT - Handle network errors
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    
    if (!response.ok) {
      return handleApiError(response, 'fetchData')
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    // Network errors (offline, timeout, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        success: false,
        error: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      }
    }

    return handleAsyncError(error, 'fetchData', 'Failed to fetch data')
  }
}
```

### Step 6.2: Offline Detection

**Offline Error Handling:**
```typescript
// ✅ CORRECT - Handle offline state
function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('You are offline. Please check your internet connection.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Step 6.3: Network Error Handling Checklist

- [ ] Network error detection
- [ ] Offline state detection
- [ ] User-friendly network error messages
- [ ] Retry logic for network errors
- [ ] Timeout handling
- [ ] Connection status indicators

---

## 🔁 PHASE 7: ERROR RECOVERY & RETRY

### Step 7.1: Retry Logic

**Retry with Exponential Backoff:**
```typescript
// ✅ CORRECT - Retry with exponential backoff
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  context = 'fetchWithRetry'
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on 4xx errors
      if (!isRetryableError(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const delay = Math.min(1000 * 2 ** attempt, 30000)
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, context)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  logError(lastError, context)
  throw lastError
}
```

### Step 7.2: Error Recovery Checklist

- [ ] Retry logic for transient errors
- [ ] Exponential backoff
- [ ] Max retry limits
- [ ] Skip retry for non-retryable errors
- [ ] User notification for retries
- [ ] Fallback actions

---

## 🎯 SUCCESS CRITERIA

Error handling is complete when:

1. ✅ **Error Handler**: Error handler utility created with error map
2. ✅ **Logging**: All errors logged with context
3. ✅ **User Messages**: User-friendly error messages displayed
4. ✅ **Error Boundaries**: Error boundaries implemented (component and page)
5. ✅ **React Query**: React Query errors handled properly
6. ✅ **Supabase**: Supabase errors handled with specific codes
7. ✅ **Forms**: Form validation errors displayed
8. ✅ **Network**: Network errors handled gracefully
9. ✅ **Recovery**: Retry logic for transient errors
10. ✅ **Security**: No sensitive information exposed

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- Show raw error messages to users
- Ignore errors silently
- Log sensitive information (API keys, passwords, etc.)
- Skip error boundaries
- Forget to handle network errors
- Show stack traces in production
- Retry non-retryable errors indefinitely
- Expose database error codes to users

### ✅ Do:

- Transform errors to user-friendly messages
- Log errors with context for debugging
- Use error boundaries for component errors
- Handle all error types (network, validation, server)
- Provide retry options for transient errors
- Show development errors only in dev mode
- Sanitize error messages before display
- Use error codes internally, not in user messages

---

## 📚 REFERENCE

### Files in Codebase

- **Error Handler**: `src/lib/error-handler.ts` - Error handling utilities
- **Logger**: `src/utils/logger.ts` - Environment-aware logging
- **Error Boundary**: `src/components/ErrorBoundary.tsx` - Component error boundary
- **Page Error Boundary**: `src/components/PageErrorBoundary.tsx` - Route-aware error boundary

### Error Codes Reference

- **42P01**: Table does not exist
- **PGRST116**: Relationship not found
- **42501**: Permission denied
- **401**: Unauthorized (session expired)
- **403**: Forbidden (no permission)
- **404**: Not found
- **500**: Server error

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This master prompt should be followed for ALL error handling work in the Star Café application.**
