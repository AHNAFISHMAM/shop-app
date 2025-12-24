# 🔒 Master Type Safety Migration Prompt

> **Comprehensive guide for migrating JavaScript codebases to TypeScript with gradual adoption strategies**

---

## 📋 Table of Contents

1. [Migration Strategy](#migration-strategy)
2. [Type Assertion Patterns](#type-assertion-patterns)
3. [Handling Unknown Types](#handling-unknown-types)
4. [Type Guards](#type-guards)
5. [Mixed JS/TS Codebases](#mixed-jsts-codebases)
6. [Common Migration Patterns](#common-migration-patterns)
7. [Error Handling](#error-handling)
8. [Gradual Migration](#gradual-migration)
9. [Testing During Migration](#testing-during-migration)

---

## 1. Migration Strategy

### Phased Approach

```typescript
// Phase 1: Add TypeScript config, keep JS files
// tsconfig.json
{
  "compilerOptions": {
    "allowJs": true,        // Allow JavaScript files
    "checkJs": false,       // Don't type-check JS files yet
    "noEmit": true,
  },
  "include": ["src/**/*"]
}

// Phase 2: Enable JS checking for specific files
// tsconfig.json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,        // Enable checking
  }
}

// Phase 3: Migrate files one by one
// Rename .js to .ts/.tsx gradually
```

### File-by-File Migration

```typescript
// Start with utilities (low risk)
// utils/formatPrice.js → utils/formatPrice.ts
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

// Then hooks (medium risk)
// hooks/useCart.js → hooks/useCart.ts
export function useCart(): {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
} {
  // Implementation
}

// Finally components (higher risk)
// components/ProductCard.jsx → components/ProductCard.tsx
```

---

## 2. Type Assertion Patterns

### Safe Type Assertions

```typescript
// ❌ Avoid: Unsafe assertions
const data = response as UserData // No validation

// ✅ Good: Type guards first
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  )
}

if (isUserData(response)) {
  const data = response // Now safely typed
}

// ✅ Good: Assert with validation
const data = isUserData(response) ? response : null
```

### Assertion Helpers

```typescript
// utils/type-assertions.ts
export function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string')
  }
}

export function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Expected number')
  }
}

// Usage
function processData(data: unknown) {
  assertIsString(data)
  // data is now string
  return data.toUpperCase()
}
```

### Record Type Assertions

```typescript
// For Supabase/API responses
export function asRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Usage
const payload = response as unknown
if (asRecord(payload)) {
  const id = payload.id as string
  const name = payload.name as string
}
```

---

## 3. Handling Unknown Types

### Unknown vs Any

```typescript
// ❌ Avoid: any
function processData(data: any) {
  return data.value // No type safety
}

// ✅ Good: unknown
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data')
}
```

### Unknown in Error Handling

```typescript
// Error handling with unknown
try {
  await someOperation()
} catch (err: unknown) {
  // Type guard for Error
  if (err instanceof Error) {
    console.error(err.message)
    toast.error(err.message)
  } else if (typeof err === 'string') {
    console.error(err)
    toast.error(err)
  } else {
    console.error('Unknown error:', err)
    toast.error('An unexpected error occurred')
  }
}
```

### Unknown in Event Handlers

```typescript
// Event handlers
const handleChange = (e: unknown) => {
  if (
    e &&
    typeof e === 'object' &&
    'target' in e &&
    e.target &&
    typeof e.target === 'object' &&
    'value' in e.target
  ) {
    const value = (e.target as { value: string }).value
    setValue(value)
  }
}

// Better: Use proper types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
}
```

---

## 4. Type Guards

### Basic Type Guards

```typescript
// Type guard functions
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

// Usage
function processValue(value: unknown) {
  if (isString(value)) {
    return value.toUpperCase() // value is string
  }
  if (isNumber(value)) {
    return value.toFixed(2) // value is number
  }
  throw new Error('Invalid value type')
}
```

### Object Type Guards

```typescript
// Check for object properties
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    typeof (obj as { id: unknown }).id === 'string' &&
    typeof (obj as { email: unknown }).email === 'string'
  )
}

// Usage
const data: unknown = fetchUser()
if (isUser(data)) {
  console.log(data.email) // data is User
}
```

### Array Type Guards

```typescript
// Check for array of specific type
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === 'string')
  )
}

function isUserArray(value: unknown): value is User[] {
  return (
    Array.isArray(value) &&
    value.every(item => isUser(item))
  )
}
```

---

## 5. Mixed JS/TS Codebases

### Importing JS from TS

```typescript
// In TypeScript file
// @ts-expect-error - JS file, no types available
import { formatPrice } from './utils/formatPrice.js'

// Or create .d.ts file
// utils/formatPrice.d.ts
export function formatPrice(price: number): string

// Then import normally
import { formatPrice } from './utils/formatPrice.js'
```

### Exporting from JS for TS

```javascript
// utils/helpers.js
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// utils/helpers.d.ts
export function formatCurrency(amount: number): string
```

### Type Definitions for JS Files

```typescript
// types/js-modules.d.ts
declare module '@/utils/legacy-helpers' {
  export function legacyFunction(param: string): number
  export const legacyConstant: string
}

// Usage in TS
import { legacyFunction } from '@/utils/legacy-helpers'
const result: number = legacyFunction('test')
```

---

## 6. Common Migration Patterns

### Function Migration

```javascript
// Before: JS
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
```

```typescript
// After: TS
interface CartItem {
  price: number
  quantity: number
}

export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
```

### Component Migration

```javascript
// Before: JSX
export function ProductCard({ product, onAddToCart }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  )
}
```

```typescript
// After: TSX
interface Product {
  id: string
  name: string
  price: number
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  )
}
```

### Hook Migration

```javascript
// Before: JS
export function useCart() {
  const [items, setItems] = useState([])
  
  const addItem = (item) => {
    setItems(prev => [...prev, item])
  }
  
  return { items, addItem }
}
```

```typescript
// After: TS
interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  
  const addItem = useCallback((item: CartItem) => {
    setItems(prev => [...prev, item])
  }, [])
  
  return { items, addItem }
}
```

---

## 7. Error Handling

### Typed Error Handling

```typescript
// Custom error types
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Usage
try {
  await validateAndSubmit(data)
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    setFieldError(error.field, error.message)
  } else if (error instanceof NetworkError) {
    toast.error(`Network error: ${error.statusCode}`)
  } else if (error instanceof Error) {
    toast.error(error.message)
  } else {
    toast.error('An unknown error occurred')
  }
}
```

### Error Type Guards

```typescript
// Check error types
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

function isErrorWithCode(
  error: unknown
): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
}
```

---

## 8. Gradual Migration

### Migration Checklist

```typescript
// 1. Add TypeScript config
// tsconfig.json with allowJs: true

// 2. Add type definitions for external libraries
// @types/react, @types/node, etc.

// 3. Create type definitions for JS files
// *.d.ts files for existing JS modules

// 4. Migrate utilities first (low risk)
// utils/*.js → utils/*.ts

// 5. Migrate hooks (medium risk)
// hooks/*.js → hooks/*.ts

// 6. Migrate components (higher risk)
// components/*.jsx → components/*.tsx

// 7. Enable strict mode gradually
// strict: false → strict: true
// Enable one strict option at a time
```

### Strict Mode Gradual Enable

```typescript
// Step 1: Basic strict
{
  "strict": true,
  "noImplicitAny": true,
}

// Step 2: Add null checks
{
  "strictNullChecks": true,
}

// Step 3: Add function types
{
  "strictFunctionTypes": true,
}

// Step 4: Add property initialization
{
  "strictPropertyInitialization": true,
}

// Step 5: Add all strict options
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
}
```

---

## 9. Testing During Migration

### Testing Migrated Code

```typescript
// Test type safety
describe('Type Safety', () => {
  it('rejects invalid types', () => {
    // @ts-expect-error - should fail type check
    const result = calculateTotal('invalid')
    expect(result).toBeUndefined()
  })
  
  it('accepts valid types', () => {
    const items: CartItem[] = [
      { price: 10, quantity: 2 },
    ]
    const result = calculateTotal(items)
    expect(result).toBe(20)
  })
})
```

### Migration Testing Strategy

```typescript
// 1. Keep existing tests passing
// 2. Add type tests for migrated code
// 3. Test type guards
// 4. Test error handling
// 5. Test mixed JS/TS imports
```

---

## 🎯 Best Practices

1. **Start Small**: Migrate utilities and helpers first
2. **Type Guards**: Always use type guards for unknown types
3. **Avoid Any**: Use unknown instead of any
4. **Gradual Strict**: Enable strict mode options gradually
5. **Type Definitions**: Create .d.ts files for JS modules
6. **Test Coverage**: Maintain test coverage during migration
7. **Documentation**: Document type decisions and patterns
8. **Code Review**: Review type safety in PRs

---

**Version:** 1.4.0  
**Last Updated:** 2025-01-27  
**Based on:** buildfast-shop TypeScript migration experience

