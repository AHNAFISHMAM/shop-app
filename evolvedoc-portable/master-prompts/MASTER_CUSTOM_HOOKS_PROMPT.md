# 🎣 MASTER CUSTOM HOOKS DEVELOPMENT PROMPT
## Production-Grade Reusable Hook Patterns

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to building custom React hooks that are reusable, performant, type-safe, and follow React best practices for the **Star Café** application. It covers hook composition, performance optimization, error handling, integration patterns, and real-world examples from the codebase.

**Applicable to:**
- Data fetching hooks (React Query, async operations)
- Real-time subscription hooks (Supabase Realtime)
- Form state hooks (validation, submission)
- UI state hooks (modals, dropdowns, toggles)
- Utility hooks (debounce, throttle, localStorage, media queries)
- Composite hooks (combining multiple hooks)
- Performance optimization hooks

---

## 🎯 CORE PRINCIPLES

### 1. **Single Responsibility**
- Each hook should do one thing well
- Compose hooks for complex functionality
- Keep hooks focused and reusable
- Avoid hooks that do too much

### 2. **Performance Optimization**
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use refs to avoid unnecessary re-renders
- Clean up effects properly to prevent memory leaks
- Debounce/throttle expensive operations

### 3. **Type Safety**
- Full TypeScript coverage
- Proper generic types for reusability
- Type-safe return values
- Type-safe parameters
- Explicit return types

### 4. **Error Handling**
- Handle errors gracefully
- Provide error states
- Log errors with context
- Return error information
- Don't throw errors from hooks (return error state instead)

### 5. **Documentation**
- JSDoc comments for all hooks
- Clear parameter descriptions
- Usage examples
- Return value documentation

---

## 🔍 PHASE 1: HOOK DESIGN

### Step 1.1: Identify Hook Purpose

**Questions to Answer:**
```
1. What does the hook do?
2. What data/state does it manage?
3. What side effects does it handle?
4. What does it return?
5. What parameters does it need?
6. What dependencies does it have?
7. What cleanup is required?
```

### Step 1.2: Plan Hook API

**API Design Checklist:**
```
1. Input parameters (props) - minimal and clear
2. Return values (state, functions, etc.) - consistent structure
3. Error states - how errors are handled
4. Loading states - how loading is tracked
5. Cleanup requirements - what needs cleanup
6. Dependencies - what external dependencies
7. Type definitions - TypeScript interfaces
```

### Step 1.3: Hook Naming Convention

**Naming Rules:**
- Always start with `use` prefix
- Use camelCase
- Be descriptive: `useDebounce`, `useLocalStorage`, `useMediaQuery`
- Avoid abbreviations: `useDeb` ❌, `useDebounce` ✅
- Group related hooks: `useCartItems`, `useCartSummary`, `useCartActions`

---

## 🛠️ PHASE 2: UTILITY HOOKS

### Step 2.1: useToggle Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useToggle.ts

import { useState, useCallback } from 'react'

/**
 * useToggle Hook
 *
 * Toggles between two values (typically true/false).
 * Useful for boolean state management.
 *
 * @example
 * ```tsx
 * const [isOpen, toggle, setOpen, setClosed] = useToggle(false)
 *
 * <button onClick={toggle}>Toggle</button>
 * <button onClick={setOpen}>Open</button>
 * <button onClick={setClosed}>Close</button>
 * ```
 */
export function useToggle(initialValue = false): [
  boolean,
  () => void,
  () => void,
  () => void,
] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  return [value, toggle, setTrue, setFalse]
}
```

**Usage:**
```typescript
function Modal() {
  const [isOpen, toggle, open, close] = useToggle(false)

  return (
    <>
      <button onClick={open}>Open Modal</button>
      {isOpen && (
        <div>
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  )
}
```

### Step 2.2: useDebounce Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react'

/**
 * useDebounce Hook
 *
 * Debounces a value, updating it only after a specified delay.
 * Useful for search inputs, API calls, and expensive computations.
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

**Usage:**
```typescript
function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery) {
      // Only search after user stops typing for 300ms
      performSearch(debouncedQuery)
    }
  }, [debouncedQuery])

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

### Step 2.3: useThrottle Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useThrottle.ts

import { useState, useEffect, useRef } from 'react'

/**
 * useThrottle Hook
 *
 * Throttles a value, updating it at most once per specified interval.
 * Useful for scroll handlers, resize handlers, and frequent events.
 *
 * @param value - Value to throttle
 * @param limit - Time limit in milliseconds (default: 1000ms)
 * @returns Throttled value
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0)
 * const throttledScrollY = useThrottle(scrollY, 100)
 *
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY)
 *   window.addEventListener('scroll', handleScroll)
 *   return () => window.removeEventListener('scroll', handleScroll)
 * }, [])
 *
 * // Use throttledScrollY for expensive operations
 * ```
 */
export function useThrottle<T>(value: T, limit = 1000): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}
```

**Usage:**
```typescript
function ScrollIndicator() {
  const [scrollY, setScrollY] = useState(0)
  const throttledScrollY = useThrottle(scrollY, 100)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Expensive calculation only runs every 100ms
  const progress = (throttledScrollY / document.body.scrollHeight) * 100

  return <div style={{ width: `${progress}%` }} />
}
```

### Step 2.4: useLocalStorage Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useLocalStorage.ts

import { useState, useEffect, useCallback } from 'react'
import { logError } from '../lib/error-handler'

/**
 * useLocalStorage Hook
 *
 * Syncs state with localStorage with automatic serialization/deserialization,
 * error handling, and cross-tab synchronization.
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue]
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'dark')
 * const [user, setUser] = useLocalStorage<User | null>('user', null)
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      // If error also return initialValue
      logError(error, `useLocalStorage.${key}.read`)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        // Save state
        setStoredValue(valueToStore)
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        logError(error, `useLocalStorage.${key}.write`)
      }
    },
    [key, storedValue]
  )

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T)
        } catch (error) {
          logError(error, `useLocalStorage.${key}.parse`)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue]
}
```

**Usage:**
```typescript
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark')

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current theme: {theme}
    </button>
  )
}
```

### Step 2.5: useMediaQuery Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useMediaQuery.ts

import { useState, useEffect } from 'react'

/**
 * useMediaQuery Hook
 *
 * Tracks media query matches. Useful for responsive design and conditional rendering.
 *
 * @param query - Media query string
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)')
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)

    // Update state with current match value
    const updateMatches = () => {
      setMatches(mediaQuery.matches)
    }

    // Set initial value
    updateMatches()

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches)
      return () => mediaQuery.removeEventListener('change', updateMatches)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMatches)
      return () => mediaQuery.removeListener(updateMatches)
    }
  }, [query])

  return matches
}
```

**Usage:**
```typescript
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      {!prefersReducedMotion && <AnimatedComponent />}
    </div>
  )
}
```

### Step 2.6: useClickOutside Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useClickOutside.ts

import { useEffect, useRef, type RefObject } from 'react'

/**
 * useClickOutside Hook
 *
 * Detects clicks outside of a referenced element.
 * Useful for closing modals, dropdowns, and popovers.
 *
 * @param ref - Ref to the element to detect outside clicks for
 * @param handler - Callback function to execute on outside click
 * @param enabled - Whether the hook is enabled (default: true)
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null)
 * const [isOpen, setIsOpen] = useState(false)
 *
 * useClickOutside(ref, () => setIsOpen(false))
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true
): void {
  const handlerRef = useRef(handler)

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }

      handlerRef.current(event)
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, enabled])
}
```

**Usage:**
```typescript
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen)

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  )
}
```

### Step 2.7: usePrevious Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/usePrevious.ts

import { useRef, useEffect } from 'react'

/**
 * usePrevious Hook
 *
 * Stores the previous value of a variable.
 * Useful for comparing previous and current values.
 *
 * @param value - Value to track
 * @returns Previous value
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0)
 * const prevCount = usePrevious(count)
 *
 * useEffect(() => {
 *   if (prevCount !== undefined && count > prevCount) {
 *     console.log('Count increased')
 *   }
 * }, [count, prevCount])
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
```

**Usage:**
```typescript
function Counter() {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)

  useEffect(() => {
    if (prevCount !== undefined) {
      if (count > prevCount) {
        console.log('Count increased')
      } else if (count < prevCount) {
        console.log('Count decreased')
      }
    }
  }, [count, prevCount])

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

### Step 2.8: useWindowSize Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useWindowSize.ts

import { useState, useEffect } from 'react'
import { useThrottle } from './useThrottle'

/**
 * Window size object
 */
export interface WindowSize {
  width: number
  height: number
}

/**
 * useWindowSize Hook
 *
 * Tracks window dimensions (width and height).
 * Useful for responsive layouts and conditional rendering.
 *
 * @param throttleMs - Throttle delay in milliseconds (default: 100ms)
 * @returns Window size object with width and height
 *
 * @example
 * ```tsx
 * const { width, height } = useWindowSize()
 * const isMobile = width < 768
 * ```
 */
export function useWindowSize(throttleMs = 100): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 }
    }
  return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  })

  const [throttledWidth, setThrottledWidth] = useState(windowSize.width)
  const [throttledHeight, setThrottledHeight] = useState(windowSize.height)

  // Throttle width and height separately
  const throttledW = useThrottle(windowSize.width, throttleMs)
  const throttledH = useThrottle(windowSize.height, throttleMs)

  useEffect(() => {
    setThrottledWidth(throttledW)
  }, [throttledW])

  useEffect(() => {
    setThrottledHeight(throttledH)
  }, [throttledH])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    width: throttledWidth,
    height: throttledHeight,
  }
}
```

**Usage:**
```typescript
function ResponsiveLayout() {
  const { width, height } = useWindowSize()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {!isMobile && !isTablet && <DesktopLayout />}
    </div>
  )
}
```

### Step 2.9: useBodyScrollLock Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useBodyScrollLock.ts

import { useEffect, useRef } from 'react'

/**
 * Hook to lock/unlock body scroll when modal is open
 * Preserves scroll position and restores it when modal closes
 *
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const scrollOffsetRef = useRef<number>(0)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const body = document.body
    if (!body) return

    const unlock = () => {
      body.classList.remove('modal-open')
      body.style.overflow = ''
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      window.scrollTo(0, scrollOffsetRef.current || 0)
    }

    if (isLocked) {
      scrollOffsetRef.current = window.scrollY || window.pageYOffset || 0
      body.classList.add('modal-open')
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
      body.style.top = `-${scrollOffsetRef.current}px`
      body.style.width = '100%'

      return unlock
    }

    unlock()
  }, [isLocked])
}
```

**Usage:**
```typescript
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className="modal">
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### Step 2.10: Utility Hooks Checklist

- [ ] useToggle - Boolean state management
- [ ] useDebounce - Debounce values
- [ ] useThrottle - Throttle values
- [ ] useLocalStorage - Sync with localStorage
- [ ] useMediaQuery - Track media queries
- [ ] useClickOutside - Detect outside clicks
- [ ] usePrevious - Track previous values
- [ ] useWindowSize - Track window dimensions
- [ ] useBodyScrollLock - Lock body scroll

---

## 🔄 PHASE 3: DATA FETCHING HOOKS

### Step 3.1: useAsync Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useAsync.ts

import { useState, useCallback, useRef, useEffect } from 'react'
import { logError } from '../lib/error-handler'

/**
 * Async state
 */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * useAsync hook
 *
 * Manages async operations with loading, error, and data states.
 * Useful for handling async functions outside of React Query.
 *
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute immediately (default: false)
 * @returns Async state and execute function
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(async () => {
 *   const response = await fetch('/api/data')
 *   return response.json()
 * })
 *
 * useEffect(() => {
 *   execute()
 * }, [])
 * ```
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = false
): AsyncState<T> & { execute: () => Promise<void>; reset: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(immediate)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await asyncFunction()
      if (mountedRef.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      logError(error, 'useAsync.execute')
      if (mountedRef.current) {
        setError(error)
        setData(null)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return { data, loading, error, execute, reset }
}
```

**Usage:**
```typescript
function DataFetcher() {
  const { data, loading, error, execute, reset } = useAsync(
    async () => {
      const response = await fetch('/api/data')
      return response.json()
    },
    false // Don't execute immediately
  )

  return (
    <div>
      <button onClick={execute}>Fetch Data</button>
      <button onClick={reset}>Reset</button>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
    </div>
  )
}
```

### Step 3.2: React Query Data Fetching Hook

**Pattern for React Query Hooks:**
```typescript
// ✅ CORRECT - React Query hook pattern
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logError } from '../lib/error-handler'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook to fetch user profile
 * 
 * @returns Query result with profile data
 */
export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        logError(error, 'useProfile')
        throw error
      }

      return data
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**Usage:**
```typescript
function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!profile) return <div>No profile found</div>

  return <div>Welcome, {profile.name}!</div>
}
```

### Step 3.3: Data Fetching Hooks Checklist

- [ ] useAsync - Generic async operations
- [ ] React Query hooks - Data fetching with caching
- [ ] Error handling in hooks
- [ ] Loading states
- [ ] Mounted refs for async operations
- [ ] Cleanup on unmount

---

## 🔴 PHASE 4: REAL-TIME HOOKS

### Step 4.1: useRealtimeChannel Hook

**Complete Implementation (Real Example from Codebase):**
```typescript
// src/hooks/useRealtimeChannel.ts

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logError } from '../lib/error-handler'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Real-time subscription options
 */
export interface UseRealtimeChannelOptions {
  /** Table name to subscribe to */
  table: string
  /** Event types to listen for (default: '*') */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  /** Filter string (e.g., 'user_id=eq.123') */
  filter?: string
  /** React Query keys to invalidate on changes */
  queryKeys: (string | number)[][]
  /** Whether subscription is enabled */
  enabled?: boolean
  /** Channel name (auto-generated if not provided) */
  channelName?: string
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number
  /** Custom callback for handling payloads */
  // ✅ CORRECT - Use generic type parameter for payload data
  // Note: Supabase's RealtimePostgresChangesPayload uses generic for row type
  // If you know the table structure, specify it: RealtimePostgresChangesPayload<TableRow>
  onPayload?: <T = Record<string, unknown>>(payload: RealtimePostgresChangesPayload<T>) => void
  /** Schema name (default: 'public') */
  schema?: string
}

/**
 * useRealtimeChannel hook
 *
 * Sets up a Supabase real-time subscription with automatic cleanup,
 * debounced cache invalidation, and error handling.
 *
 * @example
 * ```tsx
 * useRealtimeChannel({
 *   table: 'orders',
 *   filter: `user_id=eq.${user.id}`,
 *   queryKeys: [['orders', user.id], ['order-summary', user.id]],
 *   enabled: !!user?.id,
 * })
 * ```
 */
export function useRealtimeChannel(options: UseRealtimeChannelOptions): void {
  const {
    table,
    event = '*',
    filter,
    queryKeys,
    enabled = true,
    channelName,
    debounceMs = 300,
    onPayload,
    schema = 'public',
  } = options

  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Debounced cache invalidation
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        // Invalidate all specified query keys
        queryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey })
        })
      }
    }, debounceMs)
  }, [queryClient, queryKeys, debounceMs])

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !supabase) return

    // Cleanup any existing channel
    if (channelRef.current) {
      try {
      supabase.removeChannel(channelRef.current)
      } catch (error) {
        logError(error, 'useRealtimeChannel.cleanup')
      }
      channelRef.current = null
    }

    // Generate channel name if not provided
    const finalChannelName =
      channelName || `realtime-${table}-${filter || 'all'}-${Date.now()}`

    // Build subscription config
    const subscriptionConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema,
      table,
    }

    if (filter) {
      subscriptionConfig.filter = filter
    }

    const channel = supabase
      .channel(finalChannelName)
      .on('postgres_changes', subscriptionConfig, (payload) => {
          if (!isMountedRef.current) return

        // Call custom payload handler if provided
        if (onPayload) {
          try {
            onPayload(payload)
          } catch (error) {
            logError(error, 'useRealtimeChannel.onPayload')
          }
        }

        // Debounced cache invalidation
          debouncedInvalidate()
      })
      .subscribe((status) => {
        if (!isMountedRef.current) return

        if (process.env.NODE_ENV === 'development') {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${table}`, {
              filter,
              channelName: finalChannelName,
            })
          } else if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            console.warn(`[Realtime] Channel status: ${status} for ${table}`, {
              filter,
              channelName: finalChannelName,
            })
          }
        }

        // Log errors in production
        if (status === 'CHANNEL_ERROR') {
          logError(
            new Error(`Realtime channel error for ${table}`),
            'useRealtimeChannel.subscribe'
          )
        }
      })

    channelRef.current = channel

    return () => {
      isMountedRef.current = false

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Remove channel
      if (channelRef.current) {
        try {
        supabase.removeChannel(channelRef.current)
        } catch (error) {
          logError(error, 'useRealtimeChannel.unmount')
        }
        channelRef.current = null
      }
    }
  }, [
    enabled,
    table,
    event,
    filter,
    schema,
    channelName,
    queryKeys,
    debouncedInvalidate,
    onPayload,
  ])
}
```

**Usage:**
```typescript
function OrdersPage() {
  const { user } = useAuth()

  useRealtimeChannel({
    table: 'orders',
    filter: `user_id=eq.${user?.id}`,
    queryKeys: [['orders', user?.id]],
    enabled: !!user?.id,
  })

  // Orders will automatically update when changed in database
  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: fetchOrders,
  })

  return <div>{/* Orders list */}</div>
}
```

### Step 4.2: Real-time Hooks Checklist

- [ ] useRealtimeChannel - Generic real-time subscription
- [ ] Channel cleanup on unmount
- [ ] Debounced cache invalidation
- [ ] Mounted refs to prevent updates after unmount
- [ ] Error handling for connection issues
- [ ] Custom payload handlers

---

## 📝 PHASE 5: FORM HOOKS

### Step 5.1: useForm Hook Pattern

**Form Hook with Validation (Real Example from Codebase):**
```typescript
// src/hooks/useForm.ts

import { useState, useCallback, useRef } from 'react'

export type FieldValidator<T = any> = (value: T) => string | null

export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidator<T[K]>
}

export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T
  validationSchema?: ValidationSchema<T>
  onSubmit: (values: T) => void | Promise<void>
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setError: <K extends keyof T>(field: K, error: string | null) => void
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void
  handleChange: <K extends keyof T>(
    field: K
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBlur: <K extends keyof T>(field: K) => () => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  reset: () => void
}

// Implementation details...
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  // Full implementation with validation, error handling, etc.
  // See codebase for complete implementation
}
```

**Usage:**
```typescript
function LoginForm() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: {
      email: (value) => (!value ? 'Email is required' : null),
      password: (value) => (!value ? 'Password is required' : null),
    },
    onSubmit: async (values) => {
      await login(values.email, values.password)
    },
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        value={form.values.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
      />
      {form.touched.email && form.errors.email && (
        <div>{form.errors.email}</div>
      )}
      <button type="submit" disabled={form.isSubmitting}>
        Submit
      </button>
    </form>
  )
}
```

### Step 5.2: Form Hooks Checklist

- [ ] useForm - Form state and validation
- [ ] Field-level validation
- [ ] Form-level validation
- [ ] Error handling
- [ ] Submission handling
- [ ] Reset functionality

---

## 🎭 PHASE 6: COMPOSITE HOOKS

### Step 6.1: Composite Hook Pattern

**Combining Multiple Hooks:**
```typescript
/**
 * Composite hook that combines multiple hooks
 */
export function useProfileWithRealtime() {
  const profileQuery = useProfile()
  useRealtimeProfile() // Side effect hook

  return profileQuery
}

/**
 * Composite hook for cart with real-time updates
 */
export function useCartWithRealtime() {
  const { user } = useAuth()
  const cartQuery = useCartItems({ user })
  
  useRealtimeChannel({
    table: 'cart_items',
    filter: `user_id=eq.${user?.id}`,
    queryKeys: [['cart', 'items', user?.id]],
    enabled: !!user?.id,
  })

  return cartQuery
}
```

### Step 6.2: Composite Hooks Checklist

- [ ] Combine related hooks
- [ ] Maintain single responsibility
- [ ] Document composite behavior
- [ ] Type-safe return values

---

## ⚡ PHASE 7: PERFORMANCE OPTIMIZATION

### Step 7.1: Memoization Patterns

**useMemo for Expensive Computations:**
```typescript
function useExpensiveCalculation(data: Data[]) {
  const result = useMemo(() => {
    // Expensive calculation
    return data.map(/* complex transformation */)
  }, [data])

  return result
}
```

**useCallback for Stable References:**
```typescript
function useStableCallback() {
  const callback = useCallback((value: string) => {
    // Handler logic
  }, [dependencies])

  return callback
}
```

### Step 7.2: Performance Checklist

- [ ] Memoize expensive computations
- [ ] Memoize callbacks
- [ ] Use refs for latest values
- [ ] Debounce/throttle expensive operations
- [ ] Clean up effects properly

---

## 🎯 SUCCESS CRITERIA

A custom hook is complete when:

1. ✅ **Functionality**: Hook works correctly
2. ✅ **Type Safety**: Full TypeScript coverage
3. ✅ **Performance**: Optimized with memoization
4. ✅ **Error Handling**: Errors handled gracefully
5. ✅ **Cleanup**: All effects cleaned up properly
6. ✅ **Documentation**: JSDoc comments added
7. ✅ **Reusability**: Hook is reusable across components
8. ✅ **Testing**: Hook is tested (if applicable)

---

## 🚨 COMMON PITFALLS

### Pitfall 1: Conditional Hook Calls

**Problem:** Hooks called conditionally violate Rules of Hooks

**Real Example from buildfast-shop:**

```typescript
// ❌ Bad: Conditional hook call
function CartItemCard({ item }: Props) {
  if (!item) return null
  const memoizedValue = useMemo(() => compute(item), [item]) // ERROR!
}

// ✅ Good: Always call hooks unconditionally
function CartItemCard({ item }: Props) {
  // Call ALL hooks at the top, before any early returns
  const memoizedValue = useMemo(() => {
    if (!item) return null
    return compute(item)
  }, [item])
  
  if (!item) return null
  // ... rest of component
}
```

**Solution Pattern:**
- Always call hooks at the top level of the component
- Move conditional logic inside the hook (useMemo, useCallback)
- Use early returns only after all hooks are called

### Pitfall 2: Missing Dependencies in useEffect/useCallback

**Real Example from buildfast-shop:**

```typescript
// ❌ Bad: Missing dependencies
const handleAddToCart = useCallback(() => {
  // Uses: currentStock, hasVariants
}, []) // Missing dependencies!

// ✅ Good: Include all dependencies
const handleAddToCart = useCallback(() => {
  // Uses: currentStock, hasVariants
}, [currentStock, hasVariants]) // Include all used values

// ✅ Good: Use refs for stable values that shouldn't trigger re-renders
const queryClientRef = useRef(queryClient)
useEffect(() => {
  queryClientRef.current = queryClient
}, [queryClient])

// Then use queryClientRef.current in callbacks
const debouncedInvalidate = useCallback(() => {
  queryClientRef.current.invalidateQueries({ queryKey })
}, [queryKey]) // queryClient not needed - using ref
```

### Pitfall 3: Unused Variables

**Real Example from buildfast-shop:**

```typescript
// ❌ Bad: Unused variable warning
const categories = useState([]) // Warning: unused

// ✅ Good: Prefix with _ to explicitly mark as intentionally unused
const [_categories, setCategories] = useState([])
const _unusedFunction = () => {} // Will be used later

// ESLint config should allow this:
'@typescript-eslint/no-unused-vars': [
  'warn',
  { 
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
  },
]
```

### ❌ Don't:

- Forget cleanup in effects (memory leaks)
- Skip memoization for expensive operations (performance issues)
- Ignore error handling (poor UX)
- Use stale closures (bugs)
- Forget mounted ref for async operations (React warnings)
- Skip TypeScript types (type safety)
- Return inconsistent structures (confusing API)
- Mix concerns in one hook (hard to maintain)
- **Call hooks conditionally (Rules of Hooks violation)**
- **Omit dependencies from dependency arrays**

### ✅ Do:

- Clean up all effects
- Memoize expensive computations
- Handle errors gracefully
- Use refs for latest values
- Check mounted state before updates
- Type everything
- Return consistent structures
- Keep hooks focused and single-purpose
- **Always call hooks unconditionally at the top level**
- **Include all dependencies in dependency arrays**
- **Use refs for values that shouldn't trigger re-renders**

---

## 📚 REFERENCE

### Hooks in Codebase

- **Utility Hooks**: `src/hooks/useToggle.ts`, `src/hooks/useDebounce.ts`, `src/hooks/useThrottle.ts`, `src/hooks/useLocalStorage.ts`, `src/hooks/useMediaQuery.ts`, `src/hooks/useClickOutside.ts`, `src/hooks/usePrevious.ts`, `src/hooks/useWindowSize.ts`, `src/hooks/useBodyScrollLock.ts`
- **Data Hooks**: `src/hooks/useAsync.ts`
- **Real-time Hooks**: `src/hooks/useRealtimeChannel.ts`
- **Form Hooks**: `src/hooks/useForm.ts`

### Hook Export Pattern

```typescript
// src/hooks/index.ts
export { useToggle } from './useToggle'
export { useDebounce } from './useDebounce'
export { useThrottle } from './useThrottle'
// ... other hooks
```

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This master prompt should be followed for ALL custom hook development work in the Star Café application.**
