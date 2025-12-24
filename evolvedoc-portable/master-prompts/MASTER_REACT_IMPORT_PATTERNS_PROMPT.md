# ⚛️ MASTER REACT IMPORT PATTERNS PROMPT

## Production-Grade React Import Best Practices

---

## 📋 OVERVIEW

This guide covers React import patterns for type safety, avoiding ESLint errors, and maintaining consistency across React applications. Based on real patterns from buildfast-shop production codebase.

**Applicable to:**
- React component files (.tsx)
- Type definitions using React types
- Event handlers (React.MouseEvent, React.ChangeEvent, etc.)
- React hooks and utilities
- JSX.Element return types
- Error boundaries and class components

---

## 🎯 CORE PRINCIPLES

### 1. **Explicit React Imports**
- Always import React when using React types
- Prevents `no-undef` ESLint errors
- Required for React.FC, React.MouseEvent, etc.

### 2. **Type-Only Imports**
- Use `import type` for type-only imports
- Reduces bundle size
- Clear intent for type definitions

### 3. **Consistent Import Order**
- React → External libraries → Internal modules → Assets

### 4. **Environment Variables**
- Use `import.meta.env` in Vite projects (not `process.env`)
- Prevents `no-undef` errors for environment checks

---

## 🔍 PATTERNS

### Pattern 1: Basic Component with React Types

**Real Example from buildfast-shop:**

```typescript
// ✅ CORRECT - Explicit React import
import React from 'react'

interface ButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

export function Button({ onClick, children }: ButtonProps) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  )
}
```

### Pattern 2: Event Handlers

**Real Example from buildfast-shop:**

```typescript
// ✅ CORRECT - React imported for event types
import React from 'react'

function FormInput() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle submit
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
    </form>
  )
}
```

### Pattern 3: Ref Types

**Real Example from buildfast-shop:**

```typescript
// ✅ CORRECT - React imported for RefObject
import React, { useRef } from 'react'

function Component() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  // Or using useRef directly
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  return <input ref={inputRef} />
}
```

### Pattern 4: Type-Only Imports

```typescript
// ✅ CORRECT - Type-only import for interfaces
import type { FC } from 'react'
import React from 'react'

interface Props {
  title: string
}

export const Component: FC<Props> = ({ title }) => {
  return <div>{title}</div>
}
```

### Pattern 5: Avoiding JSX.Element Explicit Types

**Real Example from buildfast-shop:**

```typescript
// ❌ UNNECESSARY - TypeScript infers return type
import React from 'react'

export function Component(): JSX.Element {
  return <div>Hello</div>
}

// ✅ CORRECT - Let TypeScript infer
import React from 'react'

export function Component() {
  return <div>Hello</div>
}
```

### Pattern 6: Error Boundaries

**Real Example from buildfast-shop:**

```typescript
// ✅ CORRECT - React imported for ErrorInfo
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>
    }
    return this.props.children
  }
}
```

### Pattern 7: Environment Variables in Vite

**Real Example from buildfast-shop:**

```typescript
// ❌ INCORRECT - process.env doesn't work in Vite
import React from 'react'

function Component() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Dev mode')
  }
  return <div>Hello</div>
}

// ✅ CORRECT - Use import.meta.env
import React from 'react'

function Component() {
  if (import.meta.env.DEV) {
    console.log('Dev mode')
  }
  return <div>Hello</div>
}

// ✅ CORRECT - With fallback
const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development'
```

---

## 🚫 COMMON MISTAKES

### Mistake 1: Missing React Import

```typescript
// ❌ INCORRECT - Causes "React is not defined" ESLint error
interface Props {
  onClick: React.MouseEvent<HTMLButtonElement>
}

// ✅ CORRECT
import React from 'react'

interface Props {
  onClick: React.MouseEvent<HTMLButtonElement>
}
```

### Mistake 2: Using process.env in Vite

```typescript
// ❌ INCORRECT - process.env doesn't work in Vite
if (process.env.NODE_ENV === 'development') {
  console.log('Dev mode')
}

// ✅ CORRECT - Use import.meta.env
if (import.meta.env.DEV) {
  console.log('Dev mode')
}
```

### Mistake 3: Unnecessary JSX.Element

```typescript
// ❌ UNNECESSARY - TypeScript infers this automatically
function Component(): JSX.Element {
  return <div>Hello</div>
}

// ✅ CORRECT - Let TypeScript infer
function Component() {
  return <div>Hello</div>
}
```

### Mistake 4: Missing React Import for Error Boundaries

```typescript
// ❌ INCORRECT - ErrorInfo not available
import { Component } from 'react'

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ErrorInfo is not defined
  }
}

// ✅ CORRECT - Import ErrorInfo explicitly
import React, { Component, ErrorInfo } from 'react'

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ErrorInfo is now available
  }
}
```

---

## 📝 IMPORT ORDER CONVENTIONS

### Standard Import Order

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react'

// 2. External libraries
import { createClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

// 3. Internal modules (using path aliases)
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// 4. Type-only imports (if separate)
import type { MenuItem } from '@/types/menu'

// 5. Assets
import logo from '@/assets/logo.png'
import './Component.css'
```

### Type-Only Imports

```typescript
// ✅ CORRECT - Type-only import
import type { FC, ReactNode } from 'react'
import React from 'react'

// ✅ CORRECT - Mixed import
import React, { useState, type ReactNode } from 'react'
```

---

## ✅ CHECKLIST

- [ ] All files using React types import React explicitly
- [ ] Event handlers use React.MouseEvent, React.ChangeEvent, etc.
- [ ] No `process.env` in Vite projects (use `import.meta.env`)
- [ ] Type-only imports use `import type` syntax
- [ ] JSX.Element return types removed (let TypeScript infer)
- [ ] Consistent import order across all files
- [ ] No ESLint `no-undef` errors for React
- [ ] Error boundaries import ErrorInfo explicitly
- [ ] Ref types use React.useRef or imported useRef
- [ ] Environment checks use `import.meta.env.DEV` or `import.meta.env.PROD`

---

## 🔧 ESLint Configuration

**Required ESLint config for React imports:**

```javascript
// eslint.config.js
{
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.browser,
      React: 'readonly',
      JSX: 'readonly',
    },
  },
  rules: {
    'no-undef': 'off', // TypeScript handles this
  },
}
```

**For test files:**

```javascript
{
  files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.browser,
    },
  },
  rules: {
    'no-undef': 'off', // Test files can use globals
  },
}
```

---

## 📚 REFERENCE

### React Types Available

- `React.FC` - Function component type
- `React.ReactNode` - Any renderable content
- `React.MouseEvent<T>` - Mouse event handler
- `React.ChangeEvent<T>` - Change event handler
- `React.FormEvent<T>` - Form event handler
- `React.RefObject<T>` - Ref object type
- `React.ErrorInfo` - Error boundary error info
- `JSX.Element` - JSX element type (usually inferred)

### Environment Variables (Vite)

- `import.meta.env.DEV` - Development mode (boolean)
- `import.meta.env.PROD` - Production mode (boolean)
- `import.meta.env.MODE` - Current mode (string)
- `import.meta.env.VITE_*` - Custom environment variables

---

## 🎯 SUCCESS CRITERIA

React import patterns are correct when:

1. ✅ No ESLint `no-undef` errors for React
2. ✅ All React types properly imported
3. ✅ Environment variables use `import.meta.env`
4. ✅ Consistent import order across files
5. ✅ Type-only imports used where appropriate
6. ✅ No unnecessary JSX.Element return types
7. ✅ Error boundaries properly typed

---

**This master prompt should be followed for ALL React import work in applications.**

