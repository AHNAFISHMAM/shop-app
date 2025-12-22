# 📘 MASTER TYPESCRIPT PATTERNS PROMPT
## Production-Grade Type Safety and Type Patterns

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to using TypeScript effectively in React applications for the **Star Café** application. It covers type generation from Supabase schemas, utility types, type guards, generic types, discriminated unions, component prop types, React Query types, and advanced patterns based on actual codebase implementations.

**Applicable to:**
- Type definitions and interfaces
- Type generation from Supabase database schemas
- Utility types (Partial, Pick, Omit, Record, etc.)
- Type guards for runtime safety
- Generic types and type parameters
- Discriminated unions for state management
- Component prop types and React patterns
- React Query type patterns
- Error handling types
- Form validation types
- Advanced type manipulation

---

## 🎯 CORE PRINCIPLES

### 1. **Type Safety First**
- **Strict Mode**: Always use strict TypeScript (`strict: true` in tsconfig.json)
- **No Any**: Avoid `any` types, use `unknown` if type is truly unknown
- **Type Inference**: Leverage type inference where possible, but be explicit for public APIs
- **Explicit Types**: Explicit types for all public APIs, function parameters, and return values

### 2. **Type Generation**
- **Database Types**: Generate from Supabase schema using CLI or Studio
- **API Types**: Generate from API schemas when available
- **Keep Types Updated**: Update types when schemas change
- **Version Control**: Commit generated types to version control

### 3. **Type Patterns**
- **Utility Types**: Use built-in utility types (Partial, Pick, Omit, Record, etc.)
- **Type Guards**: Use type guards for runtime type checking
- **Discriminated Unions**: For state management and result types
- **Generic Types**: For reusable, type-safe utilities

### 4. **Codebase-Specific Patterns**
- **Database Types**: Use `Database['public']['Tables'][TableName]['Row']` pattern
- **Context Types**: Define explicit interfaces for React Context values
- **Service Response Types**: Use discriminated unions for service responses
- **Component Props**: Always define interfaces above components

---

## 🔍 PHASE 1: TYPE GENERATION FROM SUPABASE

### Step 1.1: Generate Database Types

**Using Supabase CLI (Recommended):**
```bash
# Generate types from local Supabase instance
npx supabase gen types typescript --local > src/lib/database.types.ts

# Or from remote project
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

**Using Supabase Studio:**
1. Go to Database > Types > TypeScript
2. Copy the generated types
3. Paste into `src/lib/database.types.ts`

### Step 1.2: Database Types Structure

The generated types follow this structure:

```typescript
// src/lib/database.types.ts
export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
  }
}
```

### Step 1.3: Using Generated Types

**Extract Table Types:**
```typescript
import type { Database } from '../lib/database.types'

// Extract Row type (for SELECT queries)
type MenuItem = Database['public']['Tables']['menu_items']['Row']

// Extract Insert type (for INSERT operations)
type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert']

// Extract Update type (for UPDATE operations)
type MenuItemUpdate = Database['public']['Tables']['menu_items']['Update']
```

**Type-Safe Supabase Queries:**
```typescript
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

// ✅ CORRECT - Type-safe query with explicit return type
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('is_available', true)
  .returns<Database['public']['Tables']['menu_items']['Row'][]>()

if (error) {
  logger.error('Error fetching menu items:', error)
  return
}

// data is now typed as MenuItem[]
if (data) {
  data.forEach((item) => {
    // TypeScript knows item has id, name, price, etc.
    console.log(item.name, item.price)
  })
}
```

**Type-Safe Supabase Client:**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

// ✅ CORRECT - Create typed Supabase client
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Now all queries are type-safe
const { data } = await supabase
  .from('menu_items')
  .select('*')
  // TypeScript will autocomplete table names and columns
```

### Step 1.4: Type Generation Checklist

- [ ] Types generated from latest Supabase schema
- [ ] Types committed to version control
- [ ] Types imported correctly in components
- [ ] Type-safe Supabase client created
- [ ] All queries use typed returns

---

## 🛠️ PHASE 2: UTILITY TYPES

### Step 2.1: Built-in Utility Types

**Partial<T> - Make all properties optional:**
```typescript
// Real example from StoreSettingsContext.tsx
export interface StoreSettings {
  store_name: string
  store_description: string
  tax_rate: number
  shipping_type: ShippingType
  // ... many other required fields
}

// ✅ CORRECT - Use Partial for updates
export interface StoreSettingsContextValue {
  updateSettings: (updates: Partial<StoreSettings>) => Promise<UpdateSettingsResponse>
}

// Usage - only update what's needed
await updateSettings({
  store_name: 'New Name',
  tax_rate: 0.08
  // Other fields remain unchanged
})
```

**Pick<T, K> - Select specific properties:**
```typescript
// ✅ CORRECT - Pick only needed properties
type MenuItemSummary = Pick<MenuItem, 'id' | 'name' | 'price' | 'image_url'>

// Usage in component
interface ProductCardProps {
  product: MenuItemSummary // Only needs these 4 fields
}
```

**Omit<T, K> - Remove specific properties:**
```typescript
// ✅ CORRECT - Omit sensitive fields
type PublicMenuItem = Omit<MenuItem, 'internal_notes' | 'cost_price'>

// Usage - safe to send to client
const publicMenu: PublicMenuItem[] = menuItems.map(item => {
  const { internal_notes, cost_price, ...public } = item
  return public
})
```

**Record<K, V> - Create key-value type:**
```typescript
// Real example from StoreSettingsContext.tsx
type Currency = 'USD' | 'EUR' | 'GBP' | 'BDT'

// ✅ CORRECT - Use Record for currency symbols
const symbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BDT: '৳'
}

// Type-safe currency symbol lookup
function getCurrencySymbol(currency: Currency): string {
  return symbols[currency] // TypeScript ensures all currencies are defined
}
```

**Required<T> - Make all properties required:**
```typescript
// ✅ CORRECT - Ensure all fields are present
type CompleteMenuItem = Required<MenuItem>

// Useful for validation
function validateMenuItem(item: Partial<MenuItem>): item is CompleteMenuItem {
  return (
    item.id !== undefined &&
    item.name !== undefined &&
    item.price !== undefined &&
    // ... check all required fields
  )
}
```

**Readonly<T> - Make all properties readonly:**
```typescript
// ✅ CORRECT - Prevent mutation
type ImmutableMenuItem = Readonly<MenuItem>

// Usage - prevents accidental mutations
const menuItem: ImmutableMenuItem = {
  id: '123',
  name: 'Pizza',
  price: 10.99
}

// menuItem.price = 12.99 // ❌ TypeScript error - cannot assign to readonly property
```

### Step 2.2: Custom Utility Types

**Extract Array Element Type:**
```typescript
// ✅ CORRECT - Extract element type from array
type MenuItemArray = MenuItem[]
type MenuItemElement = MenuItemArray[number] // MenuItem

// Usage in generic functions
function processItems<T extends readonly unknown[]>(
  items: T
): T[number][] {
  return items.map(item => item)
}
```

**Extract Function Return Type:**
```typescript
// ✅ CORRECT - Extract return type
type GetMenuItems = () => Promise<MenuItem[]>
type MenuItemsResult = ReturnType<GetMenuItems> // Promise<MenuItem[]>

// Extract from async function
async function fetchMenuItems(): Promise<MenuItem[]> {
  // ...
}

type FetchResult = Awaited<ReturnType<typeof fetchMenuItems>> // MenuItem[]
```

**Extract Function Parameters:**
```typescript
// ✅ CORRECT - Extract parameter types
function updateMenuItem(id: string, updates: Partial<MenuItem>): void {
  // ...
}

type UpdateParams = Parameters<typeof updateMenuItem> // [string, Partial<MenuItem>]
type MenuItemId = UpdateParams[0] // string
type MenuItemUpdates = UpdateParams[1] // Partial<MenuItem>
```

**NonNullable - Remove null and undefined:**
```typescript
// ✅ CORRECT - Remove null/undefined from union
type MaybeString = string | null | undefined
type DefiniteString = NonNullable<MaybeString> // string

// Usage with database fields
type MenuItemName = NonNullable<MenuItem['name']> // string (if name can be null)
```

### Step 2.3: Utility Types Checklist

- [ ] Partial used for update operations
- [ ] Pick used to select specific fields
- [ ] Omit used to exclude sensitive fields
- [ ] Record used for key-value mappings
- [ ] Required used for validation
- [ ] Readonly used for immutable data
- [ ] Custom utility types created when needed

---

## 🔒 PHASE 3: TYPE GUARDS

### Step 3.1: Basic Type Guards

**Primitive Type Guards:**
```typescript
// Real examples from type-guards.ts

// ✅ CORRECT - String type guard
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// ✅ CORRECT - Number type guard
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

// ✅ CORRECT - Boolean type guard
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

// ✅ CORRECT - Object type guard
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ✅ CORRECT - Array type guard
export function isArray<T>(
  value: unknown,
  guard?: (item: unknown) => item is T
): value is T[] {
  if (!Array.isArray(value)) return false
  if (guard) {
    return value.every(guard)
  }
  return true
}
```

**Usage in Components:**
```typescript
// ✅ CORRECT - Validate props
interface ComponentProps {
  data: unknown
}

function Component({ data }: ComponentProps) {
  if (!isObject(data)) {
    return <div>Invalid data</div>
  }
  
  // TypeScript now knows data is Record<string, unknown>
  if ('name' in data && isString(data.name)) {
    return <div>{data.name}</div>
  }
  
  return <div>No name found</div>
}
```

### Step 3.2: Domain-Specific Type Guards

**Database Entity Type Guards:**
```typescript
// Real examples from type-guards.ts

// ✅ CORRECT - MenuItem type guard
export function isMenuItem(
  value: unknown
): value is Database['public']['Tables']['menu_items']['Row'] {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isUUID(value.id) &&
    'name' in value &&
    isString(value.name) &&
    'price' in value &&
    isNumber(value.price)
  )
}

// ✅ CORRECT - CartItem type guard
export function isCartItem(
  value: unknown
): value is Database['public']['Tables']['cart_items']['Row'] {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isString(value.id) &&
    'user_id' in value &&
    isUUID(value.user_id) &&
    'menu_item_id' in value &&
    isUUID(value.menu_item_id) &&
    'quantity' in value &&
    isNumber(value.quantity)
  )
}

// ✅ CORRECT - Order type guard
export function isOrder(
  value: unknown
): value is Database['public']['Tables']['orders']['Row'] {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isUUID(value.id) &&
    'user_id' in value &&
    isUUID(value.user_id) &&
    'status' in value &&
    isString(value.status) &&
    'order_total' in value &&
    isNumber(value.order_total)
  )
}
```

**Usage with Supabase Responses:**
```typescript
// ✅ CORRECT - Validate Supabase response
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('id', itemId)
  .single()

if (error || !data) {
  logger.error('Error fetching menu item:', error)
  return null
}

// Type guard ensures runtime safety
if (!isMenuItem(data)) {
  logger.error('Invalid menu item data received')
  return null
}

// TypeScript now knows data is MenuItem
return data
```

### Step 3.3: Advanced Type Guards

**Generic Array Type Guard:**
```typescript
// Real example from type-guards.ts

// ✅ CORRECT - Generic array type guard
export function isArrayOf<T>(
  arr: unknown,
  guard: (item: unknown) => item is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(guard)
}

// Usage
const items = [1, 2, 3, 'invalid']
if (isArrayOf(items, isNumber)) {
  // items is number[]
  const sum = items.reduce((a, b) => a + b, 0)
}
```

**Property Existence Guards:**
```typescript
// Real examples from type-guards.ts

// ✅ CORRECT - Check for single property
export function hasProperty<K extends string>(
  value: unknown,
  prop: K
): value is Record<K, unknown> {
  return isObject(value) && prop in value
}

// ✅ CORRECT - Check for multiple properties
export function hasProperties<K extends string>(
  value: unknown,
  ...props: K[]
): value is Record<K, unknown> {
  if (!isObject(value)) return false
  return props.every((prop) => prop in value)
}

// Usage
if (hasProperties(data, 'id', 'name', 'price')) {
  // TypeScript knows data has id, name, and price
  console.log(data.id, data.name, data.price)
}
```

**Discriminated Union Type Guard:**
```typescript
// Real example from type-guards.ts

// ✅ CORRECT - Discriminated union type guard
export function isDiscriminatedUnion<T extends Record<string, unknown>>(
  value: unknown,
  discriminator: keyof T,
  expectedValue: T[keyof T]
): value is T {
  return isObject(value) && value[discriminator] === expectedValue
}

// Usage with Result type
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

function handleResult<T>(result: Result<T>) {
  if (isDiscriminatedUnion(result, 'status', 'success')) {
    // TypeScript knows result is { status: 'success'; data: T }
    console.log(result.data)
  } else {
    // TypeScript knows result is { status: 'error'; error: string }
    console.error(result.error)
  }
}
```

**Email and UUID Validation:**
```typescript
// Real examples from type-guards.ts

// ✅ CORRECT - Email type guard
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

// ✅ CORRECT - UUID type guard
export function isUUID(value: unknown): value is string {
  if (!isString(value)) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

// ✅ CORRECT - Non-empty string type guard
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0
}

// Usage in form validation
function validateEmail(email: unknown): email is string {
  if (!isEmail(email)) {
    return false
  }
  return true
}
```

### Step 3.4: Type Guard Checklist

- [ ] Basic type guards for primitives
- [ ] Domain-specific type guards for database entities
- [ ] Generic type guards for arrays
- [ ] Property existence guards
- [ ] Discriminated union guards
- [ ] Validation guards (email, UUID, etc.)
- [ ] Type guards used in components and services

---

## 🎭 PHASE 4: DISCRIMINATED UNIONS

### Step 4.1: Result Type Pattern

**Service Response Pattern:**
```typescript
// ✅ CORRECT - Discriminated union for service responses
type ServiceResponse<T> =
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: string }

// Usage in service functions
async function fetchMenuItem(id: string): Promise<ServiceResponse<MenuItem>> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return {
        status: 'error',
        data: null,
        error: error?.message || 'Failed to fetch menu item'
      }
    }

    return {
      status: 'success',
      data,
      error: null
    }
  } catch (err) {
    return {
      status: 'error',
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

// Usage in components
const result = await fetchMenuItem(itemId)

if (result.status === 'success') {
  // TypeScript knows result.data is MenuItem
  console.log(result.data.name)
} else {
  // TypeScript knows result.error is string
  console.error(result.error)
}
```

**Async State Pattern:**
```typescript
// ✅ CORRECT - Discriminated union for async state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

// Usage in React components
function useMenuItem(id: string) {
  const [state, setState] = useState<AsyncState<MenuItem>>({ status: 'idle' })

  useEffect(() => {
    setState({ status: 'loading' })
    
    fetchMenuItem(id).then((result) => {
      if (result.status === 'success') {
        setState({ status: 'success', data: result.data })
      } else {
        setState({ status: 'error', error: result.error })
      }
    })
  }, [id])

  return state
}

// Usage in component
function MenuItemDisplay({ id }: { id: string }) {
  const state = useMenuItem(id)

  switch (state.status) {
    case 'idle':
      return <div>Not loaded</div>
    case 'loading':
      return <div>Loading...</div>
    case 'success':
      // TypeScript knows state.data is MenuItem
      return <div>{state.data.name}</div>
    case 'error':
      // TypeScript knows state.error is string
      return <div>Error: {state.error}</div>
  }
}
```

### Step 4.2: Form State Pattern

**Form Validation State:**
```typescript
// ✅ CORRECT - Discriminated union for form state
type FormFieldState<T> =
  | { status: 'idle'; value: T; error: null }
  | { status: 'validating'; value: T; error: null }
  | { status: 'valid'; value: T; error: null }
  | { status: 'invalid'; value: T; error: string }

// Usage in form component
function useFormField<T>(initialValue: T, validator: (value: T) => string | null) {
  const [state, setState] = useState<FormFieldState<T>>({
    status: 'idle',
    value: initialValue,
    error: null
  })

  const validate = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'validating' }))
    
    const error = validator(state.value)
    
    if (error) {
      setState({ status: 'invalid', value: state.value, error })
    } else {
      setState({ status: 'valid', value: state.value, error: null })
    }
  }, [state.value, validator])

  return { state, validate, setValue: (value: T) => setState({ ...state, value }) }
}
```

### Step 4.3: Discriminated Union Checklist

- [ ] Result types for service responses
- [ ] Async state types for loading states
- [ ] Form state types for validation
- [ ] Type guards for discriminated unions
- [ ] Exhaustive pattern matching in switch statements

---

## 🔧 PHASE 5: GENERIC TYPES

### Step 5.1: Generic Functions

**Generic Service Function:**
```typescript
// ✅ CORRECT - Generic service function
async function fetchEntity<T>(
  table: string,
  id: string
): Promise<ServiceResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return {
        status: 'error',
        data: null,
        error: error?.message || 'Failed to fetch entity'
      }
    }

    return {
      status: 'success',
      data: data as T,
      error: null
    }
  } catch (err) {
    return {
      status: 'error',
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

// Usage
const menuItemResult = await fetchEntity<MenuItem>('menu_items', itemId)
const orderResult = await fetchEntity<Order>('orders', orderId)
```

**Generic Type Guard Factory:**
```typescript
// ✅ CORRECT - Generic type guard factory
function createTypeGuard<T>(
  validator: (value: unknown) => boolean
): (value: unknown) => value is T {
  return (value: unknown): value is T => validator(value)
}

// Usage
const isMenuItemGuard = createTypeGuard<MenuItem>((value) => {
  return (
    isObject(value) &&
    hasProperties(value, 'id', 'name', 'price') &&
    isUUID(value.id) &&
    isString(value.name) &&
    isNumber(value.price)
  )
})
```

### Step 5.2: Generic Hooks

**Generic Data Fetching Hook:**
```typescript
// ✅ CORRECT - Generic data fetching hook
function useEntity<T>(
  table: string,
  id: string | null
): {
  data: T | null
  loading: boolean
  error: string | null
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchEntity<T>(table, id).then((result) => {
      if (result.status === 'success') {
        setData(result.data)
        setError(null)
      } else {
        setData(null)
        setError(result.error)
      }
      setLoading(false)
    })
  }, [table, id])

  return { data, loading, error }
}

// Usage
const { data: menuItem, loading, error } = useEntity<MenuItem>('menu_items', itemId)
const { data: order } = useEntity<Order>('orders', orderId)
```

### Step 5.3: Generic Component Props

**Generic List Component:**
```typescript
// ✅ CORRECT - Generic list component
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
  emptyMessage?: string
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items'
}: ListProps<T>) {
  if (items.length === 0) {
    return <div>{emptyMessage}</div>
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// Usage
<List
  items={menuItems}
  renderItem={(item) => <MenuItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>
```

### Step 5.4: Generic Types Checklist

- [ ] Generic functions for reusable logic
- [ ] Generic hooks for data fetching
- [ ] Generic components for lists and tables
- [ ] Type constraints where appropriate
- [ ] Default type parameters when useful

---

## 🔧 PHASE 6: ELIMINATING @ts-ignore COMMENTS

### Step 6.1: Systematic @ts-ignore Removal Strategy

**Problem:** Codebase has 100+ `@ts-ignore` comments from JavaScript modules without types.

**Solution:** Create centralized type definitions file (`src/types/modules.d.ts`) and progressively add types.

**Pattern:**

```typescript
// src/types/modules.d.ts

// Declare module types for JS files
export interface ModuleType {
  // Type definition
}

export declare function moduleFunction(param: string): ReturnType;
export declare const ModuleComponent: React.FC<ComponentProps>;
```

**Systematic Removal Process:**

1. **Audit Phase:**
   ```bash
   # Find all @ts-ignore comments
   grep -r "@ts-ignore" src/ --count
   ```

2. **Categorize by Type:**
   - JavaScript utility modules (`lib/*.js`)
   - JavaScript components (`components/**/*.js`)
   - External libraries without types
   - Vite-specific features (`import.meta.env`, `import.meta.hot`)

3. **Create Type Definitions:**
   ```typescript
   // src/types/modules.d.ts
   
   // Utility functions
   export declare function utilityFunction(param: string): number;
   
   // React components
   export interface ComponentProps {
     prop: string;
   }
   export declare const Component: React.FC<ComponentProps>;
   
   // Vite types (global declaration)
   declare global {
     interface ImportMeta {
       env?: {
         DEV?: boolean;
         MODE?: string;
         [key: string]: unknown;
       };
       hot?: {
         send: (event: string) => void;
         on: (event: string, handler: () => void) => void;
         [key: string]: unknown;
       };
     }
   }
   ```

4. **Remove @ts-ignore Comments:**
   ```typescript
   // ❌ Before
   // @ts-ignore - JS module without types
   import { utilityFunction } from '../lib/utils';
   
   // ✅ After
   import { utilityFunction } from '../lib/utils';
   ```

**Real Example from Codebase:**

```typescript
// Added to modules.d.ts
export declare function formatPrice(value: number | string, decimals?: number): string;
export declare function getCurrencySymbol(currencyCode?: string): string;
export declare function parsePrice(price: string | number | null | undefined): number;

// Removed from 15+ component files
// @ts-ignore - JS module without types
import { formatPrice, getCurrencySymbol } from '../../lib/priceUtils';
```

**Benefits:**
- ✅ Full type safety across codebase
- ✅ Better IDE autocomplete
- ✅ Catch errors at compile time
- ✅ Self-documenting code
- ✅ Easier refactoring

**Best Practices:**
- Start with most-used modules first
- Group related types together
- Use descriptive interface names
- Export types that might be reused
- Keep `modules.d.ts` organized by category

### Step 6.2: @ts-ignore Removal Checklist

- [ ] Audit all `@ts-ignore` comments in codebase
- [ ] Categorize by module/feature type
- [ ] Create `src/types/modules.d.ts` file
- [ ] Add type definitions for JavaScript modules
- [ ] Add global type declarations (Vite, etc.)
- [ ] Remove `@ts-ignore` comments progressively
- [ ] Verify no type errors after removal
- [ ] Update documentation

---

## ⚛️ PHASE 7: REACT COMPONENT TYPES

### Step 6.1: Component Prop Types

**Basic Component Props:**
```typescript
// ✅ CORRECT - Define interface above component
interface ProductCardProps {
  product: MenuItem
  onAddToCart: (productId: string) => void
  getImageUrl: (product: MenuItem) => string
  enableCustomization?: boolean
  compact?: boolean
}

export const ProductCard = memo(({
  product,
  onAddToCart,
  getImageUrl,
  enableCustomization = false,
  compact = false
}: ProductCardProps) => {
  // Component implementation
})
```

**Component with Children:**
```typescript
// ✅ CORRECT - Use React.ReactNode for children
interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return <div className={className}>{children}</div>
}
```

**Component with Render Props:**
```typescript
// ✅ CORRECT - Use function type for render props
interface DataFetcherProps<T> {
  fetchData: () => Promise<T>
  children: (data: T | null, loading: boolean, error: string | null) => React.ReactNode
}

export function DataFetcher<T>({ fetchData, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [fetchData])

  return <>{children(data, loading, error)}</>
}
```

### Step 6.2: Context Types

**Context Value Interface:**
```typescript
// Real example from StoreSettingsContext.tsx

// ✅ CORRECT - Define context value interface
export interface StoreSettingsContextValue {
  settings: StoreSettings | null
  loading: boolean
  updateSettings: (updates: Partial<StoreSettings>) => Promise<UpdateSettingsResponse>
  refreshSettings: () => Promise<void>
  calculateShipping: (cartTotal: number) => number
  calculateTax: (subtotal: number) => number
  getCurrencySymbol: () => string
  formatPrice: (amount: number) => string
}

// ✅ CORRECT - Create typed context
const StoreSettingsContext = createContext<StoreSettingsContextValue | undefined>(undefined)

// ✅ CORRECT - Typed hook with error handling
export const useStoreSettings = (): StoreSettingsContextValue => {
  const context = useContext(StoreSettingsContext)
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider')
  }
  return context
}
```

### Step 6.3: React Query Types

**Typed Query Hooks:**
```typescript
// ✅ CORRECT - Typed React Query hook
function useMenuItem(id: string | null) {
  return useQuery({
    queryKey: ['menuItem', id],
    queryFn: async (): Promise<MenuItem> => {
      if (!id) throw new Error('ID is required')
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()
        .returns<MenuItem>()

      if (error) throw error
      if (!data) throw new Error('Menu item not found')
      
      return data
    },
    enabled: !!id
  })
}

// Usage - TypeScript knows data is MenuItem | undefined
const { data: menuItem, isLoading } = useMenuItem(itemId)
```

**Typed Mutation Hooks:**
```typescript
// ✅ CORRECT - Typed React Query mutation
function useUpdateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation<
    MenuItem, // Success type
    Error, // Error type
    { id: string; updates: Partial<MenuItem> } // Variables type
  >({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
        .returns<MenuItem>()

      if (error) throw error
      if (!data) throw new Error('Update failed')
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menuItem', data.id] })
    }
  })
}

// Usage
const updateMutation = useUpdateMenuItem()

updateMutation.mutate({
  id: itemId,
  updates: { name: 'New Name' }
})
```

### Step 6.4: React Component Types Checklist

- [ ] Interfaces defined above components
- [ ] Props typed explicitly
- [ ] Children typed as React.ReactNode
- [ ] Context values typed with interfaces
- [ ] React Query hooks fully typed
- [ ] Mutations typed with success/error/variables

---

## 🚨 PHASE 8: ERROR HANDLING TYPES

### Step 7.1: Error Types

**Custom Error Classes:**
```typescript
// ✅ CORRECT - Custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends Error {
  constructor(
    message: string,
    public resource: string,
    public id: string
  ) {
    super(message)
    this.name = 'NotFoundError'
  }
}

// Type guard for custom errors
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}
```

**Error Result Type:**
```typescript
// ✅ CORRECT - Error result type
type ErrorResult =
  | { success: true; error: null }
  | { success: false; error: { message: string; code?: string; field?: string } }

// Usage
function validateMenuItem(item: Partial<MenuItem>): ErrorResult {
  if (!item.name || item.name.trim().length === 0) {
    return {
      success: false,
      error: {
        message: 'Name is required',
        code: 'VALIDATION_ERROR',
        field: 'name'
      }
    }
  }

  if (item.price !== undefined && item.price < 0) {
    return {
      success: false,
      error: {
        message: 'Price must be positive',
        code: 'VALIDATION_ERROR',
        field: 'price'
      }
    }
  }

  return { success: true, error: null }
}
```

### Step 7.2: Error Handling Checklist

- [ ] Custom error classes for domain errors
- [ ] Type guards for error types
- [ ] Error result types for validation
- [ ] Error handling in try-catch blocks
- [ ] Error types in service responses

---

## 📝 PHASE 9: FORM VALIDATION TYPES

### Step 8.1: Form Field Types

**Form Field State:**
```typescript
// ✅ CORRECT - Form field state type
interface FormField<T> {
  value: T
  touched: boolean
  error: string | null
}

// Form state type
interface FormState {
  fields: {
    name: FormField<string>
    email: FormField<string>
    price: FormField<number>
  }
  isValid: boolean
  isSubmitting: boolean
}

// Form validation function type
type Validator<T> = (value: T) => string | null

// Usage
const nameValidator: Validator<string> = (value) => {
  if (!value.trim()) return 'Name is required'
  if (value.length < 3) return 'Name must be at least 3 characters'
  return null
}
```

### Step 8.2: Form Validation Checklist

- [ ] Form field state types
- [ ] Validator function types
- [ ] Form state interfaces
- [ ] Error message types
- [ ] Validation result types

---

## 🎯 PHASE 10: ADVANCED PATTERNS

### Step 9.1: Conditional Types

**Conditional Type Utilities:**
```typescript
// ✅ CORRECT - Conditional type for nullable fields
type NonNullableFields<T> = {
  [K in keyof T]: T[K] extends null | undefined ? never : T[K]
}

// Usage - removes null/undefined from type
type MenuItemRequired = NonNullableFields<MenuItem>

// ✅ CORRECT - Extract function return type
type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never

// Usage
async function fetchData(): Promise<MenuItem[]> {
  // ...
}

type FetchDataReturn = AsyncReturnType<typeof fetchData> // MenuItem[]
```

### Step 9.2: Mapped Types

**Mapped Type Utilities:**
```typescript
// ✅ CORRECT - Make all fields optional and nullable
type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null
}

// ✅ CORRECT - Extract readonly fields
type ReadonlyFields<T> = {
  readonly [P in keyof T]: T[P]
}

// ✅ CORRECT - Extract writable fields
type WritableFields<T> = {
  -readonly [P in keyof T]: T[P]
}
```

### Step 9.3: Template Literal Types

**String Template Types:**
```typescript
// ✅ CORRECT - Template literal types for routes
type Route = `/menu/${string}` | `/order/${string}` | `/admin/${string}`

// ✅ CORRECT - API endpoint types
type ApiEndpoint = 
  | `GET /api/menu-items`
  | `POST /api/menu-items`
  | `GET /api/menu-items/${string}`
  | `PUT /api/menu-items/${string}`
  | `DELETE /api/menu-items/${string}`
```

### Step 9.4: Advanced Patterns Checklist

- [ ] Conditional types for complex logic
- [ ] Mapped types for transformations
- [ ] Template literal types for strings
- [ ] Branded types for type safety
- [ ] Nominal typing patterns

---

## 🎯 SUCCESS CRITERIA

TypeScript implementation is complete when:

1. ✅ **Type Safety**: Zero type errors in strict mode
2. ✅ **No Any**: No `any` types (use `unknown` if needed)
3. ✅ **No @ts-ignore**: All `@ts-ignore` comments removed with proper type definitions
4. ✅ **Types Generated**: All database types generated from Supabase schema
5. ✅ **Type Guards**: Runtime type checks for external data
6. ✅ **Utility Types**: Appropriate use of built-in and custom utility types
7. ✅ **Component Props**: All component props explicitly typed
8. ✅ **Context Types**: All React Context values typed
9. ✅ **React Query**: All queries and mutations fully typed
10. ✅ **Error Handling**: Error types defined and used consistently
11. ✅ **Documentation**: Types documented with JSDoc comments

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- Use `any` types - defeats the purpose of TypeScript
- Skip type generation - leads to type drift
- Ignore type errors - fix them immediately
- Forget to update types - keep types in sync with schema
- Skip type guards - runtime safety is important
- Use type assertions excessively - prefer type guards
- Mix `interface` and `type` inconsistently - pick one pattern
- Use `@ts-ignore` without good reason - fix the underlying issue

### ✅ Do:

- Use strict mode - catch errors early
- Generate types from schemas - single source of truth
- Fix all type errors - don't ignore them
- Update types regularly - keep them in sync
- Use type guards for external data - runtime safety
- Use utility types - reduce duplication
- Document complex types - help future developers
- Use discriminated unions - for state management

---

## 📚 REFERENCE

### Type Files in Codebase

- **Database Types**: `src/lib/database.types.ts` - Generated from Supabase schema
- **Module Types**: `src/types/modules.d.ts` - Type definitions for JavaScript modules
- **Type Guards**: `src/lib/type-guards.ts` - Runtime type checking functions
- **Context Types**: `src/contexts/*.tsx` - React Context type definitions
- **Component Props**: Component files - Interface definitions above components

### Type Generation Commands

```bash
# Generate types from local Supabase
npx supabase gen types typescript --local > src/lib/database.types.ts

# Generate types from remote project
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

### Type Checking Commands

```bash
# Type check without emitting
npm run typecheck

# Type check in watch mode
npm run typecheck:watch
```

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This master prompt should be followed for ALL TypeScript work in the Star Café application.**
